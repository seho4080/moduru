package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.*;
import com.B108.tripwish.domain.place.entity.*;
import com.B108.tripwish.domain.place.respoistory.*;
import com.B108.tripwish.domain.review.service.ReviewService;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.domain.user.service.MyPlaceService;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceServiceImpl implements PlaceService{

    private final PlaceRepository placeRepository;
    private final CategoryRepository categoryRepository;
    private final RestaurantRepository restaurantRepository;
    private final SpotRepository spotRepository;
    private final FestivalRepository festivalRepository;
    private final PlaceMetaDataTagRepository placeMetaDataTagRepository;
    private final RoomService roomService;
    private final MyPlaceReaderService myPlaceReaderService;
    private final WantPlaceReaderService wantPlaceReaderService;
    private final ReviewService reviewService;

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
        boolean isLiked = myPlaceReaderService.isLiked(userId, place.getId());
        boolean isWanted = wantPlaceReaderService.isWanted(roomId, place.getId(), PlaceType.PLACE);
        return PlaceResponseDto.fromEntity(place, isLiked, isWanted);
    }

    @Override
    public PlaceDetailResponseDto getPlaceDetail(CustomUserDetails user, Long roomId, Long placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLACE_NOT_FOUND));

        boolean isLiked = myPlaceReaderService.isLiked(user.getUser().getId(), placeId);
        boolean isWanted = wantPlaceReaderService.isWanted(roomId, placeId, PlaceType.PLACE);

        List<String> reviewTags = reviewService.getTagNamesByPlaceId(placeId);
        List<String> metaDataTags = Optional.ofNullable(placeMetaDataTagRepository.findContentByPlaceId(placeId))
                .orElse(List.of());

        CategoryDetailResponseDto categoryDetail = getCategoryDetail(place);
        return PlaceDetailResponseDto.builder()
                .placeImages(
                        place.getImages() != null
                                ? place.getImages().stream()
                                .map(PlaceImage::getImgUrl)
                                .toList()
                                : List.of()
                )
                .placeId(place.getId())
                .placeName(place.getPlaceName())
                .category(place.getCategory().getCategoryName())
                .address(place.getRoadAddressName()) // 또는 addressName 사용 가능
                .latitude(place.getLat())
                .longitude(place.getLng())
                .isLiked(isLiked)
                .isWanted(isWanted)
                .reviewTags(reviewTags)
                .metaDataTags(metaDataTags)
                .categoryDetail(categoryDetail)
                .build();
    }


    private CategoryDetailResponseDto getCategoryDetail(Place place) {
        return switch (place.getCategory().getId().intValue()) {
            case 1 -> {
                Restaurant restaurant = restaurantRepository.findByPlace(place)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESTAURANT_DETAIL_NOT_FOUND));
                yield RestaurantDetailResponseDto.builder()
                        .description(restaurant.getDescription())
                        .descriptionShort(restaurant.getDescriptionShort())
                        .tel(restaurant.getTel())
                        .homepage(restaurant.getHomepage())
                        .businessHours(restaurant.getBusinessHours())
                        .restDate(restaurant.getRestDate())
                        .parking(restaurant.getParking())
                        .menus(restaurant.getMenus().stream()
                                .map(RestaurantMenu::getMenu)
                                .collect(Collectors.toList()))
                        .build();
            }
            case 2 -> {
                Spot spot = spotRepository.findByPlace(place)
                        .orElseThrow(() -> new CustomException(ErrorCode.SPOT_DETAIL_NOT_FOUND));
                yield SpotDetailResponseDto.builder()
                        .description(spot.getDescription())
                        .descriptionShort(spot.getDescriptionShort())
                        .infoCenter(spot.getInfoCenter())
                        .homepage(spot.getHomepage())
                        .businessHours(spot.getBusinessHours())
                        .restDate(spot.getRestDate())
                        .parking(spot.getParking())
                        .price(spot.getPrice())
                        .build();
            }
            case 3 -> {
                Festival festival = festivalRepository.findByPlace(place)
                        .orElseThrow(() -> new CustomException(ErrorCode.FESTIVAL_DETAIL_NOT_FOUND));
                yield FestivalDetailResponseDto.builder()
                        .description(festival.getDescription())
                        .descriptionShort(festival.getDescriptionShort())
                        .infoCenter(festival.getInfoCenter())
                        .homepage(festival.getHomepage())
                        .period(festival.getPeriod())
                        .organizer(festival.getOrganizer())
                        .sns(festival.getSns())
                        .build();
            }
            default -> throw new CustomException(ErrorCode.UNSUPPORTED_CATEGORY_TYPE);
        };
    }

}
