import { REGIONS } from '../lib/regionName';
import './regionDropdown.css';

export default function RegionDropdown({ value, onChange }) {
  // NOTE: 선택된 지역 값을 변경하고 상위 컴포넌트에 전달함
  return (
    <div className="region-dropdown-container">
      <label className="region-label" htmlFor="region-select">
        여행지
      </label>
      <select
        id="region-select"
        className="region-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled hidden>
          여행지를 선택해주세요
        </option>
        {REGIONS.map((region) => (
          <option key={region.name} value={region.name}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );
}
