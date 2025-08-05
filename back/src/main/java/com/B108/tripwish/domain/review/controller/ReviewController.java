package com.B108.tripwish.domain.review.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.review.dto.request.CreateReviewRequestDto;
import com.B108.tripwish.domain.review.dto.response.ReviewResponseDto;
import com.B108.tripwish.domain.review.service.ReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

  private final ReviewService reviewService;

  @Operation(
          summary = "리뷰 작성",
          description = "사용자가 특정 장소에 대한 리뷰를 작성합니다.",
          requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description = "리뷰 작성 요청 DTO",
                  required = true),
          responses = {
                  @ApiResponse(responseCode = "200", description = "리뷰 작성 성공"),
                  @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
                  @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
                  @ApiResponse(responseCode = "404", description = "리뷰 작성 대상 장소를 찾을 수 없음"),
                  @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
          })
  @PostMapping
  public ResponseEntity<String> createReview(
      @AuthenticationPrincipal CustomUserDetails currentUser,
      @RequestBody CreateReviewRequestDto request) {
    reviewService.createReview(currentUser, request);
    return ResponseEntity.ok("리뷰가 작성되었습니다.");
  }


  @Operation(
          summary = "내 리뷰 삭제",
          description = "사용자가 자신이 작성한 리뷰를 삭제합니다.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "리뷰 삭제 성공"),
                  @ApiResponse(responseCode = "400", description = "잘못된 요청"),
                  @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
                  @ApiResponse(responseCode = "403", description = "본인 리뷰가 아니므로 삭제할 수 없음"),
                  @ApiResponse(responseCode = "404", description = "리뷰를 찾을 수 없음"),
                  @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
          })
  @DeleteMapping("/{reviewId}")
  public ResponseEntity<String> deleteMyReview(
      @AuthenticationPrincipal CustomUserDetails currentUser, @PathVariable Long reviewId) {
    reviewService.deleteMyReview(currentUser, reviewId);
    return ResponseEntity.ok("리뷰가 삭제되었습니다.");
  }


  @Operation(
          summary = "내가 작성한 리뷰 조회",
          description = "로그인한 사용자가 작성한 모든 리뷰를 조회합니다.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "리뷰 목록 조회 성공"),
                  @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
                  @ApiResponse(responseCode = "404", description = "사용자가 작성한 리뷰가 없음"),
                  @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
          })
  @GetMapping("/my")
  public ResponseEntity<List<ReviewResponseDto>> getMyReviews(
      @AuthenticationPrincipal CustomUserDetails currentUser) {
    return ResponseEntity.ok(reviewService.getMyReviews(currentUser));
  }
}
