package com.B108.tripwish.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class AiClientConfig {

    @Value("${ai.base-url:http://127.0.0.1:8000}")
    private String baseUrl;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Bean
    @Qualifier("aiWebClient")
    public WebClient aiWebClient() {
        // NOTE: 네트워크 지연/장애 시 빠르게 실패하도록 타임아웃을 명시
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000)
                .responseTimeout(Duration.ofSeconds(5))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(5))
                        .addHandlerLast(new WriteTimeoutHandler(5)));

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                // NOTE: 기본 헤더를 JSON으로 고정
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                // NOTE: 요청/응답 최소 로깅으로 추적성 확보
                .filter(ExchangeFilterFunction.ofRequestProcessor(req ->
                        Mono.fromRunnable(() -> {
                            // NOTE: 의도: 메서드/경로만 로깅, 민감한 본문은 제외
                            System.out.println("[AI-REQ] " + req.method() + " " + req.url());
                        }).then(Mono.just(req))
                ))
                .filter(ExchangeFilterFunction.ofResponseProcessor(res ->
                        Mono.fromRunnable(() -> {
                            // NOTE: 의도: 상태 코드만 로깅
                            System.out.println("[AI-RES] status=" + res.statusCode());
                        }).then(Mono.just(res))
                ));

        // NOTE: 필요 시 Bearer 토큰 자동 부착
        if (StringUtils.hasText(apiKey)) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }

        return builder.build();
    }
}
