package com.B108.tripwish.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        System.out.println("[+] STOMP 엔드포인트 등록 (/ws-stomp)");
        registry.addEndpoint("/ws-stomp") // 클라이언트가 연결할 기본 WebSocket endpoint
                .setAllowedOrigins("*")
                .withSockJS(); // fallback: WebSocket이 안 되면 SockJS로 대체
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /app으로 시작하는 메시지는 @MessageMapping으로 매핑
        registry.setApplicationDestinationPrefixes("/app");
    }


}
