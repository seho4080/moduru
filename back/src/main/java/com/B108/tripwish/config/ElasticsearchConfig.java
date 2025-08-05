package com.B108.tripwish.config;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.B108.tripwish.domain.place.respoistory")
public class ElasticsearchConfig extends ElasticsearchConfiguration {

  private static final Logger log = LoggerFactory.getLogger(ElasticsearchConfig.class);

  @Value("${ELASTICSEARCH_HOST:localhost}")
  private String elasticsearchHost;

  @Value("${ELASTICSEARCH_PORT:9200}")
  private String elasticsearchPort;

  @Override
  public ClientConfiguration clientConfiguration() {
    String connectionString = elasticsearchHost + ":" + elasticsearchPort;
    log.info("Connecting to Elasticsearch at: {}", connectionString);

    return ClientConfiguration.builder()
        .connectedTo(connectionString)
        .withConnectTimeout(Duration.ofSeconds(30))
        .withSocketTimeout(Duration.ofSeconds(30))
        .build();
  }
}
