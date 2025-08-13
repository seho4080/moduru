package com.B108.tripwish.global.common.repository;

import com.B108.tripwish.global.common.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {

    Optional<Region> findByName(String name);

    // 시·도 목록 조회
    List<Region> findAllByParentIsNullOrderByName();

    // 특정 시·도의 시·군 목록 조회 의도
    List<Region> findAllByParentIdOrderByName(Long parentId);
}


