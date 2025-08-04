package com.B108.tripwish.domain.user.controller;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.service.MyPlaceService;
import com.B108.tripwish.global.dto.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/my-places")
public class MyPlaceController {

    private final MyPlaceService myPlaceService;

    @Operation(
            summary = "장소 좋아요 토글 (등록/취소)",
            description = "사용자가 특정 장소에 대해 좋아요 상태를 토글합니다. 이미 좋아요한 상태라면 취소되고, 좋아요하지 않은 상태라면 등록됩니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "좋아요 상태가 성공적으로 변경됨"),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)", content = @Content),
                    @ApiResponse(responseCode = "404", description = "요청한 장소를 찾을 수 없음", content = @Content),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류 발생", content = @Content)
            })
    @PostMapping("/{placeId}")
    public ResponseEntity<CommonResponse> likePlace(@AuthenticationPrincipal CustomUserDetails user,
                                                    @PathVariable Long placeId) {
        myPlaceService.toggleLikePlace(user, placeId);
        return ResponseEntity.ok(new CommonResponse("MYPLACE_TOGGLE_SUCCESS", "좋아요 상태가 성공적으로 변경되었습니다."));
    }

}
