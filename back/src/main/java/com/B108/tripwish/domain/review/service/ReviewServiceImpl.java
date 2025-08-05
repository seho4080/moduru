package com.B108.tripwish.domain.review.service;

import com.B108.tripwish.domain.review.repository.PlaceReviewTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService{

    private final PlaceReviewTagRepository placeReviewTagRepository;

    @Override
    public List<String> getTagNamesByPlaceId(Long placeId) {
        List<String> tags = placeReviewTagRepository.findTagNamesByPlaceId(placeId);
        return tags != null ? tags : List.of();
    }
}
