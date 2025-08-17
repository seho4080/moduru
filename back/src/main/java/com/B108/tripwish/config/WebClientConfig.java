package com.B108.tripwish.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {
  @Bean
  public WebClient webClient(@Value("${google.base-url}") String baseUrl) {
    HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000) // 10초 연결 타임아웃
        .responseTimeout(Duration.ofSeconds(30)) // 30초 응답 타임아웃
        .doOnConnected(conn -> {
          conn.addHandlerLast(new ReadTimeoutHandler(30)); // 30초 읽기 타임아웃
          conn.addHandlerLast(new WriteTimeoutHandler(10)); // 10초 쓰기 타임아웃
        });

    return WebClient.builder()
        .baseUrl(baseUrl)
        .defaultHeader(HttpHeaders.USER_AGENT, "Tripwish/1.0")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
  }
}
