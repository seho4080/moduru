package com.B108.tripwish.infra.kakao;

import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.B108.tripwish.infra.kakao.dto.KakaoWayPointRequestDto;
import com.fasterxml.jackson.databind.JsonNode;

import reactor.core.publisher.Mono;

@Component
public class KakaoNaviClient {

  private final WebClient webClient;

  public KakaoNaviClient(
      WebClient.Builder builder,
      @Value("${kakao.navi.base-url}") String baseUrl,
      @Value("${kakao.api.key}") String apiKey) {
    this.webClient =
        builder
            .baseUrl(baseUrl) // e.g. https://apis-navi.kakaomobility.com
            .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + apiKey)
            .build();
  }

  /** 동기 호출: 다중 경유지 길찾기 */
  public JsonNode getMultiWaypointDirections(KakaoWayPointRequestDto request) {
    try {
      return webClient
          .post()
          .uri("/v1/waypoints/directions")
          .contentType(MediaType.APPLICATION_JSON)
          .accept(MediaType.APPLICATION_JSON)
          .bodyValue(request)
          .retrieve()
          .onStatus(
              HttpStatusCode::isError,
              resp ->
                  resp.bodyToMono(String.class)
                      .flatMap(
                          body ->
                              Mono.error(
                                  new IllegalStateException(
                                      "Kakao Navi API error: "
                                          + resp.statusCode()
                                          + " - "
                                          + body))))
          .bodyToMono(JsonNode.class)
          .block();
    } catch (WebClientResponseException e) {
      // HTTP 에러 응답을 명확히 남김
      throw new IllegalStateException(
          "Kakao Navi API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
    }
  }

  /** 비동기 호출: 필요 시 리액티브로 사용 */
  public Mono<JsonNode> getMultiWaypointDirectionsAsync(KakaoWayPointRequestDto request) {
    return webClient
        .post()
        .uri("/v1/waypoints/directions")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .retrieve()
        .onStatus(
            HttpStatusCode::isError,
            resp ->
                resp.bodyToMono(String.class)
                    .flatMap(
                        body ->
                            Mono.error(
                                new IllegalStateException(
                                    "Kakao Navi API error: " + resp.statusCode() + " - " + body))))
        .bodyToMono(JsonNode.class);
  }
}
