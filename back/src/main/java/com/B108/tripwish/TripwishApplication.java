package com.B108.tripwish;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.ForwardedHeaderFilter;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
public class TripwishApplication {
  
  public static void main(String[] args) {
    SpringApplication.run(TripwishApplication.class, args);
  }

  @Bean
  public ForwardedHeaderFilter forwardedHeaderFilter() {
    return new ForwardedHeaderFilter();
  }
}
