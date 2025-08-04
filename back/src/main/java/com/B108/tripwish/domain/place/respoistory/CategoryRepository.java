package com.B108.tripwish.domain.place.respoistory;

import com.B108.tripwish.domain.place.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryName(String category);
}
