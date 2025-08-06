// src/redux/slices/tripMemberSlice.js

// 초기 상태
const initialState = {
  membersByRoomId: {}, // { roomId: [ { email }, { email } ] }
};

// 액션 타입 상수
const SET_TRIP_MEMBERS = 'tripMember/SET_TRIP_MEMBERS';
const CLEAR_TRIP_MEMBERS = 'tripMember/CLEAR_TRIP_MEMBERS';

// 액션 생성자
export const setTripMembers = ({ roomId, members }) => ({
  type: SET_TRIP_MEMBERS,
  payload: { roomId, members },
});

export const clearTripMembers = (roomId) => ({
  type: CLEAR_TRIP_MEMBERS,
  payload: roomId,
});

// 리듀서 함수
export default function tripMemberReducer(state = initialState, action) {
  switch (action.type) {
    case SET_TRIP_MEMBERS: {
      const { roomId, members } = action.payload;

      const existing = state.membersByRoomId[roomId] || [];
      const merged = [...existing];

      members.forEach((m) => {
        if (!merged.some((e) => e.email === m.email)) {
          merged.push(m);
        }
      });

      return {
        ...state,
        membersByRoomId: {
          ...state.membersByRoomId,
          [roomId]: merged,
        },
      };
    }

    case CLEAR_TRIP_MEMBERS: {
      const roomId = action.payload;
      const newState = { ...state.membersByRoomId };
      delete newState[roomId];
      return {
        ...state,
        membersByRoomId: newState,
      };
    }

    default:
      return state;
  }
}
