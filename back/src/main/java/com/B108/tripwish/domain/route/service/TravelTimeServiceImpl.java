package com.B108.tripwish.domain.route.service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.route.dto.response.LegResponseDto;
import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.domain.schedule.entity.TransportType;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.infra.google.GoogleDirectionsClient;
import com.B108.tripwish.infra.kakao.KakaoNaviClient;
import com.B108.tripwish.infra.kakao.dto.KakaoWayPointRequestDto;
import com.B108.tripwish.websocket.dto.request.EventRequestDto;
import com.B108.tripwish.websocket.dto.request.TravelTimeCalcRequestDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class TravelTimeServiceImpl implements TravelTimeService {

  private final GoogleDirectionsClient google;
  private final KakaoNaviClient kakao;
  private final WantPlaceRepository wantPlaceRepository;
  private final PlaceInfoResolver placeInfoResolver;

  private final ObjectMapper om = new ObjectMapper();
  private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

  /* =========================================================
   * 새 엔트리 포인트: 웹소켓 payload 기준으로 라우팅
   * ========================================================= */
  public RouteResultResponseDto estimate(TravelTimeCalcRequestDto payload) {
    return estimate(
        payload.getRoomId(),
        payload.getDay(),
        payload.getDate(),
        payload.getTransport(),
        payload.getEvents());
  }

  public RouteResultResponseDto estimate(
      Long roomId, int day, LocalDate date, String transport, List<EventRequestDto> events) {
    if (events == null || events.size() < 2) return RouteResultResponseDto.empty();

    // 정렬 + wantId -> 좌표 해석
    List<EventRequestDto> ordered =
        events.stream().sorted(Comparator.comparing(EventRequestDto::getEventOrder)).toList();
    List<Node> nodes = resolveNodes(ordered);

    String mode = (transport == null) ? "" : transport.trim().toLowerCase();
    switch (mode) {
      case "driving":
        return estimateDrivingWithKakao(roomId, day, nodes);
      case "transit":
        // ✅ 근거리면 walking vs transit 비교하여 더 짧은 쪽 선택
        return estimateTransitOrWalkingSmart(roomId, day, date, nodes);
      case "walking":
        return estimateWalking(roomId, day, nodes);
      default:
        // fallback: 휴리스틱
        return estimateAuto(roomId, day, date, ordered);
    }
  }

  /* =========================================================
   * 기존 휴리스틱 (근거리: 도보/대중교통 중 짧은 쪽, 원거리: 대중교통)
   * ========================================================= */
  @Override
  public RouteResultResponseDto estimateAuto(
      Long roomId, int day, LocalDate date, List<EventRequestDto> events) {
    if (events == null || events.size() < 2) return RouteResultResponseDto.empty();
    List<EventRequestDto> ordered =
        events.stream().sorted(Comparator.comparing(EventRequestDto::getEventOrder)).toList();

    List<Node> nodes = resolveNodes(ordered);
    double meters =
        haversineMeters(nodes.get(0).lat, nodes.get(0).lng, nodes.get(1).lat, nodes.get(1).lng);
    // 근거리 기준을 늘려서 도보 계산도 함께 수행 (1000m 이하)
    boolean near = meters <= 1000.0;

    if (near) {
      Mono<RouteResultResponseDto> walk =
          Mono.fromSupplier(() -> estimateWalking(roomId, day, nodes));
      Mono<RouteResultResponseDto> tran =
          Mono.fromSupplier(() -> estimateTransitPerLeg(roomId, day, date, nodes));
      return Mono.zip(walk, tran)
          .map(
              t ->
                  t.getT1().getTotalDurationSec() <= t.getT2().getTotalDurationSec()
                      ? t.getT1()
                      : t.getT2())
          .block();
    } else {
      return estimateTransitPerLeg(roomId, day, date, nodes);
    }
  }

  /* =========================================================
   * TRANSIT 요청 시: 근거리면 walking과 비교해서 더 짧은 쪽 선택
   * ========================================================= */
  private RouteResultResponseDto estimateTransitOrWalkingSmart(
      Long roomId, int day, LocalDate date, List<Node> nodes) {
    if (nodes.size() < 2) return RouteResultResponseDto.empty();

    double meters =
        haversineMeters(nodes.get(0).lat, nodes.get(0).lng, nodes.get(1).lat, nodes.get(1).lng);
    // 근거리 기준을 늘려서 도보 계산도 함께 수행 (1000m 이하)
    boolean near = meters <= 1000.0;

    log.info("🚶‍♂️ [transit-smart] 거리: {}m, 근거리여부: {}", meters, near);

    if (near) {
      log.info("🚶‍♂️ [transit-smart] 근거리 감지 - 도보와 대중교통 비교 시작");
      Mono<RouteResultResponseDto> walk =
          Mono.fromSupplier(() -> estimateWalking(roomId, day, nodes));
      Mono<RouteResultResponseDto> tran =
          Mono.fromSupplier(() -> estimateTransitPerLeg(roomId, day, date, nodes));
      return Mono.zip(walk, tran)
          .map(
              t -> {
                long walkSec = t.getT1().getTotalDurationSec();
                long tranSec = t.getT2().getTotalDurationSec();
                
                // 도보 계산이 실패했거나 0초인 경우 대중교통 선택
                if (walkSec <= 0) {
                  log.info("🚶‍♂️ [transit-smart] 도보 계산 실패 또는 0초 - 대중교통 선택");
                  return t.getT2();
                }
                
                RouteResultResponseDto result = walkSec <= tranSec ? t.getT1() : t.getT2();
                log.info("🚶‍♂️ [transit-smart] 비교 결과 - 도보: {}초, 대중교통: {}초, 선택: {}", 
                    walkSec, tranSec, walkSec <= tranSec ? "도보" : "대중교통");
                return result;
              })
          .block();
    } else {
      log.info("🚶‍♂️ [transit-smart] 원거리 - 대중교통만 계산");
      return estimateTransitPerLeg(roomId, day, date, nodes);
    }
  }

  /* =========================================================
   * DRIVING (Kakao Mobility, 다중 경유지)
   * ========================================================= */
  private RouteResultResponseDto estimateDrivingWithKakao(Long roomId, int day, List<Node> nodes) {
    if (nodes.size() < 2) return RouteResultResponseDto.empty();

    // origin/destination/waypoints 구성 (x=lng, y=lat 주의)
    KakaoWayPointRequestDto.Coord origin =
        KakaoWayPointRequestDto.Coord.builder().x(nodes.get(0).lng).y(nodes.get(0).lat).build();
    KakaoWayPointRequestDto.Coord dest =
        KakaoWayPointRequestDto.Coord.builder()
            .x(nodes.get(nodes.size() - 1).lng)
            .y(nodes.get(nodes.size() - 1).lat)
            .build();

    List<KakaoWayPointRequestDto.Waypoint> wps = new ArrayList<>();
    for (int i = 1; i < nodes.size() - 1; i++) {
      Node n = nodes.get(i);
      wps.add(KakaoWayPointRequestDto.Waypoint.builder().x(n.lng).y(n.lat).build());
    }

    KakaoWayPointRequestDto req =
        KakaoWayPointRequestDto.builder()
            .origin(origin)
            .destination(dest)
            .waypoints(wps.isEmpty() ? null : wps)
            .priority(KakaoWayPointRequestDto.Priority.RECOMMEND)
            .alternatives(false)
            .roadDetails(true) // 도로 상세 포함 → 섹션/로드 기반 파싱시 유리
            .summary(false) // 요약만 응답 X (상세 포함)
            .build();

    JsonNode root = kakao.getMultiWaypointDirections(req);
    return parseKakaoDriving(roomId, day, root, nodes);
  }

  private RouteResultResponseDto parseKakaoDriving(
      Long roomId, int day, JsonNode root, List<Node> nodes) {
    try {
      JsonNode routes = root.path("routes");
      if (!routes.isArray() || routes.size() == 0) {
        return RouteResultResponseDto.empty();
      }
      JsonNode r0 = routes.get(0);

      long totalDist = r0.path("summary").path("distance").asLong(0L);
      long totalSec = r0.path("summary").path("duration").asLong(0L);

      List<LegResponseDto> legs = new ArrayList<>();
      JsonNode sections = r0.path("sections");
      int legCount = Math.min(sections.size(), Math.max(0, nodes.size() - 1));
      for (int i = 0; i < legCount; i++) {
        JsonNode sec = sections.get(i);

        // 1) section.summary 우선
        long dist = sec.path("summary").path("distance").asLong(-1);
        long dur = sec.path("summary").path("duration").asLong(-1);

        // 2) 없으면 section 루트 필드 시도
        if (dist < 0) dist = sec.path("distance").asLong(-1);
        if (dur < 0) dur = sec.path("duration").asLong(-1);

        // 3) 그래도 없으면 roads 합산
        if (dist < 0 || dur < 0) {
          long sumDist = 0, sumDur = 0;
          JsonNode roads = sec.path("roads");
          if (roads.isArray()) {
            for (JsonNode rd : roads) {
              sumDist += rd.path("distance").asLong(0);
              sumDur += rd.path("duration").asLong(0);
            }
          }
          if (dist < 0) dist = sumDist;
          if (dur < 0) dur = sumDur;
        }

        if (dist < 0) dist = 0;
        if (dur < 0) dur = 0;

        legs.add(
            LegResponseDto.builder()
                .fromWantId(nodes.get(i).wantId()) // record accessor
                .toWantId(nodes.get(i + 1).wantId())
                .distanceMeters(dist)
                .durationSec(dur)
                .transport(TransportType.driving)
                .build());
      }

      return RouteResultResponseDto.builder()
          .roomId(roomId)
          .day(day)
          .transport(TransportType.driving) // ✅ 상위 transport도 채워주세요
          .totalDistanceMeters(totalDist)
          .totalDurationSec(totalSec)
          .legs(legs)
          .polyline(null)
          .build();

    } catch (Exception e) {
      throw new RuntimeException("Kakao directions parse failed", e);
    }
  }

  /* =========================================================
   * WALKING (Google, leg별 호출) - waypoints 문제 해결
   * ========================================================= */
  private RouteResultResponseDto estimateWalking(Long roomId, int day, List<Node> nodes) {
    if (nodes.size() < 2) return RouteResultResponseDto.empty();

    log.info("🚶‍♂️ [walking] 도보 계산 시작 - 노드 수: {}", nodes.size());

    long totalDist = 0, totalSec = 0;
    List<LegResponseDto> legs = new ArrayList<>();

    for (int i = 0; i < nodes.size() - 1; i++) {
      Node from = nodes.get(i);
      Node to = nodes.get(i + 1);

      log.info("🚶‍♂️ [walking] leg {}: {} -> {} ({} -> {})", 
          i + 1, from.wantId, to.wantId, ll(from), ll(to));

      String json = google.walking(ll(from), ll(to), null).block();
      log.info("🚶‍♂️ [walking] Google API 응답 길이: {}", json != null ? json.length() : 0);
      
      LegResponseDto leg = parseSingleLeg(json, from.wantId, to.wantId(), TransportType.walking);
      legs.add(leg);

      log.info("🚶‍♂️ [walking] leg {} 결과: {}m, {}초", 
          i + 1, leg.getDistanceMeters(), leg.getDurationSec());

      totalDist += leg.getDistanceMeters();
      totalSec += leg.getDurationSec();
    }

    RouteResultResponseDto result = RouteResultResponseDto.builder()
        .roomId(roomId)
        .day(day)
        .transport(TransportType.walking)
        .totalDistanceMeters(totalDist)
        .totalDurationSec(totalSec)
        .legs(legs)
        .polyline(null)
        .build();

    log.info("🚶‍♂️ [walking] 도보 계산 결과: {}m, {}초", 
        result.getTotalDistanceMeters(), result.getTotalDurationSec());

    return result;
  }

  /* =========================================================
   * TRANSIT (Google, leg별 호출) - 시작점 endTime 기준으로 출발시간 체인
   * ========================================================= */
  private RouteResultResponseDto estimateTransitPerLeg(
      Long roomId, int day, LocalDate date, List<Node> nodes) {
    if (nodes.size() < 2) return RouteResultResponseDto.empty();

    log.info("🚌 [transit-per-leg] 대중교통 계산 시작 - 노드 수: {}", nodes.size());

    long totalDist = 0, totalSec = 0;
    List<LegResponseDto> legs = new ArrayList<>();

    // ✅ 시작점(nodes[0])의 endTime을 기준으로 출발시간 설정 (없으면 now)
    Instant currentDeparture =
        (nodes.get(0).endTime != null)
            ? ZonedDateTime.of(date, nodes.get(0).endTime, ZONE).toInstant()
            : Instant.now();

    log.info("🚌 [transit-per-leg] 출발시간: {}", currentDeparture);

    for (int i = 0; i < nodes.size() - 1; i++) {
      Node from = nodes.get(i);
      Node to = nodes.get(i + 1);

      log.info("🚌 [transit-per-leg] leg {}: {} -> {} ({} -> {})", 
          i + 1, from.wantId, to.wantId, ll(from), ll(to));

      String json = google.transit(ll(from), ll(to), null, currentDeparture).block();
      log.info("🚌 [transit-per-leg] Google API 응답 길이: {}", json != null ? json.length() : 0);
      
      LegResponseDto leg = parseSingleLeg(json, from.wantId, to.wantId(), TransportType.transit);
      legs.add(leg);

      log.info("🚌 [transit-per-leg] leg {} 결과: {}m, {}초", 
          i + 1, leg.getDistanceMeters(), leg.getDurationSec());

      totalDist += leg.getDistanceMeters();
      totalSec += leg.getDurationSec();

      // 다음 leg 출발시간 = 직전 출발시간 + 이번 leg 소요시간
      if (leg.getDurationSec() > 0) {
        currentDeparture = currentDeparture.plusSeconds(leg.getDurationSec());
      }
    }

    return RouteResultResponseDto.builder()
        .roomId(roomId)
        .day(day)
        .totalDistanceMeters(totalDist)
        .totalDurationSec(totalSec)
        .legs(legs)
        .polyline(null)
        .build();
  }

  /* =========================================================
   * 좌표/파서/유틸
   * ========================================================= */
  private List<Node> resolveNodes(List<EventRequestDto> ordered) {
    List<Long> ids = ordered.stream().map(EventRequestDto::getWantId).toList();
    List<WantPlace> wantPlaces = wantPlaceRepository.findAllById(ids);
    Map<Long, WantPlace> wpMap =
        wantPlaces.stream().collect(Collectors.toMap(WantPlace::getId, w -> w));

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

  private RouteResultResponseDto parseWholeRoute(
      Long roomId, int day, String json, List<Node> nodes, TransportType transport) {
    try {
      JsonNode root = om.readTree(json);
      String status = root.path("status").asText();
      
      log.info("🚶‍♂️ [parse-whole-route] Google API 상태: {}", status);
      
      if (!"OK".equals(status)) {
        log.warn("🚶‍♂️ [parse-whole-route] Google API 오류: {}", status);
        return RouteResultResponseDto.empty();
      }
      
      JsonNode routes = root.path("routes");
      if (!routes.isArray() || routes.size() == 0) {
        log.warn("🚶‍♂️ [parse-whole-route] 경로 없음");
        return RouteResultResponseDto.empty();
      }
      
      JsonNode route0 = routes.get(0);
      JsonNode legsNode = route0.path("legs");

      log.info("🚶‍♂️ [parse-whole-route] legs 수: {}", legsNode.size());

      long totalDist = 0, totalSec = 0;
      List<LegResponseDto> legs = new ArrayList<>();

      for (int i = 0; i < legsNode.size(); i++) {
        JsonNode leg = legsNode.get(i);
        long dist = leg.path("distance").path("value").asLong(0);
        long dur = leg.path("duration").path("value").asLong(0);
        totalDist += dist;
        totalSec += dur;

        log.info("🚶‍♂️ [parse-whole-route] leg {}: {}m, {}초", i + 1, dist, dur);

        long fromId = nodes.get(i).wantId;
        long toId = nodes.get(i + 1).wantId;
        legs.add(
            LegResponseDto.builder()
                .fromWantId(fromId)
                .toWantId(toId)
                .distanceMeters(dist)
                .durationSec(dur)
                .transport(transport) // "walking" or "transit" 등
                .build());
      }
      String polyline = route0.path("overview_polyline").path("points").asText(null);

      log.info("🚶‍♂️ [parse-whole-route] 최종 결과: {}m, {}초", totalDist, totalSec);

      return RouteResultResponseDto.builder()
          .roomId(roomId)
          .day(day)
          .totalDistanceMeters(totalDist)
          .totalDurationSec(totalSec)
          .legs(legs)
          .polyline(polyline)
          .build();

    } catch (Exception e) {
      log.error("🚶‍♂️ [parse-whole-route] 파싱 실패", e);
      throw new RuntimeException("Directions parse failed", e);
    }
  }

  private LegResponseDto parseSingleLeg(String json, long fromId, long toId, TransportType transport) {
    try {
      JsonNode root = om.readTree(json);
      String status = root.path("status").asText();
      
      String logPrefix = transport == TransportType.walking ? "🚶‍♂️" : "🚌";
      log.info("{} [parse-single-leg] Google API 상태: {}", logPrefix, status);
      
      if (!"OK".equals(status)) {
        log.warn("{} [parse-single-leg] Google API 오류: {}", logPrefix, status);
        return LegResponseDto.builder()
            .fromWantId(fromId)
            .toWantId(toId)
            .distanceMeters(0)
            .durationSec(0)
            .transport(transport)
            .build();
      }
      
      JsonNode routes = root.path("routes");
      if (!routes.isArray() || routes.size() == 0) {
        log.warn("{} [parse-single-leg] 경로 없음", logPrefix);
        return LegResponseDto.builder()
            .fromWantId(fromId)
            .toWantId(toId)
            .distanceMeters(0)
            .durationSec(0)
            .transport(transport)
            .build();
      }
      
      JsonNode leg = routes.get(0).path("legs").get(0);
      long dist = leg.path("distance").path("value").asLong(0);
      long dur = leg.path("duration").path("value").asLong(0);

      log.info("{} [parse-single-leg] 파싱 결과: {}m, {}초", logPrefix, dist, dur);

      return LegResponseDto.builder()
          .fromWantId(fromId)
          .toWantId(toId)
          .distanceMeters(dist)
          .durationSec(dur)
          .transport(transport)
          .build();
    } catch (Exception e) {
      log.error("🚌 [parse-single-leg] 파싱 실패", e);
      throw new RuntimeException("Directions parse failed", e);
    }
  }

  private static String ll(Node n) {
    return n.lat + "," + n.lng;
  }

  private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
    double R = 6371000.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private record Node(long wantId, double lat, double lng, LocalTime endTime) {}
}
