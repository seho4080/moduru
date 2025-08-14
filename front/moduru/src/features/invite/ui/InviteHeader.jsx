// 검색 인풋 + 드롭다운 + 초대 버튼만 담당
// src/features/invite/ui/InviteHeader.jsx
import React from 'react';

export default function InviteHeader({
  ddWrapperRef,
  isDropdownOpen,
  setIsDropdownOpen,
  query,
  setQuery,
  filtered,
  onPickFriend,
  onInvite,
  inviting,
  canInvite,
}) {
  return (
    <>
      {/* NOTE: ref로 바깥 클릭 감지 영역 지정 */}
      <div className="dropdown-input-wrapper" ref={ddWrapperRef}>
        <input
          type="text"
          placeholder="친구 목록 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={() => setIsDropdownOpen(true)}
        />

        {isDropdownOpen && (
          <div className="dropdown-list">
            {filtered.length > 0 ? (
              filtered.map((f) => {
                const name = (f.nickName ?? '').trim();
                const email = f.email ?? '';

                return (
                  <button
                    type="button"
                    key={f.userId}
                    className="dropdown-item"
                    onClick={() => onPickFriend(f)}
                  >
                    {name ? (
                      <>
                        <strong className="dropdown-nick">{name}</strong>
                        <span className="dropdown-email">({email})</span>
                      </>
                    ) : (
                      <span className="dropdown-email">{email}</span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="dropdown-item empty">현재 친구 목록이 없습니다</div>
            )}
          </div>
        )}
      </div>

      <button
        className="invite-button"
        onClick={onInvite}
        disabled={!canInvite}
      >
        {inviting ? '초대 중…' : '초대'}
      </button>
    </>
  );
}
