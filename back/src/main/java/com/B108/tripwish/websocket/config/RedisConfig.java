package com.B108.tripwish.websocket.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

  @Bean(name = "redisMessageListenerContainer")
  public RedisMessageListenerContainer redisMessageListener(
          RedisConnectionFactory connectionFactory) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    return container;
  }


  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory cf, ObjectMapper om) {
    GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer(om);
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(cf);
    template.setKeySerializer(new StringRedisSerializer());
    template.setHashKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(json);
    template.setHashValueSerializer(json);
    template.afterPropertiesSet();
    return template;
  }

}
