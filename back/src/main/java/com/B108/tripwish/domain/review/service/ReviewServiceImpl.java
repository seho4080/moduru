package com.B108.tripwish.domain.review.service;

import java.util.List;
import java.util.stream.Collectors;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.review.dto.request.CreateReviewRequestDto;
import com.B108.tripwish.domain.review.dto.response.ReviewResponseDto;
import com.B108.tripwish.domain.review.entity.PlaceReviewTag;
import com.B108.tripwish.domain.review.entity.PlaceReviewTagId;
import com.B108.tripwish.domain.review.entity.Review;
import com.B108.tripwish.domain.review.entity.ReviewTag;
import com.B108.tripwish.domain.review.repository.PlaceReviewTagRepository;
import com.B108.tripwish.domain.review.repository.ReviewRepository;
import com.B108.tripwish.domain.user.service.UserReaderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

  private final ReviewRepository reviewRepository;
  private final PlaceReviewTagRepository placeReviewTagRepository;
  private final ReviewTagReaderService reviewTagReaderService;
  private final PlaceTagCountService placeTagCountService;
  private final PlaceReaderService placeReaderService;
  private final UserReaderService userReaderService;

  @Override
  public List<String> getTagNamesByPlaceId(Long placeId) {
    List<String> tags = placeReviewTagRepository.findTagNamesByPlaceId(placeId);
    return tags != null ? tags : List.of();
  }

  // 내 리뷰 작성
  @Transactional
  @Override
  public void createReview(CustomUserDetails currentUser, CreateReviewRequestDto request) {
    Long userId = currentUser.getUser().getId();
    Long placeId = request.getPlaceId();

    // 엔티티 참조(프록시)만 가져와 FK 세팅 → 불필요한 SELECT 방지
    User userRef   = userReaderService.getReference(userId);
    Place placeRef = placeReaderService.getReference(placeId);
    Review review = Review.builder().userId(userRef).place(placeRef).build();

    // 태그 저장 및 카운트 증가
    request
        .getTagIds()
        .forEach(
            tagId -> {
              ReviewTag tag = reviewTagReaderService.findTagById(tagId);
              PlaceReviewTag prt =
                  PlaceReviewTag.builder()
                      .id(new PlaceReviewTagId(review.getId(), tagId))
                      .tag(tag)
                      .build();

              placeReviewTagRepository.save(prt);
              placeTagCountService.increaseTagCount(placeId, tagId);
            });

    log.info("리뷰 작성 완료: reviewId={}, userId={}, placeId={}", review.getId(), userId, placeId);
  }

  // 리뷰 삭제
  @Transactional
  @Override
  public void deleteMyReview(CustomUserDetails currentUser, Long reviewId) {
    Long userId = currentUser.getUser().getId();

    Review review =
        reviewRepository
            .findById(reviewId)
            .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다."));

    if (!review.getUserId().equals(userId)) {
      throw new RuntimeException("본인 리뷰만 삭제할 수 있습니다.");
    }

    // 태그 조회 후 카운트 감소
    List<PlaceReviewTag> tags =
        placeReviewTagRepository.findAll().stream()
            .filter(t -> t.getId().getReviewId().equals(reviewId))
            .toList();

    Long placeId = review.getPlace().getId();

    tags.forEach(t -> placeTagCountService.decreaseTagCount(placeId, t.getTag().getId()));
    tags.forEach(placeReviewTagRepository::delete);
    reviewRepository.delete(review);

    log.info("리뷰 삭제 완료: reviewId={}, userId={}", reviewId, userId);
  }

  // 리뷰 조회
  @Transactional(readOnly = true)
  @Override
  public List<ReviewResponseDto> getMyReviews(CustomUserDetails currentUser) {
    Long userId = currentUser.getUser().getId();

    return reviewRepository.findByUserId(userId).stream()
        .map(
            r -> {
              Long placeId = r.getPlace().getId();
              var placeInfo = placeReaderService.getPlaceInfo(placeId);; // DTO 사용
              return ReviewResponseDto.builder()
                  .reviewId(r.getId())
                  .placeId(placeInfo.getPlaceId())
                  .placeName(placeInfo.getPlaceName()) // DTO에서 이름 가져옴
                  .createdAt(r.getCreatedAt())
                      .tags(placeReviewTagRepository.findTagNamesByPlaceId(placeId))
                  .build();
            })
        .collect(Collectors.toList());
  }
}
