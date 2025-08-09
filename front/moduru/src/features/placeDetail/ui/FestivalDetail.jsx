// src/features/placeDetail/ui/FestivalDetail.jsx
import React from "react";

export default function FestivalDetail({ data = {} }) {
  const { address, organizer, homepage, sns } = data;

  const fixUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <section style={{ lineHeight: 1.6 }}>
      {/* 주소 */}
      {address && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>🏠</span>
          <span>{address}</span>
        </div>
      )}

      {/* 주최 */}
      {organizer && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>🧑‍💼</span>
          <span>{organizer}</span>
        </div>
      )}

      {/* 홈페이지 */}
      {homepage && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>🌐</span>
          <a
            href={fixUrl(homepage)}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#2563eb", wordBreak: "break-all" }}
          >
            {homepage}
          </a>
        </div>
      )}

      {/* SNS */}
      {sns && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>📷</span>
          <a
            href={fixUrl(sns)}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#2563eb", wordBreak: "break-all" }}
          >
            {sns}
          </a>
        </div>
      )}
    </section>
  );
}
