import './AiButton.css';

export default function AiButton({ onPlanClick, onRouteClick }) {
  return (
    <div className="buttonGroup">
      <button className="recommendButton" onClick={onPlanClick}>
        AI 일정 추천
      </button>
      <button className="recommendButton" onClick={onRouteClick}>
        AI 경로 추천
      </button>
    </div>
  );
}
