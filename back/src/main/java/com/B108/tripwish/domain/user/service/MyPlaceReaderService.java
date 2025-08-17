package com.B108.tripwish.domain.user.service;

import java.util.Collection;
import java.util.Set;

public interface MyPlaceReaderService {

  boolean isLiked(Long userId, Long placeId);

  Set<Long> getMyPlaceIds(Long userId, Collection<Long> placeIds);
}
