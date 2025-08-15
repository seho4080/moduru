package com.B108.tripwish.domain.schedule.websocket;

import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;

import java.util.List;

public interface AiSchedulePublisher {

    /** 추천 작업 시작 알림 (로딩 표시용) */
    void started(Long roomId, String jobId, int days);

    /** 진행률 업데이트 (필요 없으면 구현에서 no-op 가능) */
    void progress(Long roomId, String jobId, int progress /* 0~100 */);

    /** 추천 결과 완료 알림 (프리뷰 렌더용) */
    void done(Long roomId, String jobId, AiRecommendBroadcastDto result);

    /** 실패 알림 */
    void error(Long roomId, String jobId, String message);

    /** 방 설정 변경 등으로 기존 프리뷰가 무효화될 때 */
    void invalidated(Long roomId, String reason);
}
