// src/features/tripCreate/ui/TripCreateFormHost.jsx
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRef } from "react";
import TripCreateForm from "./TripCreateForm";
import { setTripRoom } from "../../../redux/slices/tripRoomSlice";
import { closeTripForm } from "../../../redux/slices/uiSlice";
import "./TripCreateFormHost.css";

function toYmdLocal(d){
  if(!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  const local = new Date(x.getTime()-x.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}

// 포털로 뜨는 팝오버(react-datepicker, MUI 등) 무시용 셀렉터
const POPOVER_SELECTORS = [
  ".react-datepicker",          // react-datepicker
  ".MuiPopover-root",           // MUI Popover
  ".MuiPickersPopper-root",     // MUI Date pickers
  "[data-datepicker-popover]",  // 커스텀 훅일 경우
];

function isInWhitelistedPopover(target){
  if(!(target instanceof Element)) return false;
  return POPOVER_SELECTORS.some(sel => target.closest(sel));
}

export default function TripCreateFormHost(){
  const open = useSelector(s=>s.ui.isTripFormOpen);
  const trip = useSelector(s=>s.tripRoom);
  const dispatch = useDispatch();

  // 바깥클릭 robust 체크용 ref
  const downOnOverlayRef = useRef(false);

  if(!open) return null;

  const handleOverlayMouseDown = (e) => {
    // 팝오버 내부 클릭이면 닫기 금지
    if (isInWhitelistedPopover(e.target)) {
      downOnOverlayRef.current = false;
      return;
    }
    // 오버레이 자체를 눌렀을 때만 true
    downOnOverlayRef.current = (e.target === e.currentTarget);
  };

  const handleOverlayMouseUp = (e) => {
    // 시작도 overlay, 끝도 overlay일 때만 닫기
    if (downOnOverlayRef.current && e.target === e.currentTarget) {
      dispatch(closeTripForm());
    }
    downOnOverlayRef.current = false;
  };

  return createPortal(
    <div
      className="overlay-tripform"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      {/* overlay-panel div를 제거하고 TripCreateForm만 렌더 */}
      <TripCreateForm
        roomId={trip.roomId}
        fallbackTitle={trip.title}
        tripName={trip.title}
        setTripName={(v)=>dispatch(setTripRoom({ title: v }))}
        region={trip.region}
        setRegion={(v)=>dispatch(setTripRoom({ region: v }))}
        dates={[
          trip.startDate ? new Date(trip.startDate) : null,
          trip.endDate ? new Date(trip.endDate) : null,
        ]}
        setDates={([s,e])=>dispatch(setTripRoom({
          startDate: s ? toYmdLocal(s) : "",
          endDate:   e ? toYmdLocal(e) : "",
        }))}
        onClose={()=>dispatch(closeTripForm())}
        onSuccess={(updated)=>{
          if(updated) dispatch(setTripRoom({ ...trip, ...updated }));
          dispatch(closeTripForm());
        }}
      />
    </div>,
    document.body
  );
}
