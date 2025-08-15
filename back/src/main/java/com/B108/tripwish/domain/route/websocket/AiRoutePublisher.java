package com.B108.tripwish.domain.route.websocket;

import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;

public interface AiRoutePublisher {

  void started(Long roomId, String jobId, int days);

  void progress(Long roomId, String jobId, int progress);

  void done(Long roomId, String jobId, AiRecommendBroadcastDto result);

  void error(Long roomId, String jobId, String message);

  void invalidated(Long roomId, String reason);
}
