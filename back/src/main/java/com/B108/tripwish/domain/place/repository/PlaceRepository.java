package com.B108.tripwish.domain.place.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.place.entity.Category;
import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceRepository extends JpaRepository<Place, Long> {
  List<Place> findAllByRegion_Id(Long region);

  List<Place> findAllByRegion_IdAndCategory(Long regionId, Category category);

  @Query("SELECT DISTINCT p FROM Place p LEFT JOIN FETCH p.images")
  List<Place> findAllWithImages();

  @Query("""
  SELECT p FROM Place p
  LEFT JOIN FETCH p.images
  LEFT JOIN FETCH p.category
  WHERE p.id = :id
""")
  Optional<Place> findWithImagesAndCategoryById(@Param("id") Long id);


  @Query("""
  SELECT DISTINCT p FROM Place p
  LEFT JOIN FETCH p.images
  LEFT JOIN FETCH p.category
  WHERE p.region.id = :regionId
""")
  List<Place> findAllByRegionIdWithImagesAndCategory(@Param("regionId") Long regionId);

  @Query("""
  SELECT DISTINCT p FROM Place p
  LEFT JOIN FETCH p.images
  LEFT JOIN FETCH p.category
  WHERE p.region.id = :regionId AND p.category = :category
""")
  List<Place> findAllByRegionIdAndCategoryWithImagesAndCategory(@Param("regionId") Long regionId, @Param("category") Category category);

}
