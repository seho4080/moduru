package com.B108.tripwish.domain.place.respoistory;

import com.B108.tripwish.domain.place.entity.PlaceMetadataTag;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PlaceMetaDataTagRepository extends JpaRepository<PlaceMetadataTag, Long> {

    @Query("SELECT p.content FROM PlaceMetadataTag p WHERE p.place.id = :placeId")
    List<String> findContentByPlaceId(@Param("placeId") Long placeId);


}
