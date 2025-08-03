package com.B108.tripwish.domain.place.respoistory;

import com.B108.tripwish.domain.place.document.PlaceDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface PlaceSearchRepository extends ElasticsearchRepository<PlaceDocument, String> {
    List<PlaceDocument> findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(
            String placeName,
            String address,
            String categoryName
    );
}


