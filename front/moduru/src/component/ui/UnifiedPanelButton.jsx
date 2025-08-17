// src/components/ui/UnifiedPanelButton.jsx
import React, { useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

export default function UnifiedPanelButton({
  onClick,
  disabled = false,
  direction = "right", // "left" | "right"
  title = "",
  icon = "calendar", // "calendar" | "close"
  subtitle = "",
  className = "",
  style = {},
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isLeft = direction === "left";
  const isClose = icon === "close";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={className}
      style={{
        position: "absolute",
        top: "50%",
        [isLeft ? "left" : "right"]: "-3px",
        transform: "translateY(-50%)",
        width: "32px",
        height: "64px",
        borderRadius: isLeft ? "16px 0 0 16px" : "0 16px 16px 0",
        background: disabled
          ? "#d1d5db"
          : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
        color: "white",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          isHovered && !disabled
            ? "0 12px 24px rgba(79, 70, 229, 0.4)"
            : "0 6px 12px rgba(0, 0, 0, 0.15)",
        transform:
          isHovered && !disabled
            ? `translateY(-50%) scale(1.05) translateX(${
                isLeft ? "-2px" : "2px"
              })`
            : "translateY(-50%)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.6 : 1,
        overflow: "hidden",
        zIndex: 20,
        ...style,
      }}
      title={title}
      aria-label={title}
    >
      {/* 배경 애니메이션 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)",
          opacity: isHovered && !disabled ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* 메인 아이콘 */}
      {isClose ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            marginBottom: "4px",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            marginBottom: "4px",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      )}

      {/* 방향 화살표 */}
      {isLeft ? (
        <BiChevronRight
          size={14}
          style={{
            transform: isHovered ? "translateX(1px)" : "translateX(0)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
        />
      ) : (
        <BiChevronLeft
          size={14}
          style={{
            transform: isHovered ? "translateX(-1px)" : "translateX(0)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
        />
      )}

      {/* 서브타이틀 */}
      {subtitle && (
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "7px",
            fontWeight: "600",
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: "1px 3px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            opacity: isHovered ? 1 : 0.8,
            transition: "opacity 0.2s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* 🎨 호버 시 향상된 툴팁 */}
      {isHovered && !disabled && title && (
        <div
          style={{
            position: "absolute",
            left: isLeft ? "40px" : "-120px",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#1f2937",
            color: "white",
            fontSize: "13px",
            fontWeight: "500",
            padding: "8px 12px",
            borderRadius: "8px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
            zIndex: 1001,
            animation: "fadeInSlide 0.2s ease-out",
          }}
        >
          {title}

          {/* 화살표 */}
          <div
            style={{
              position: "absolute",
              [isLeft ? "left" : "right"]: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              [isLeft ? "borderRight" : "borderLeft"]: "5px solid #1f2937",
            }}
          />
        </div>
      )}
    </button>
  );
}
