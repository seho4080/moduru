import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeAiModal } from "../../../redux/slices/aiScheduleSlice";
import "./aiScheduleModal.css";

/**
 * Redux 기반 AI 일정 추천 모달
 * - STARTED/PROGRESS: 진행 표시
 * - DONE: 결과(일자/순서) 렌더
 * - ERROR/INVALIDATED: 배너 표시
 */
export default function AiScheduleModal() {
  const dispatch = useDispatch();
  const { isOpen, status, message, jobId, days, progress, groups, hasResult } =
    useSelector((s) => s.aiSchedule);

  const dayKeys = useMemo(
    () =>
      Object.keys(groups)
        .map(Number)
        .sort((a, b) => a - b),
    [groups]
  );

  if (!isOpen) return null;

  return (
    <div className="ai-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ai-modal">
        <header className="ai-modal-header">
          <h2>AI 일정 미리보기 {jobId ? `(Job #${jobId})` : ""}</h2>
          <span
            className={`ai-chip ai-chip-${(status || "idle").toLowerCase()}`}
          >
            {status}
          </span>
          <button className="ai-close" onClick={() => dispatch(closeAiModal())}>
            ×
          </button>
        </header>

        <section className="ai-modal-body">
          {(status === "STARTED" || status === "PROGRESS") && (
            <div className="ai-status-box">
              <div className="ai-row">
                <div className="ai-spinner" />
                <div>
                  <div>
                    {status === "STARTED" ? "일정 생성 시작" : "일정 구성 중"}
                  </div>
                  {Number.isFinite(days) && (
                    <div className="ai-sub">여행일수: {days}일</div>
                  )}
                </div>
              </div>
              <div className="ai-progress">
                <div
                  className="ai-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress || 0))}%`,
                  }}
                />
              </div>
              <div className="ai-progress-text">
                {Math.round(progress || 0)}%
              </div>
            </div>
          )}

          {status === "ERROR" && (
            <div className="ai-status-box ai-failed">
              <p>{message || "오류가 발생했습니다."}</p>
            </div>
          )}

          {status === "INVALIDATED" && (
            <div className="ai-status-box ai-warn">
              <p>
                {message || "이전 작업이 무효화되었습니다. 다시 실행해주세요."}
              </p>
            </div>
          )}

          {status === "DONE" && !hasResult && (
            <div className="ai-status-box">
              <p>최종 결과를 정리 중입니다. 잠시 후 결과가 표시됩니다.</p>
            </div>
          )}

          {dayKeys.length > 0 && (
            <div className="ai-days">
              {dayKeys.map((day) => {
                const legs = groups[day] ?? [];
                return (
                  <div className="ai-day-card" key={day}>
                    <h3>{day}일차</h3>
                    <ol className="ai-legs">
                      {legs.map((leg, i) => (
                        <li className="ai-leg" key={`${leg.wantId}-${i}`}>
                          <div className="ai-leg-left">
                            {leg.placeImg ? (
                              <img
                                className="ai-thumb"
                                src={leg.placeImg}
                                alt={leg.placeName || "place"}
                                onError={(e) => {
                                  e.currentTarget.style.visibility = "hidden";
                                }}
                              />
                            ) : (
                              <div className="ai-thumb ai-thumb-placeholder" />
                            )}
                            <div>
                              <div className="ai-place-name">
                                {leg.placeName ?? "-"}
                              </div>
                              <div className="ai-meta">
                                ID: {leg.wantId} · 이동수단:{" "}
                                {leg.transport ?? "-"}
                              </div>
                            </div>
                          </div>
                          <div className="ai-leg-right">
                            <div>순서: {leg.eventOrder ?? "-"}</div>
                            <div>
                              좌표: {leg.lat}, {leg.lng}
                            </div>
                            <div>다음이동시간: {leg.nextTravelTime ?? "-"}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="ai-modal-footer">
          <button className="ai-btn" onClick={() => dispatch(closeAiModal())}>
            닫기
          </button>
          {/* TODO: "이 일정 적용" 버튼 연결 */}
        </footer>
      </div>
    </div>
  );
}
