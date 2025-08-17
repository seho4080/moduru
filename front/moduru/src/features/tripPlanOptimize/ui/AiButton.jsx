import './AiButton.css';

export default function AiButton({ onPlanClick, onRouteClick }) {
  return (
    <div className="buttonGroup">
      <button className="recommendButton" onClick={onPlanClick}>
        일정 추천
      </button>
      <button className="recommendButton" onClick={onRouteClick}>
        경로 추천
      </button>
    </div>
  );
}
