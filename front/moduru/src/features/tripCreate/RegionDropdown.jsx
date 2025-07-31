import './RegionDropdown.css';

const REGIONS = [
  { name: '서울'},
  { name: '대전'},
  { name: '부산' },
  { name: '광주' },
  { name: '대구'}
];

export default function RegionDropdown({ value, onChange }) {
  return (
    <div className="region-dropdown-container">
      <label className="region-label">여행지</label>
      <select
        className="region-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">선택하세요</option>
        {REGIONS.map((r, i) => (
          <option key={i} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
