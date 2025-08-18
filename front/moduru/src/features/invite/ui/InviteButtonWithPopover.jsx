// src/features/invite/ui/InviteButtonWithPopover.jsx
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InviteButton from './InviteButton.jsx';
import InvitePopoverContainer from './InvitePopoverContainer.jsx';
import { toggleInvite, closeInvite } from '../../../redux/slices/uiSlice';

export default function InviteButtonWithPopover() {
  const dispatch = useDispatch();
  const isOpen = useSelector((s) => s.ui.isInviteOpen); // 전역 열림 상태
  const buttonRef = useRef(null);

  const onToggle = () => dispatch(toggleInvite());
  const onClose  = () => dispatch(closeInvite());

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={buttonRef}>
        <InviteButton onClick={onToggle} />
      </div>

      {/* ✅ 전역 상태로 게이트: true일 때만 컨테이너 렌더 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
          }}
        >
          <InvitePopoverContainer onClose={onClose} />
        </div>
      )}
    </div>
  );
}
