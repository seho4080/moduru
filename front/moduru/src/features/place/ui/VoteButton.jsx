// src/features/place/ui/VoteButton.jsx
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postPlaceVote } from "../../placeVote/lib/placeVoteApi";
import { selectVoteByWantId, setVoteError, setVoteLoading } from "../../../redux/slices/placeVoteSlice";

/**
 * 최소 요구: roomId, wantId
 * - 클릭 시 POST
 * - 결과는 WS 브로드캐스트로 최종 반영
 * - 로딩 동안 비활성화 처리
 */
export default function VoteButton({ roomId, wantId, className = "" }) {
  const dispatch = useDispatch();
  const { count, isVoted, loading } = useSelector((s) => selectVoteByWantId(s, wantId));

  const onClick = useCallback(async () => {
    if (!roomId || !wantId || loading) return;
    try {
      dispatch(setVoteLoading({ wantId, loading: true }));
      await postPlaceVote(roomId, wantId);
      // 최종 상태는 WS 수신으로 갱신됨
    } catch (err) {
      dispatch(setVoteError({ wantId, error: err?.message || "vote failed" }));
    } finally {
      dispatch(setVoteLoading({ wantId, loading: false }));
    }
  }, [dispatch, roomId, wantId, loading]);

  // 간단한 스타일. 프로젝트 CSS에 맞게 바꿔도 됨.
  const btnStyle = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: isVoted ? "#222" : "#fff",
    color: isVoted ? "#fff" : "#222",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    minWidth: 64,
  };

  return (
    <button
      type="button"
      aria-pressed={isVoted ? "true" : "false"}
      disabled={loading}
      onClick={onClick}
      className={className}
      style={btnStyle}
      title={isVoted ? "투표 취소" : "투표"}
    >
      투표 {Number.isFinite(count) ? `(${count})` : ""}
    </button>
  );
}