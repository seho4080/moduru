package com.B108.tripwish;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.filter.ForwardedHeaderFilter;

@SpringBootApplication
public class TripwishApplication {

  public static void main(String[] args) {
    SpringApplication.run(TripwishApplication.class, args);
    PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    String raw = "1234";
    String encoded = encoder.encode(raw);

    System.out.println("Encoded: " + encoded);
    System.out.println("Matches? " + encoder.matches(raw, encoded));
  }

  @Bean
  public ForwardedHeaderFilter forwardedHeaderFilter() {
    return new ForwardedHeaderFilter();
  }
}
