// src/pages/tripRoomPage/components/MapHeaderBar.jsx
import React from "react";
import InviteButtonWithPopover from "../../../features/invite/ui/InviteButtonWithPopover";

/**
 * 상단 우측 유틸 바
 * - 초대 팝오버 버튼을 표시한다.
 * - 필요 시 onExit 콜백이 주어지면 나가기 버튼을 함께 노출한다.
 * - 부모 컨테이너는 position: relative 여야 한다.
 */
export function MapHeaderBar({
  roomMembers = [], // 안전한 기본값
  friendList = [], // 안전한 기본값
  onExit, // 선택적: 나가기 액션
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        gap: 8,
      }}
    >
      <InviteButtonWithPopover
        roomMembers={roomMembers}
        friendList={friendList}
      />
    </div>
  );
}
