package com.B108.tripwish.global.common.repository;

import com.B108.tripwish.global.common.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {

    Optional<Region> findByName(String name);
}
