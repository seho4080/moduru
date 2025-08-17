import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectMembersByRoom,
  fetchTripMembers,
  selectRoomOwner,
  removeTripMember,
} from '../../../redux/slices/tripMemberSlice';
import {
  selectFriendList,
  addFriendItem,
  removeFriendById,
} from '../../../redux/slices/friendSlice';

import { addFriend, removeFriend } from '../lib/tripMemberApi';
import { kickMember as kickMemberApi } from '../../invite/lib/inviteApi';
import { useAuth } from '../../../shared/model/useAuth';
import './memberList.css';

export default function MemberList({ roomId, onAdd, loading = false }) {
  const dispatch = useDispatch();

  // ✅ 로그인 사용자 id(문자/숫자 혼용 대비)
  const { userId: meId } = useAuth();
  const meIdStr = meId == null ? null : String(meId);

  const rawItems = useSelector((s) => selectMembersByRoom(s, roomId));
  const friendList = useSelector(selectFriendList);

  // ✅ 방장 정보 & 방장 여부
  const owner = useSelector((s) => selectRoomOwner(s, roomId));
  const canKick = !!owner && meIdStr !== null && String(owner.userId) === meIdStr;

  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [busyKey, setBusyKey] = useState(null); // 친구 추가/삭제 busy
  const [kickBusyId, setKickBusyId] = useState(null); // 강퇴 busy
  const menuRef = useRef(null);

  const hasItems = Array.isArray(rawItems) && rawItems.length > 0;

  // 🔎 디버그: 마운트/roomId 변경 시 상태 확인
  useEffect(() => {
    console.log('[MemberList][MOUNT] roomId=', roomId, 'meId=', meId, 'meIdStr=', meIdStr);
  }, [roomId, meId, meIdStr]);

  // ❗ 멤버가 비어 있으면 자동으로 1회 조회
  useEffect(() => {
    if (!hasItems && roomId != null) {
      console.log('[MemberList][AUTO] fetchTripMembers(roomId=', roomId, ')');
      dispatch(fetchTripMembers(roomId));
    }
  }, [hasItems, roomId, dispatch]);

  const normalize = (it) => {
    if (typeof it === 'string') {
      return { userId: null, nickname: it, email: '', display: it, id: it, profileImg: '', owner: false, isMe: false };
    }
    const userId = Number.isInteger(it?.userId) ? it.userId : null;
    const nickname = it?.nickname ?? '';
    const email = it?.email ?? '';
    const base = email ? `${nickname}(${email})` : nickname || '(이름없음)';
    const isMe = meIdStr !== null && String(userId) === meIdStr; // ← 타입 불일치 방지
    return {
      userId,
      nickname,
      email,
      profileImg: it?.profileImg ?? '',
      owner: Boolean(it?.owner),
      isMe,
      display: isMe ? `(나)${base}` : base,
      id: userId ?? it?.id ?? (nickname || email || Math.random().toString(36).slice(2)),
    };
  };

  const items = hasItems ? rawItems.map(normalize) : [];

  // 🔎 디버그: 정규화 후 미리보기
  useEffect(() => {
    console.log('[MemberList][ITEMS]', items.length, items.slice(0, 5));
  }, [items]);

  // friendSlice 존재 여부 O(1) 조회
  const friendIdSet = useMemo(() => {
    const s = new Set();
    for (const f of Array.isArray(friendList) ? friendList : []) {
      if (Number.isInteger(f?.userId)) s.add(`id:${f.userId}`);
      else if (f?.email) s.add(`em:${f.email}`);
    }
    return s;
  }, [friendList]);

  const isFriend = (member) => {
    const key =
      Number.isInteger(member.userId) ? `id:${member.userId}` :
      member.email ? `em:${member.email}` :
      null;
    return key ? friendIdSet.has(key) : false;
  };

  const toggleMenu = (idx) => setMenuOpenIdx((v) => (v === idx ? null : idx));

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpenIdx(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const initialOf = (nickname = '') => (nickname.trim()[0] ?? '').toUpperCase();

  // 친구 추가/삭제 토글
  const handleToggleFriend = async (member) => {
    setMenuOpenIdx(null);

    console.log('[MemberList][CLICK]', {
      member: { userId: member.userId, nickname: member.nickname, email: member.email },
      isFriendNow: isFriend(member),
      meIdStr,
    });

    if (!Number.isInteger(member.userId)) {
      alert('userId가 없어 처리할 수 없습니다.');
      return;
    }

    const keyForBusy = `${member.id}-friend`;
    setBusyKey(keyForBusy);
    try {
      if (isFriend(member)) {
        const res = await removeFriend(member.userId);
        console.log('[MemberList] removeFriend result:', res);
        if (res?.success) dispatch(removeFriendById({ userId: member.userId }));
      } else {
        const res = await addFriend(member.userId);
        console.log('[MemberList] addFriend result:', res);
        if (res?.success) {
          dispatch(addFriendItem({
            userId: member.userId,
            nickname: member.nickname,
            email: member.email ?? '',
            profileImg: member.profileImg ?? '',
            alreadyInvited: false,
          }));
          onAdd?.(member);
        }
      }
    } finally {
      setBusyKey(null);
    }
  };

  // ✅ 강퇴 실행 (방장만)
  const handleKick = useCallback(async (member) => {
    if (!canKick) { alert('방장만 강퇴할 수 있습니다.'); return; }
    if (member?.owner) { alert('방장은 강퇴할 수 없습니다.'); return; }
    if (member?.isMe) { alert('본인은 강퇴할 수 없습니다.'); return; }
    if (!Number.isInteger(member?.userId)) { alert('userId가 없어 강퇴할 수 없습니다.'); return; }

    const label = member?.nickname || member?.email || '해당 멤버';
    if (!confirm(`${label} 님을 방에서 내보낼까요?`)) return;

    setKickBusyId(member.userId);

    // 낙관적 제거
    dispatch(removeTripMember(roomId, { userId: member.userId }));

    // 서버 호출
    const res = await kickMemberApi(roomId, member.userId);
    if (!res.success) {
      // 실패 시 복구
      await dispatch(fetchTripMembers(roomId));
      alert(res.error || '강퇴에 실패했습니다.');
    }

    setKickBusyId(null);
  }, [canKick, roomId, dispatch]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="member-compact-loading">
        <p>멤버 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 아이템이 없을 때도 기본 구조는 렌더링
  if (!hasItems) {
    console.log('[MemberList] no items for roomId =', roomId);
    return (
      <div className="member-compact-empty">
        <p>멤버가 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className="member-compact" role="list" ref={menuRef}>
      {items.map((m, idx) => {
        const friendNow = isFriend(m);
        const label = friendNow ? '삭제' : '추가';
        const friendBusy = busyKey === `${m.id}-friend`;
        const kickBusy = kickBusyId === m.userId;
        const disableKick = !canKick || m.isMe || m.owner || kickBusy;

        return (
          <li key={`${m.id}-${idx}`} className="member-row" title={m.display}>
            <div className="member-left">
              <div className="member-avatar">{initialOf(m.nickname)}</div>
              <span className="member-text">
                {m.display}{m.owner && <strong className="owner-badge" style={{ marginLeft: 6 }}>방장</strong>}
              </span>
            </div>

            <button
              className="more-btn"
              onClick={() => toggleMenu(idx)}
              aria-haspopup="menu"
              aria-expanded={menuOpenIdx === idx}
              aria-label="더보기"
              type="button"
            >
              ⋯
            </button>

            {menuOpenIdx === idx && (
              <div className="dropdown-menu" role="menu">
                <button
                  role="menuitem"
                  type="button"
                  disabled={friendBusy}
                  onClick={() => handleToggleFriend(m)}
                >
                  {label}
                </button>

                <button
                  role="menuitem"
                  type="button"
                  disabled={disableKick}
                  title={
                    !canKick ? '방장만 강퇴할 수 있습니다.' :
                    m.owner ? '방장은 강퇴할 수 없습니다.' :
                    m.isMe ? '본인은 강퇴 불가' :
                    kickBusy ? '처리 중...' : '탈퇴'
                  }
                  onClick={() => {
                    if (disableKick) return;
                    handleKick(m);
                    setMenuOpenIdx(null);
                  }}
                >
                  {kickBusy ? '처리 중…' : '탈퇴'}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}