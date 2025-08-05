package com.B108.tripwish.domain.user.repository;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.user.entity.MyPlace;
import com.B108.tripwish.domain.user.entity.MyPlaceId;
import com.B108.tripwish.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MyPlaceRepository extends JpaRepository<MyPlace, MyPlaceId> {
    boolean existsById_UserIdAndId_PlaceId(Long userId, Long placeId);
    void deleteById(MyPlaceId id);


}
