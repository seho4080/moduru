package com.B108.tripwish.domain.place.respoistory;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByPlace(Place place);
}
