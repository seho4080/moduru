// src/features/invite/ui/InviteButtonWithPopover.jsx
import { useRef, useState, useEffect } from 'react';
import InviteButton from './InviteButton';
import InvitePopover from './InvitePopover';

export default function InviteButtonWithPopover({ roomMembers, friendList }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const togglePopover = () => setIsOpen((prev) => !prev);
  const closePopover = () => setIsOpen(false);

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        closePopover();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={buttonRef}>
        <InviteButton onClick={togglePopover} />
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 9999,
          }}
        >
          <InvitePopover roomMembers={roomMembers} friendList={friendList} />
        </div>
      )}
    </div>
  );
}
