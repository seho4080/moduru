package com.B108.tripwish.domain.user.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.user.entity.MyPlace;
import com.B108.tripwish.domain.user.entity.MyPlaceId;

public interface MyPlaceRepository extends JpaRepository<MyPlace, MyPlaceId> {
  boolean existsById_UserIdAndId_PlaceId(Long userId, Long placeId);

  void deleteById(MyPlaceId id);

  List<MyPlace> findByUser_Id(Long userId);

  @Query(
      "SELECT mp.id.placeId FROM MyPlace mp WHERE mp.id.userId = :userId AND mp.id.placeId IN :placeIds")
  Set<Long> findMyPlaceIds(
      @Param("userId") Long userId, @Param("placeIds") Collection<Long> placeIds);
}
