package com.B108.tripwish.domain.place.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Restaurant;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
  @Query("""
    SELECT r FROM Restaurant r
    LEFT JOIN FETCH r.menus
    WHERE r.placeId.id = :placeId
""")
  Optional<Restaurant> findByPlaceId(@Param("placeId") Long placeId);


  @Query("""
    SELECT DISTINCT r FROM Restaurant r
    LEFT JOIN FETCH r.menus
    WHERE r.placeId.id = :placeId
  """)
  Optional<Restaurant> findWithMenusByPlaceId(@Param("placeId") Long placeId);

}
