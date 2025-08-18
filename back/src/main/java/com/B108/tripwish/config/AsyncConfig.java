package com.B108.tripwish.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

  @Override
  @Bean(name = "mailExecutor")
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(5);
    executor.setQueueCapacity(10);
    executor.setThreadNamePrefix("Async-MailExecutor-");
    executor.initialize();
    return executor;
  }

  @Bean(name = "travelTaskExecutor")
  public Executor travelTaskExecutor() {
    ThreadPoolTaskExecutor t = new ThreadPoolTaskExecutor();
    t.setCorePoolSize(4);
    t.setMaxPoolSize(8);
    t.setQueueCapacity(200);
    t.setThreadNamePrefix("Async-Travel-");
    t.setAllowCoreThreadTimeOut(true);
    t.setWaitForTasksToCompleteOnShutdown(true);
    t.initialize();
    return t;
  }
}
