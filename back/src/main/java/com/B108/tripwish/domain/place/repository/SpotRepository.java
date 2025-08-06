package com.B108.tripwish.domain.place.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Spot;

public interface SpotRepository extends JpaRepository<Spot, Long> {
  Optional<Spot> findByPlace(Place place);
}
