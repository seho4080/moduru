package com.B108.tripwish.domain.place.respoistory;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
  Optional<Category> findByCategoryName(String category);
}
