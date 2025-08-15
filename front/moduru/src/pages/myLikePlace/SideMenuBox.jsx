import React, { useEffect, useRef, useState } from "react";
import "./myLikePlace.css";

export default function SideMenuBox({
  // NOTE: 드롭다운 항목 목록
  options = [],                 // 예: ['전체', '서울', '부산']
  placeholder = "선택하세요",    // NOTE: 기본 표시 문구
  onChange = () => {},          // NOTE: 항목 선택 콜백
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const boxRef = useRef(null);

  // NOTE: 바깥 클릭 시 닫기
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // NOTE: 항목 선택 처리
  const handleSelect = (value) => {
    setSelected(value);
    setOpen(false);
    onChange(value);
  };

  return (
    <div className="side-menu-box" ref={boxRef}>
      {/* NOTE: 맨 위 드롭다운 하나만 */}
      <div className={`dropdown ${open ? "open" : ""}`}>
        <button
          type="button"
          className="dropdown-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`dropdown-label ${selected ? "has-value" : ""}`}>
            {selected || placeholder}
          </span>
          <span className="dropdown-caret" aria-hidden="true">▾</span>
        </button>

        <ul className="dropdown-menu" role="listbox">
          {options.length === 0 ? (
            <li className="dropdown-empty">항목이 없습니다</li>
          ) : (
            options.map((opt) => (
              <li
                key={String(opt)}
                role="option"
                className={`dropdown-item ${
                  selected === opt ? "selected" : ""
                }`}
                onClick={() => handleSelect(opt)}
              >
                {String(opt)}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
