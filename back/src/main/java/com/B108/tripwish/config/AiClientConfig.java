package com.B108.tripwish.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
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
    public WebClient aiWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000)
                .responseTimeout(Duration.ofSeconds(5))
                .doOnConnected(conn -> {
                    conn.addHandlerLast(new ReadTimeoutHandler(5));
                    conn.addHandlerLast(new WriteTimeoutHandler(5));
                });

        WebClient.Builder b = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient));

        if (!apiKey.isBlank()) {
            b.defaultHeader("Authorization", "Bearer " + apiKey);
        }
        return b.build();
    }
}