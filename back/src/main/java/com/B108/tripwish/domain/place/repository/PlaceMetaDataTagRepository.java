package com.B108.tripwish.domain.place.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.place.entity.PlaceMetadataTag;

public interface PlaceMetaDataTagRepository extends JpaRepository<PlaceMetadataTag, Long> {

  @Query("SELECT p.content FROM PlaceMetadataTag p WHERE p.place.id = :placeId")
  List<String> findContentByPlaceId(@Param("placeId") Long placeId);
}
