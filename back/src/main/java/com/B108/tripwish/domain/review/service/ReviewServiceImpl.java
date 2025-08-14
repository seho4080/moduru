package com.B108.tripwish.domain.review.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.review.dto.request.CreateReviewRequestDto;
import com.B108.tripwish.domain.review.dto.response.ReviewResponseDto;
import com.B108.tripwish.domain.review.entity.PlaceReviewTag;
import com.B108.tripwish.domain.review.entity.PlaceReviewTagId;
import com.B108.tripwish.domain.review.entity.Review;
import com.B108.tripwish.domain.review.entity.ReviewTag;
import com.B108.tripwish.domain.review.repository.PlaceReviewTagRepository;
import com.B108.tripwish.domain.review.repository.ReviewRepository;
import com.B108.tripwish.domain.user.entity.User;
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
    User userRef = userReaderService.getReference(userId);
    Place placeRef = placeReaderService.getReference(placeId);
    Review review = reviewRepository.save(Review.builder().user(userRef).place(placeRef).build());

    // 2) 태그 연결 (조인 엔티티에 review/tag 모두 세팅 + @MapsId가 ID 채움) ✅
    for (Long tagId : request.getTagIds()) {
      ReviewTag tag = reviewTagReaderService.findTagById(tagId);

      PlaceReviewTag link =
          PlaceReviewTag.builder()
              .id(new PlaceReviewTagId(review.getId(), tagId)) // 있어도 되고 없어도 됨(둘 다 세팅하면 @MapsId가 채움)
              .review(review)
              .tag(tag)
              .build();

      placeReviewTagRepository.save(link);
      placeTagCountService.increaseTagCount(placeId, tagId);
    }
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

    // 2) 소유자 검증 (403)
    Long ownerId = review.getUser().getId();
    if (!ownerId.equals(userId)) {
      throw new RuntimeException("본인 리뷰만 삭제할 수 있습니다.");
    }

    // 태그 조회 후 카운트 감소
    List<PlaceReviewTag> tags =
        placeReviewTagRepository.findAll().stream()
            .filter(t -> t.getId().getReviewId().equals(reviewId))
            .toList();

    Long placeId = review.getPlace().getId();

    // 3) 연결된 태그들 가져와서 카운트 감소
    List<PlaceReviewTag> links = placeReviewTagRepository.findById_ReviewId(reviewId);
    for (PlaceReviewTag link : links) {
      placeTagCountService.decreaseTagCount(placeId, link.getTag().getId());
    }

    // 4) 조인 테이블 행들 먼저 삭제
    placeReviewTagRepository.deleteById_ReviewId(reviewId);

    // 5) 리뷰 삭제
    reviewRepository.deleteById(reviewId);

    log.info("리뷰 삭제 완료: reviewId={}, userId={}", reviewId, userId);
  }

  // 리뷰 조회
  @Transactional(readOnly = true)
  @Override
  public List<ReviewResponseDto> getMyReviews(CustomUserDetails currentUser) {
    Long userId = currentUser.getUser().getId();

    return reviewRepository.findByUser_Id(userId).stream()
        .map(
            r -> {
              Long placeId = r.getPlace().getId();
              var placeInfo = placeReaderService.getPlaceInfo(placeId);
              ; // DTO 사용
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
