// 링크 복사 UI만 담당
// src/features/invite/ui/InviteFooter.jsx
import React from 'react';

export default function InviteFooter({ copied, onCopyLink }) {
  return (
    <div className="invite-footer">
      <hr className="divider" />
      <div className="link-row">
        <button className="copy-link-button" onClick={onCopyLink}>
          {copied ? '복사 완료' : '링크 복사'}
        </button>
      </div>
    </div>
  );
}
