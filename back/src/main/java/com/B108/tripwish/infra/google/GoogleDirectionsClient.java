// package com.B108.tripwish.infra.google;

// import java.time.Instant;
// import java.util.List;
// import java.util.stream.Collectors;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.http.HttpStatusCode;
// import org.springframework.stereotype.Component;
// import org.springframework.web.reactive.function.client.WebClient;
// import org.springframework.web.util.UriComponentsBuilder;

// import reactor.core.publisher.Mono;

// @Component
// public class GoogleDirectionsClient {

//     private final WebClient webClient;

//     @Value("${google.api.key}")
//     private String apiKey;

//     @Value("${google.api.language:ko}")
//     private String language;

//     public GoogleDirectionsClient(
//             WebClient.Builder builder, @Value("${google.base-url}") String baseUrl) {
//         this.webClient =
//                 builder
//                         .clone() // ← 중요: 공유 빌더 오염 방지
//                         .baseUrl(baseUrl)
//                         .build();
//     }

//     /** 걷기 전용 호출 */
//     public Mono<String> walking(String origin, String destination, String waypoints) {
//         return directionsJson(origin, destination, waypoints, "walking", null);
//     }

//     /** 대중교통 전용 호출 */
//     public Mono<String> transit(
//             String origin, String destination, String waypoints, Instant departureTime) {
//         return directionsJson(origin, destination, waypoints, "transit", departureTime);
//     }

//     /**
//      * Directions API v1(JSON) — walking / transit 전용 - 순서 고정: waypoints에 optimize:true 쓰지 말 것 -
//      * transit일 때만 departure_time=now 사용
//      */
//     public Mono<String> directionsJson(
//             String origin,
//             String destination,
//             String waypoints,
//             String mode, // "walking" | "transit" 만 허용
//             Instant departureTime) {
//         String m = normalizeMode(mode); // ← 여기서 walking/transit만 허용

//         String base =
//                 UriComponentsBuilder.fromPath("/directions/json")
//                         .queryParam("origin", origin)
//                         .queryParam("destination", destination)
//                         .queryParam("mode", m)
//                         .queryParam("language", language)
//                         .queryParam("key", apiKey)
//                         .build(true)
//                         .toUriString();

//         UriComponentsBuilder b = UriComponentsBuilder.fromUriString(base);
//         if (waypoints != null && !waypoints.isBlank()) {
//             b.queryParam("waypoints", waypoints);
//         }
//         if ("transit".equals(m)) {
//             // 대중교통은 출발/도착 시간 기반 → now로 현재 기준 경로/소요시간
//             if (departureTime != null) {
//                 b.queryParam("departure_time", departureTime.getEpochSecond()); // ← UTC epoch
// seconds
//             } else {
//                 b.queryParam("departure_time", "now");
//             }
//             // 필요 시 선호 옵션도 추가 가능:
//             // b.queryParam("transit_routing_preference", "fewer_transfers"); // or
// "less_walking"
//         }

//         String finalUri = b.build(true).toUriString();

//         return webClient
//                 .get()
//                 .uri(finalUri)
//                 .retrieve()
//                 .onStatus(
//                         HttpStatusCode::isError,
//                         resp ->
//                                 resp.bodyToMono(String.class)
//                                         .map(body -> new
// DirectionsApiException(resp.statusCode().value(), body)))
//                 .bodyToMono(String.class);
//     }

//     /** mode 검증/정규화: walking/transit만 허용 */
//     private String normalizeMode(String mode) {
//         if (mode == null) return "walking";
//         String m = mode.toLowerCase();
//         switch (m) {
//             case "walking":
//             case "walk":
//                 return "walking";
//             case "transit":
//             case "public_transit":
//                 return "transit";
//             default:
//                 throw new IllegalArgumentException("mode must be 'walking' or 'transit' only");
//         }
//     }

//     /** 중간 정차 → waypoints 문자열 조립 (정차: asVia=false, 통과만: asVia=true) */
//     public String joinWaypoints(List<String> latLngs, boolean asVia) {
//         if (latLngs == null || latLngs.size() <= 2) return null;
//         return latLngs.subList(1, latLngs.size() - 1).stream()
//                 .map(s -> asVia ? "via:" + s : s)
//                 .collect(Collectors.joining("|"));
//     }

//     public record LatLng(double lat, double lng) {
//         public String asString() {
//             return lat + "," + lng;
//         }
//     }

//     public String joinWaypointsFromPoints(List<LatLng> points, boolean asVia) {
//         if (points == null || points.size() <= 2) return null;
//         return points.subList(1, points.size() - 1).stream()
//                 .map(p -> (asVia ? "via:" : "") + p.asString())
//                 .collect(Collectors.joining("|"));
//     }

//     public static class DirectionsApiException extends RuntimeException {
//         public final int statusCode;

//         public DirectionsApiException(int code, String body) {
//             super("Directions API error (" + code + "): " + body);
//             this.statusCode = code;
//         }
//     }
// }
package com.B108.tripwish.infra.google;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleDirectionsClient {

  private final WebClient.Builder webClientBuilder;
  private WebClient webClient;

  @Value("${google.api.key}")
  private String apiKey;

  @Value("${google.api.language:ko}")
  private String language;

  @Value("${google.base-url:https://maps.googleapis.com/maps/api}")
  private String baseUrl;

  @PostConstruct
  void init() {
    Assert.hasText(apiKey, "google.api.key is required (환경변수 GOOGLE_API_KEY 또는 yml에 세팅)");
    this.webClient =
        webClientBuilder
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.USER_AGENT, "Tripwish/1.0")
            .build();

    log.info(
        "[GOOGLE] baseUrl={} lang={} key.len={}",
        baseUrl,
        language,
        (apiKey == null ? 0 : apiKey.length()));
  }

  /** 걷기 전용 호출 */
  public Mono<String> walking(String origin, String destination, String waypoints) {
    return directionsJson(origin, destination, waypoints, "walking", null);
  }

  /** 대중교통 전용 호출 */
  public Mono<String> transit(
      String origin, String destination, String waypoints, Instant departureTime) {
    return directionsJson(origin, destination, waypoints, "transit", departureTime);
  }

  /**
   * Directions API v1(JSON) — walking / transit 전용 - 순서 고정: waypoints에 optimize:true 쓰지 말 것 -
   * transit일 때만 departure_time 사용(now 또는 epoch seconds)
   */
  public Mono<String> directionsJson(
      String origin,
      String destination,
      String waypoints,
      String mode, // "walking" | "transit"
      Instant departureTime) {

    String m = normalizeMode(mode);

    String base =
        UriComponentsBuilder.fromPath("/directions/json")
            .queryParam("origin", origin)
            .queryParam("destination", destination)
            .queryParam("mode", m)
            .queryParam("language", language)
            .queryParam("key", apiKey)
            .build(true)
            .toUriString();

    UriComponentsBuilder b = UriComponentsBuilder.fromUriString(base);

    if (waypoints != null && !waypoints.isBlank()) {
      b.queryParam("waypoints", waypoints);
    }
    if ("transit".equals(m)) {
      b.queryParam(
          "departure_time", departureTime != null ? departureTime.getEpochSecond() : "now");
      // b.queryParam("transit_routing_preference", "fewer_transfers"); // 옵션
    }

    String finalUri = b.build(true).toUriString();

    return webClient
        .get()
        .uri(finalUri)
        .retrieve()
        .onStatus(
            HttpStatusCode::isError,
            resp ->
                resp.bodyToMono(String.class)
                    .map(body -> new DirectionsApiException(resp.statusCode().value(), body)))
        .bodyToMono(String.class);
  }

  /** mode 검증/정규화: walking/transit만 허용 */
  private String normalizeMode(String mode) {
    if (mode == null) return "walking";
    String m = mode.toLowerCase();
    switch (m) {
      case "walking":
      case "walk":
        return "walking";
      case "transit":
      case "public_transit":
        return "transit";
      default:
        throw new IllegalArgumentException("mode must be 'walking' or 'transit' only");
    }
  }

  /** 중간 정차 → waypoints 문자열 조립 (정차: asVia=false, 통과만: asVia=true) */
  public String joinWaypoints(List<String> latLngs, boolean asVia) {
    if (latLngs == null || latLngs.size() <= 2) return null;
    return latLngs.subList(1, latLngs.size() - 1).stream()
        .map(s -> asVia ? "via:" + s : s)
        .collect(Collectors.joining("|"));
  }

  public record LatLng(double lat, double lng) {
    public String asString() {
      return lat + "," + lng;
    }
  }

  public String joinWaypointsFromPoints(List<LatLng> points, boolean asVia) {
    if (points == null || points.size() <= 2) return null;
    return points.subList(1, points.size() - 1).stream()
        .map(p -> (asVia ? "via:" : "") + p.asString())
        .collect(Collectors.joining("|"));
  }

  /** API 에러 래핑 */
  public static class DirectionsApiException extends RuntimeException {
    public final int statusCode;

    public DirectionsApiException(int code, String body) {
      super("Directions API error (" + code + "): " + body);
      this.statusCode = code;
    }
  }
}
