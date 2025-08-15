package com.B108.tripwish.global.lock;

public interface RoomLockService {
    // 일정(AI 스케줄) 단일 실행 잠금
    boolean acquireScheduleLock(Long roomId);
    void releaseScheduleLock(Long roomId);

    // 일차 경로(AI 라우트) 단일 실행 잠금
    boolean acquireRouteLock(Long roomId, int day);
    void releaseRouteLock(Long roomId, int day);
}