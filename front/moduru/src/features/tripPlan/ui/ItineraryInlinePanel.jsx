import ItineraryEditorView from "./ItineraryEditorView";

export default function ItineraryInlinePanel({ onClose }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* 모달이 아니므로 lockScroll=false */}
      <ItineraryEditorView onClose={onClose} lockScroll={false} />
    </div>
  );
}
