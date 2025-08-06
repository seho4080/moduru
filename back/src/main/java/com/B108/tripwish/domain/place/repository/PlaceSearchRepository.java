package com.B108.tripwish.domain.place.repository;

import java.util.List;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import com.B108.tripwish.domain.place.document.PlaceDocument;

public interface PlaceSearchRepository extends ElasticsearchRepository<PlaceDocument, String> {
  List<PlaceDocument> findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(
      String placeName, String address, String categoryName);
}
