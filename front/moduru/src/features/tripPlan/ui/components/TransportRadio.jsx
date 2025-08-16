// src/features/itinerary/ui/components/TransportRadio.jsx
import React from "react";

export default function TransportRadio({
  value,
  onChange,
  disabled,
  name = "transport",
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="inline-flex items-center gap-1">
        <input
          type="radio"
          name={name}
          value="driving"
          checked={value === "driving"}
          onChange={() => onChange?.("driving")}
          disabled={disabled}
        />
        <span>운전</span>
      </label>
      <label className="inline-flex items-center gap-1">
        <input
          type="radio"
          name={name}
          value="transit"
          checked={value === "transit"}
          onChange={() => onChange?.("transit")}
          disabled={disabled}
        />
        <span>대중교통</span>
      </label>
    </div>
  );
}
