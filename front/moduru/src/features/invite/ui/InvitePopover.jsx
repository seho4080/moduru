// src/features/invite/ui/InvitePopover.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import './invitePopover.css';
import { useAuth } from '../../../shared/model/useAuth';
import { createInviteLink } from '../lib/inviteApi';

export default function InvitePopover({ roomMembers, friendList }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const roomId = useSelector((state) => state.tripRoom.roomId);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const handleSelectFriend = (email) => {
    setSelectedEmail(email);
    setIsDropdownOpen(false);
  };

  const handleInvite = () => {
    if (selectedEmail) {
      // NOTE: 친구 초대는 추후 inviteFriend API로 구현 예정
      console.log(`초대할 이메일: ${selectedEmail}`);
    }
  };

  const handleCopyLink = async () => {
    if (!roomId) {
      alert('roomId가 존재하지 않습니다.');
      return;
    }

    const result = await createInviteLink(roomId);
    if (result.success) {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert('초대 링크 생성에 실패했습니다.');
    }
  };

  // NOTE: 로그인 유저가 방 멤버 목록에 없다면 UI 상단에 수동 추가
  const fullMembers = [...roomMembers];
  if (user && !roomMembers.some((m) => m.email === user.email)) {
    fullMembers.unshift({
      email: user.email,
      name: user.name || '나',
      isSelf: true,
    });
  }

  return (
    <div className="invite-popover">
      <div className="invite-input-row">
        <div className="dropdown-input-wrapper">
          <input
            type="text"
            placeholder="친구 목록 검색"
            value={selectedEmail}
            onClick={toggleDropdown}
            readOnly
          />
          {isDropdownOpen && (
            <div className="dropdown-list">
              {friendList.length > 0 ? (
                friendList.map((friend) => (
                  <div
                    key={friend.email}
                    className="dropdown-item"
                    onClick={() => handleSelectFriend(friend.email)}
                  >
                    {friend.name} ({friend.email})
                  </div>
                ))
              ) : (
                <div className="dropdown-item empty">현재 친구 목록이 없습니다</div>
              )}
            </div>
          )}
        </div>
        <button className="invite-button" onClick={handleInvite}>
          초대
        </button>
      </div>

      <div className="member-list">
        {fullMembers.map((member) => (
          <div key={member.email} className="member-row">
            <div className="member-icon">{member.email.charAt(0)}</div>
            <div className="member-info">
              <div className="member-name">
                {member.email}
                {member.email === user?.email && ' (나)'}
              </div>
            </div>
            <div className="member-permission">전체 허용</div>
          </div>
        ))}
      </div>

      <hr className="divider" />

      <div className="link-row">
        <button className="copy-link-button" onClick={handleCopyLink}>
          {copied ? '복사 완료' : '링크 복사'}
        </button>
      </div>
    </div>
  );
}
