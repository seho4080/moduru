package com.B108.tripwish.domain.review.service;

import com.B108.tripwish.domain.review.entity.ReviewTag;
import com.B108.tripwish.domain.review.repository.ReviewTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewTagService {

    private final ReviewTagRepository reviewTagRepository;

    @Transactional(readOnly = true)
    public List<ReviewTag> getTagsByCategoryIncludingCommon(Long categoryId) {
        return reviewTagRepository.findByCategoryIdOrCommon(categoryId);
    }
}
