package com.B108.tripwish.domain.review.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.review.entity.PlaceTagCount;
import com.B108.tripwish.domain.review.entity.PlaceTagCountId;
import com.B108.tripwish.domain.review.repository.PlaceTagCountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlaceTagCountService {

  private final PlaceTagCountRepository repository;

  @Transactional
  public void increaseTagCount(Long placeId, Long tagId) {
    PlaceTagCountId id = new PlaceTagCountId(placeId, tagId);
    PlaceTagCount count =
        repository.findById(id).orElse(PlaceTagCount.builder().id(id).tagCount(0).build());
    count.increment();
    repository.save(count);
  }

  @Transactional
  public void decreaseTagCount(Long placeId, Long tagId) {
    PlaceTagCountId id = new PlaceTagCountId(placeId, tagId);
    repository
        .findById(id)
        .ifPresent(
            count -> {
              count.decrement();
              repository.save(count);
            });
  }
}
