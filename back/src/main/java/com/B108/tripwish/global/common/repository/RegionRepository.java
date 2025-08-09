package com.B108.tripwish.global.common.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.global.common.entity.Region;

public interface RegionRepository extends JpaRepository<Region, Long> {

  Optional<Region> findByName(String name);
}
