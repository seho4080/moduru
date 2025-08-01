import './RegionDropdown.css';

const REGIONS = [
  { name: '서울' }, { name: '부산' }, { name: '대구' }, { name: '인천' }, { name: '광주' },
  { name: '대전' }, { name: '울산' }, { name: '세종' }, { name: '수원' }, { name: '고양' },
  { name: '용인' }, { name: '창원' }, { name: '김해' }, { name: '양산' }, { name: '진주' },
  { name: '통영' }, { name: '사천' }, { name: '밀양' }, { name: '거제' }, { name: '남해' },
  { name: '하동' }, { name: '산청' }, { name: '함양' }, { name: '거창' }, { name: '합천' },
  { name: '의령' }, { name: '함안' }, { name: '창녕' }, { name: '포항' }, { name: '구미' },
  { name: '경산' }, { name: '청주' }, { name: '충주' }, { name: '제천' }, { name: '전주' },
  { name: '군산' }, { name: '익산' }, { name: '목포' }, { name: '여수' }, { name: '순천' },
  { name: '천안' }, { name: '아산' }, { name: '서산' }, { name: '춘천' }, { name: '원주' },
  { name: '강릉' }, { name: '제주' }, { name: '서귀포' }
];

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
