package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.entity.Category;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.respoistory.CategoryRepository;
import com.B108.tripwish.domain.place.respoistory.PlaceRepository;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.domain.user.service.MyPlaceService;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceServiceImpl implements PlaceService{

    private final PlaceRepository placeRepository;
    private final CategoryRepository categoryRepository;
    private final RoomService roomService;
    private final MyPlaceService myPlaceService;
    private final WantPlaceService wantPlaceService;

    @Transactional(readOnly = true)
    @Override
    public PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category) {
        String region = roomService.getRegionByRoomId(roomId);

        List<Place> places;
        if (category.equals("all")) {
            // 카테고리 상관없이 지역만 필터
            places = placeRepository.findAllByAddressNameContaining(region);
        }else{
            Category categoryEntity = categoryRepository.findByCategoryName(category)
                    .orElseThrow(() -> new CustomException(ErrorCode.CATEGORY_NOT_FOUND));
            places = placeRepository.findAllByAddressNameContainingAndCategory(region, categoryEntity);
        }

        List<PlaceResponseDto> response = places.stream()
                .map(place -> buildPlaceDto(place, user.getUser().getId(), roomId))
                .toList();
        return new PlaceListResponseDto(response);
    }


    @Override
    public PlaceResponseDto buildPlaceDto(Place place, Long userId, Long roomId) {
        boolean isLiked = myPlaceService.isLiked(userId, place.getId());
        boolean isWanted = wantPlaceService.isWanted(roomId, place.getId());
        return PlaceResponseDto.fromEntity(place, isLiked, isWanted);
    }
}
