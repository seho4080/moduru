package com.B108.tripwish.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.B108.tripwish.domain.auth.security.JwtAuthenticationFilter;
import com.B108.tripwish.domain.auth.security.JwtTokenProvider;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtTokenProvider jwtTokenProvider;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .headers(headers -> headers.frameOptions(frame -> frame.disable()))
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                        (req, res, e) -> {
                          res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                          res.setContentType("application/json;charset=UTF-8");
                          res.getWriter()
                              .write("{\"code\":\"REFRESH_REQUIRED\",\"message\":\"로그인이 필요합니다.\"}");
                        })
                    .accessDeniedHandler(
                        (req, res, e) -> {
                          res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                          res.setContentType("application/json;charset=UTF-8");
                          res.getWriter()
                              .write("{\"code\":\"ACCESS_DENIED\",\"message\":\"접근 권한이 없습니다.\"}");
                        }))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        new AntPathRequestMatcher("/v3/api-docs/**"),
                        new AntPathRequestMatcher("/swagger-resources/**"),
                        new AntPathRequestMatcher("/swagger-ui/**"),
                        new AntPathRequestMatcher("/swagger-ui.html"),
                        new AntPathRequestMatcher("/webjars/**"),
                        new AntPathRequestMatcher("/auth/login"),
                        new AntPathRequestMatcher("/auth/reissue"),
                        new AntPathRequestMatcher("/auth/email/verify"),
                        new AntPathRequestMatcher("/auth/email/send"),
                        new AntPathRequestMatcher("/users/signup"))
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

    http.addFilterBefore(
        new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(
        List.of(
            "https://moduru.co.kr",
            "https://www.moduru.co.kr",
            "http://localhost:5173",
            "http://127.0.0.1:5173"));
    config.setAllowCredentials(true);
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
