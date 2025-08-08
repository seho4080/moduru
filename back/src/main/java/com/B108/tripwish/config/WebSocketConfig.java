package com.B108.tripwish.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.B108.tripwish.domain.auth.security.JwtHandshakeInterceptor;
import com.B108.tripwish.domain.auth.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

/** STOMP 기반 WebSocket 설정 클래스입니다. 클라이언트 연결용 엔드포인트와 메시지 경로 prefix를 설정합니다. */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final JwtTokenProvider jwtTokenProvider;

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry
        .addEndpoint("/ws-stomp")
        .addInterceptors(new JwtHandshakeInterceptor(jwtTokenProvider))
        .setAllowedOriginPatterns("*") // CORS 허용 (Spring 2.4 이상은 이 메서드 사용 권장)
        // 배포할 때는 꼭 도메인 넣기(보안이슈).setAllowedOriginPatterns("도메인 주소")
        .withSockJS(); // WebSocket이 안 될 경우 SockJS fallback 허용
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker(
        "/topic", "/queue"); // 사용자 대상 메시지 경로 포함         // convertAndSendToUser용 prefix
    registry.setApplicationDestinationPrefixes("/app"); // 클라이언트 → 서버 경로
    registry.setUserDestinationPrefix("/user");
  }
}
