package com.B108.tripwish.domain.place.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.place.entity.Category;
import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceRepository extends JpaRepository<Place, Long> {

  // regionId (ManyToOne Region)의 id로 조회
  List<Place> findAllByRegionId_Id(Long regionId);

  // regionId.id + categoryId 로 조회
  List<Place> findAllByRegionId_IdAndCategoryId(Long regionId, Category category);

  @Query("SELECT DISTINCT p FROM Place p LEFT JOIN FETCH p.images")
  List<Place> findAllWithImages();

  @Query(
      """
    SELECT p FROM Place p
    LEFT JOIN FETCH p.images
    LEFT JOIN FETCH p.categoryId
    WHERE p.id = :id
  """)
  Optional<Place> findWithImagesAndCategoryById(@Param("id") Long id);

  @Query(
      """
    SELECT DISTINCT p FROM Place p
    LEFT JOIN FETCH p.images
    LEFT JOIN FETCH p.categoryId
    WHERE p.regionId.id = :regionId
  """)
  List<Place> findAllByRegionIdWithImagesAndCategory(@Param("regionId") Long regionId);

  @Query(
      """
    SELECT DISTINCT p FROM Place p
    LEFT JOIN FETCH p.images
    LEFT JOIN FETCH p.categoryId
    WHERE p.regionId.id = :regionId AND p.categoryId = :category
  """)
  List<Place> findAllByRegionIdAndCategoryWithImagesAndCategory(
      @Param("regionId") Long regionId, @Param("category") Category category);

  @Query("SELECT DISTINCT p FROM Place p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
  List<Place> findAllWithImagesByIdIn(@Param("ids") Set<Long> ids);

  @Query(
      """
        select distinct p
        from Place p
        join MyPlace mp on mp.placeId = p.id
        left join fetch p.images imgs
        left join fetch p.categoryId c
        where mp.user.id = :userId
        """)
  List<Place> findAllLikedByUserIdWithDetail(@Param("userId") Long userId);

  @Query(
      """
  SELECT DISTINCT p FROM Place p
  LEFT JOIN FETCH p.images
  LEFT JOIN FETCH p.categoryId
  WHERE p.id IN :ids
  """)
  List<Place> findAllWithImagesAndCategoryByIdIn(@Param("ids") java.util.Collection<Long> ids);

  @Query(
      """
    select distinct p
    from Place p
    join MyPlace mp on mp.placeId = p.id
    left join fetch p.images
    left join fetch p.categoryId
    where mp.user.id = :userId
      and (:regionId is null or p.regionId.id = :regionId)
    """)
  List<Place> findAllLikedByUserIdAndRegion(
      @Param("userId") Long userId, @Param("regionId") Long regionId);
}
