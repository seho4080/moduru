package com.B108.tripwish.domain.place.respoistory;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Festival;
import com.B108.tripwish.domain.place.entity.Place;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
  Optional<Festival> findByPlace(Place place);
}
