package com.B108.tripwish.domain.place.respoistory;

import com.B108.tripwish.domain.place.entity.Festival;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
    Optional<Festival> findByPlace(Place place);
}
