import "./placeDetailModal.css";
import { FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { clearSelectedPlace } from "../../redux/slices/mapSlice";
import { useRef, useEffect } from "react";

function useDraggable(modalRef) {
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e) => {
      isDragging = true;
      offsetX = e.clientX - modal.getBoundingClientRect().left;
      offsetY = e.clientY - modal.getBoundingClientRect().top;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      modal.style.left = `${e.clientX - offsetX}px`;
      modal.style.top = `${e.clientY - offsetY}px`;
      modal.style.transform = "none";
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    modal.addEventListener("mousedown", onMouseDown);
    return () => modal.removeEventListener("mousedown", onMouseDown);
  }, [modalRef]);
}

export default function PlaceDetailModal({ place }) {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  useDraggable(modalRef);

  const { placeName, placeImg, category } = place;

  const handleCloseModal = () => {
    dispatch(clearSelectedPlace());
  };

  return (
    <div ref={modalRef} className="place-detail-modal">
      <div className="place-detail-modal-header">
        <span className="place-detail-modal-title">{placeName}</span>
        <button className="place-detail-modal-close" onClick={handleCloseModal}>
          <FaTimes />
        </button>
      </div>

      <img src={placeImg} alt={placeName} className="place-detail-modal-img" />

      <div className="place-detail-modal-body">
        <p className="place-detail-modal-category">카테고리: {category}</p>
      </div>
    </div>
  );
}
