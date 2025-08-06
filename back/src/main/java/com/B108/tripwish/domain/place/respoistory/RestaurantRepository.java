package com.B108.tripwish.domain.place.respoistory;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Restaurant;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
  Optional<Restaurant> findByPlace(Place place);
}
