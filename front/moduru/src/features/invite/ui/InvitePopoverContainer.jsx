  // src/features/invite/ui/InvitePopoverContainer.jsx
  import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
  import { useDispatch, useSelector } from 'react-redux';
  import './invitePopover.css';
  import { createInviteLink, inviteFriends } from '../lib/inviteApi';
  import { selectFriendList, fetchInvitableFriends } from '../../../redux/slices/friendSlice';
  import { setTripMembers, addTripMember } from '../../../redux/slices/tripMemberSlice';
  import { getTripMembers } from '../../members/lib/tripMemberApi'; // ✅ 경로 통일
  import { closeInvite } from '../../../redux/slices/uiSlice';
  import SelectedFriendList from './SelectedFriendList';
  import InviteHeader from './InviteHeader';
  import InviteFooter from './InviteFooter';
  import MemberList from '../../members/ui/MemberList.jsx';

  export default function InvitePopoverContainer({ onClose }) {
    const dispatch = useDispatch();

    // 탭: 'share' | 'post'
    const [activeTab, setActiveTab] = useState('share');

    // 드롭다운/검색/선택/상태
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState([]); // [{id, email, nickName}]
    const [copied, setCopied] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [memberLoading, setMemberLoading] = useState(false);

    // 전역 상태
    const roomId = useSelector((s) => s.tripRoom.roomId);
    const friends = useSelector(selectFriendList) ?? [];

    // refs
    const rootRef = useRef(null);
    const ddWrapperRef = useRef(null);

    // 후보 목록 로드
    useEffect(() => {
      if (roomId) dispatch(fetchInvitableFriends(roomId));
    }, [roomId, dispatch]);

    // 멤버 탭 진입 시 방 멤버 조회 (캐시 보존 정책: 실패 시 기존 유지)
    useEffect(() => {
      if (activeTab !== 'post' || !roomId) return;

      let ignore = false;
      (async () => {
        setMemberLoading(true);
        try {
          const res = await getTripMembers(roomId);
          if (ignore) return;
          if (res?.success) {
            dispatch(setTripMembers({ roomId, members: res.members || [] }));
          }
          // 실패 시 캐시 유지: 아무것도 안 함
        } finally {
          if (!ignore) setMemberLoading(false);
        }
      })();

      return () => { ignore = true; };
    }, [activeTab, roomId, dispatch]);

    // 탭 전환 시 드롭다운 닫기
    useEffect(() => { setIsDropdownOpen(false); }, [activeTab]);

    // 팝오버 바깥 클릭 닫기
    useEffect(() => {
      const onDown = (e) => {
        const root = rootRef.current;
        if (!root) return;
        if (!root.contains(e.target)) handleClose();
      };
      const opts = { passive: true, capture: true };
      document.addEventListener('mousedown', onDown, true);
      document.addEventListener('touchstart', onDown, opts);
      return () => {
        document.removeEventListener('mousedown', onDown, true);
        document.removeEventListener('touchstart', onDown, opts);
      };
    }, []);

    // ESC로 팝오버 닫기
    useEffect(() => {
      const onEsc = (e) => { if (e.key === 'Escape') handleClose(); };
      document.addEventListener('keydown', onEsc);
      return () => document.removeEventListener('keydown', onEsc);
    }, []);

    // 드롭다운 바깥 클릭/ESC 닫기 (열렸을 때만)
    useEffect(() => {
      if (!isDropdownOpen) return;
      const outside = (e) => {
        if (!ddWrapperRef.current) return;
        if (!ddWrapperRef.current.contains(e.target)) setIsDropdownOpen(false);
      };
      const esc = (e) => { if (e.key === 'Escape') setIsDropdownOpen(false); };
      const opts = { passive: true };
      document.addEventListener('mousedown', outside);
      document.addEventListener('touchstart', outside, opts);
      document.addEventListener('keydown', esc);
      return () => {
        document.removeEventListener('mousedown', outside);
        document.removeEventListener('touchstart', outside, opts);
        document.removeEventListener('keydown', esc);
      };
    }, [isDropdownOpen]);

    // 닫기 공통 핸들러
    const handleClose = useCallback(() => {
      if (typeof onClose === 'function') onClose();
      dispatch(closeInvite());
    }, [dispatch, onClose]);

    // 드롭다운에서 친구 선택
    const handleSelectFriend = useCallback((friend) => {
      const idRaw = friend?.userId;
      const id = Number(idRaw);
      const email = friend?.email || '';
      const nickName = friend?.nickName || '';

      if (!Number.isFinite(id) || !email) return;

      setSelectedItems((prev) =>
        prev.some((x) => x.id === id) ? prev : [...prev, { id, email, nickName }]
      );
      setQuery('');
      setIsDropdownOpen(false);
    }, []);

    // 선택 제거
    const handleRemoveSelected = useCallback((id) => {
      setSelectedItems((prev) => prev.filter((x) => x.id !== id));
    }, []);

    // 친구 → 멤버 정규화 (slice 모델에 맞게)
    const normalizeFriendToMember = useCallback((f) => ({
      userId: Number(f.id) || null,
      nickname: f.nickName ?? '',
      email: f.email ?? '',
      profileImg: f.profileImg ?? '',
      owner: false,
      friend: true,
    }), []);

    // 초대 요청 (성공 시 멤버 리스트 갱신)
    const handleInvite = useCallback(async () => {
      if (!roomId || selectedItems.length === 0 || inviting) return;

      setInviting(true);
      const friendIds = selectedItems.map((x) => x.id);

      try {
        const result = await inviteFriends(roomId, friendIds);

        if (!result?.success) {
          console.log('[inviteFriends] 실패:', result);
          alert(result?.error || '초대 실패');
          return;
        }

        const raw = result.data ?? {};
        const msg = raw.message ?? raw.msg ?? raw.resultMessage ?? '초대가 완료되었습니다.';
        console.log('[inviteFriends] 성공:', msg, raw);

        // 성공 반영
        selectedItems.forEach((f) => {
          const member = normalizeFriendToMember(f);
          // ✅ addTripMember 페이로드 형태: { roomId, member }
          dispatch(addTripMember( roomId, member ));
        });

        const failedIds = Array.isArray(raw.failedIds) ? raw.failedIds : null;
        const invitedIds = Array.isArray(raw.invitedIds) ? raw.invitedIds : null;

        if (failedIds && failedIds.length > 0) {
          const failed = new Set(failedIds.map(Number));
          setSelectedItems((prev) => prev.filter((x) => failed.has(x.id)));
        } else if (invitedIds && invitedIds.length > 0) {
          const invited = new Set(invitedIds.map(Number));
          setSelectedItems((prev) => prev.filter((x) => !invited.has(x.id)));
        } else {
          setSelectedItems([]); // 전부 성공 가정
        }
      } finally {
        setInviting(false);
      }
    }, [roomId, selectedItems, inviting, dispatch, normalizeFriendToMember]);

    // 링크 복사
    const handleCopyLink = useCallback(async () => {
      if (!roomId) return alert('roomId가 존재하지 않습니다.');
      const result = await createInviteLink(roomId);
      if (result?.success && result.inviteUrl) {
        await navigator.clipboard.writeText(result.inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('초대 링크 생성 실패');
      }
    }, [roomId]);

    // 검색 필터 (memo)
    const filtered = useMemo(() => {
      if (!query) return friends;
      const q = query.toLowerCase();
      return friends.filter(
        (f) =>
          (f.email || '').toLowerCase().includes(q) ||
          (f.nickName || '').toLowerCase().includes(q)
      );
    }, [friends, query]);

    return (
      <div className="invite-popover" ref={rootRef}>
        {/* 닫기 버튼 */}
        <button
          className="invite-close"
          onClick={handleClose}
          aria-label="닫기"
          type="button"
        >
          ×
        </button>

        {/* 탭 바 */}
        <div className="invite-tabs" role="tablist" aria-label="share tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'share'}
            className={`invite-tab ${activeTab === 'share' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('share')}
          >
            초대
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'post'}
            className={`invite-tab ${activeTab === 'post' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            멤버
          </button>
        </div>

        {activeTab === 'share' ? (
          <>
            {/* 헤더: 검색/드롭다운/초대 버튼 */}
            <div className="invite-header">
              <div className="invite-input-row">
                <InviteHeader
                  ddWrapperRef={ddWrapperRef}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  query={query}
                  setQuery={setQuery}
                  filtered={filtered}
                  onPickFriend={handleSelectFriend}
                  onInvite={handleInvite}
                  inviting={inviting}
                  canInvite={selectedItems.length > 0 && !inviting}
                />
              </div>
            </div>

            {/* 바디: 선택된 친구 리스트 */}
            <div className={`invite-body ${selectedItems.length === 0 ? 'invite-body--center' : ''}`}>
              {selectedItems.length === 0 ? (
                <p className="empty-state">친구를 초대해주세요</p>
              ) : (
                <SelectedFriendList items={selectedItems} onRemove={handleRemoveSelected} />
              )}
            </div>

            {/* 푸터: 링크 복사 */}
            <InviteFooter copied={copied} onCopyLink={handleCopyLink} />
          </>
        ) : (
          <div className="invite-body">
            <MemberList roomId={roomId} loading={memberLoading} />
          </div>
        )}
      </div>
    );
  }
