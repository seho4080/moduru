package com.B108.tripwish.domain.place.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.place.document.PlaceDocument;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.place.repository.PlaceSearchRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PlaceIndexer implements CommandLineRunner {

  private final PlaceRepository placeRepository;
  private final PlaceSearchRepository placeSearchRepository;

  @Transactional
  @Override
  public void run(String... args) {
    List<Place> places = placeRepository.findAllWithImages(); // Lazy 문제 해결됨

    List<PlaceDocument> documents = places.stream().map(this::convertToPlaceDocument).toList();

    placeSearchRepository.saveAll(documents);
  }

  private PlaceDocument convertToPlaceDocument(Place place) {
    return PlaceDocument.builder()
        .id(place.getId().toString())
        .placeName(place.getPlaceName())
        .imageUrl(
            place.getImages() != null && !place.getImages().isEmpty()
                ? place.getImages().get(0).getImgUrl()
                : null)
        .address(place.getRoadAddressName())
        .lat(place.getLat())
        .lng(place.getLng())
        .categoryName(
            place.getCategoryId() != null ? place.getCategoryId().getCategoryName() : null)
        .build();
  }
}
