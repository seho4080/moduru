package com.B108.tripwish.domain.user.repository;

import com.B108.tripwish.domain.user.entity.MyPlace;
import com.B108.tripwish.domain.user.entity.MyPlaceId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPlaceRepository extends JpaRepository<MyPlace, MyPlaceId> {
    boolean existsById_UserIdAndId_PlaceId(Long userId, Long placeId);
}
