package com.B108.tripwish.domain.place.respoistory;


import com.B108.tripwish.domain.place.entity.Category;
import com.B108.tripwish.domain.place.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findAllByAddressNameContaining(String region);
    List<Place> findAllByAddressNameContainingAndCategory(String region, Category category);

    @Query("SELECT DISTINCT p FROM Place p LEFT JOIN FETCH p.images")
    List<Place> findAllWithImages();


}
