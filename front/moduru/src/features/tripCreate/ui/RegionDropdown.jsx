// src/features/tripCreate/RegionDropdown.jsx
import { REGIONS } from '../lib/regionName'; // ✅ 상대 경로 주의
import './RegionDropdown.css';

export default function RegionDropdown({ value, onChange }) {
  return (
    <div className="region-dropdown-container">
      <label className="region-label">여행지</label>
      <select
        className="region-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled hidden>
          여행지
        </option>
        {REGIONS.map((r, i) => (
          <option key={i} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
