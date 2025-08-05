package com.B108.tripwish.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.B108.tripwish.domain.place.respoistory")
public class ElasticsearchConfig {}
