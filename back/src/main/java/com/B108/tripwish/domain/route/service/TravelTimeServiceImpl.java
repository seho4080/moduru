package com.B108.tripwish.domain.route.service;

import com.B108.tripwish.domain.route.dto.response.LegResponseDto;
import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.infra.google.GoogleDirectionsClient;
import com.B108.tripwish.websocket.dto.request.EventRequestDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TravelTimeServiceImpl implements TravelTimeService {

    private final GoogleDirectionsClient google;
    private final WantPlaceRepository wantPlaceRepository;
    private final PlaceInfoResolver placeInfoResolver;

    private final ObjectMapper om = new ObjectMapper();
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    @Override
    public RouteResultResponseDto estimateAuto(Long roomId, int day, LocalDate date, List<EventRequestDto> events) {
        // 0) 유효성 + 정렬
        if (events == null || events.size() < 2) return RouteResultResponseDto.empty();
        List<EventRequestDto> ordered = events.stream()
                .sorted(Comparator.comparing(EventRequestDto::getOrder))
                .toList();

        // 1) wantId -> 좌표 해석
        List<Node> nodes = resolveNodes(ordered);

        // 2) 근거리 여부 판단 (첫 구간의 직선거리)
        double meters = haversineMeters(nodes.get(0).lat, nodes.get(0).lng, nodes.get(1).lat, nodes.get(1).lng);
        boolean near = meters <= 1500.0;

        if (near) {
            // 도보/대중교통 둘 다 계산해서 더 짧은 쪽 선택 (현재는 block()이라 실병렬 X)
            Mono<RouteResultResponseDto> walk = Mono.fromSupplier(() -> estimateWalking(roomId, day, nodes));
            Mono<RouteResultResponseDto> tran = Mono.fromSupplier(() -> estimateTransitPerLeg(roomId, day, date, nodes));

            return Mono.zip(walk, tran)
                    .map(t -> t.getT1().getTotalDurationSec() <= t.getT2().getTotalDurationSec() ? t.getT1() : t.getT2())
                    .block();
        } else {
            // 원거리면 대중교통 우선
            return estimateTransitPerLeg(roomId, day, date, nodes);
        }
    }

    /** WALKING: 한 번 호출(waypoints 포함)로 모든 leg 시간 계산 */
    private RouteResultResponseDto estimateWalking(Long roomId, int day, List<Node> nodes) {
        if (nodes.size() < 2) return RouteResultResponseDto.empty();

        String origin = ll(nodes.get(0));
        String dest   = ll(nodes.get(nodes.size() - 1));
        String wps    = google.joinWaypointsFromPoints(
                nodes.stream().map(n -> new GoogleDirectionsClient.LatLng(n.lat, n.lng)).toList(),
                false // 정차 지점으로 넣어서 legs 생성
        );

        String json = google.walking(origin, dest, wps).block();
        return parseWholeRoute(roomId, day, json, nodes, "walking");
    }

    /** TRANSIT: 각 leg마다 이전 이벤트의 endTime(없으면 now)을 departure_time으로 넣어 개별 호출 */
    private RouteResultResponseDto estimateTransitPerLeg(Long roomId, int day, LocalDate date, List<Node> nodes) {
        if (nodes.size() < 2) return RouteResultResponseDto.empty();

        long totalDist = 0, totalSec = 0;
        List<LegResponseDto> legs = new ArrayList<>();

        for (int i = 0; i < nodes.size() - 1; i++) {
            Node from = nodes.get(i);
            Node to   = nodes.get(i + 1);

            Instant dep = (from.endTime != null)
                    ? ZonedDateTime.of(date, from.endTime, ZONE).toInstant()
                    : Instant.now();

            String json = google.transit(ll(from), ll(to), null, dep).block();
            LegResponseDto leg = parseSingleLeg(json, from.wantId, to.wantId());
            legs.add(leg);

            totalDist += leg.getDistanceMeters();
            totalSec  += leg.getDurationSec();
        }

        return RouteResultResponseDto.builder()
                .roomId(roomId)
                .day(day)
                .mode("transit")
                .totalDistanceMeters(totalDist)
                .totalDurationSec(totalSec)
                .legs(legs)
                .polyline(null)
                .build();
    }

    // --------------------- 좌표 해석 ---------------------

    /** EventRequestDto(order, wantId, endTime) → Node(wantId, lat, lng, endTime) */
    private List<Node> resolveNodes(List<EventRequestDto> ordered) {
        List<Long> ids = ordered.stream().map(EventRequestDto::getWantId).toList();
        List<WantPlace> wantPlaces = wantPlaceRepository.findAllById(ids);
        Map<Long, WantPlace> wpMap = wantPlaces.stream().collect(Collectors.toMap(WantPlace::getId, w -> w));

        // 좌표 캐시/프리로드(있다면)
        placeInfoResolver.preload(wantPlaces);

        List<Node> nodes = new ArrayList<>(ordered.size());
        for (EventRequestDto e : ordered) {
            WantPlace wp = wpMap.get(e.getWantId());
            if (wp == null) throw new IllegalArgumentException("Invalid wantId: " + e.getWantId());

            PlaceInfo info = placeInfoResolver.getPlaceInfo(wp);
            if (info == null || info.getLat() == null || info.getLng() == null) {
                throw new IllegalStateException("No coordinates for wantId=" + e.getWantId());
            }
            nodes.add(new Node(wp.getId(), info.getLat(), info.getLng(), e.getEndTime()));
        }
        return nodes;
    }

    // --------------------- 파서 ---------------------

    /** 도보 전체 경로 응답 → legs[] 순회해 합계/목록 생성 */
    private RouteResultResponseDto parseWholeRoute(Long roomId, int day, String json, List<Node> nodes, String mode) {
        try {
            JsonNode root = om.readTree(json);
            if (!"OK".equals(root.path("status").asText())) {
                return RouteResultResponseDto.empty();
            }
            JsonNode route0 = root.path("routes").get(0);
            JsonNode legsNode = route0.path("legs");

            long totalDist = 0, totalSec = 0;
            List<LegResponseDto> legs = new ArrayList<>();

            for (int i = 0; i < legsNode.size(); i++) {
                JsonNode leg = legsNode.get(i);
                long dist = leg.path("distance").path("value").asLong(0);
                long dur  = leg.path("duration").path("value").asLong(0); // walking: duration만 사용
                totalDist += dist;
                totalSec  += dur;

                long fromId = nodes.get(i).wantId;
                long toId   = nodes.get(i + 1).wantId;
                legs.add(LegResponseDto.builder()
                        .fromWantId(fromId).toWantId(toId)
                        .distanceMeters(dist).durationSec(dur)
                        .build());
            }
            String polyline = route0.path("overview_polyline").path("points").asText(null);

            return RouteResultResponseDto.builder()
                    .roomId(roomId)
                    .day(day)
                    .mode(mode)
                    .totalDistanceMeters(totalDist)
                    .totalDurationSec(totalSec)
                    .legs(legs)
                    .polyline(polyline)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Directions parse failed", e);
        }
    }

    /** 대중교통 단일 구간 응답 → LegResponseDto */
    private LegResponseDto parseSingleLeg(String json, long fromId, long toId) {
        try {
            JsonNode root = om.readTree(json);
            if (!"OK".equals(root.path("status").asText())) {
                // 실패 시 0으로 반환(필요하면 걷기 추정치로 대체 가능)
                return LegResponseDto.builder()
                        .fromWantId(fromId).toWantId(toId)
                        .distanceMeters(0).durationSec(0)
                        .build();
            }
            JsonNode leg = root.path("routes").get(0).path("legs").get(0);
            long dist = leg.path("distance").path("value").asLong(0);
            long dur  = leg.path("duration").path("value").asLong(0);

            return LegResponseDto.builder()
                    .fromWantId(fromId).toWantId(toId)
                    .distanceMeters(dist).durationSec(dur)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Directions parse failed", e);
        }
    }

    // --------------------- 유틸 ---------------------

    private static String ll(Node n) { return n.lat + "," + n.lng; }

    private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2)*Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /** 내부 도메인 노드 (wantId + 좌표 + endTime) */
    private record Node(long wantId, double lat, double lng, LocalTime endTime) {}
}
