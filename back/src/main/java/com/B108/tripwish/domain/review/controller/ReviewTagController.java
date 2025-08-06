package com.B108.tripwish.domain.review.controller;

import com.B108.tripwish.domain.review.entity.ReviewTag;
import com.B108.tripwish.domain.review.service
        .ReviewTagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/review-tags")
@RequiredArgsConstructor
public class ReviewTagController {

    private final ReviewTagService reviewTagService;

    @Operation(
            summary = "카테고리별 리뷰 태그 조회 (공통 태그 포함)",
            description = "특정 카테고리 ID에 속하는 리뷰 태그들과 공통 태그를 함께 조회합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "태그 목록 조회 성공"),
                    @ApiResponse(responseCode = "400", description = "잘못된 카테고리 ID 요청"),
                    @ApiResponse(responseCode = "404", description = "해당 카테고리 또는 공통 태그를 찾을 수 없음"),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
            }
    )
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ReviewTag>> getTagsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(reviewTagService.getTagsByCategoryIncludingCommon(categoryId));
    }
}
