// src/redux/slices/friendSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { getInvitableFriends } from "../../features/invite/lib/inviteApi";

// NOTE: 스키마 표준화
const normalizeFriend = (f = {}) => ({
  userId: Number.isInteger(f.userId) ? f.userId : null,
  nickname: f.nickname ?? f.nickName ?? "",
  email: f.email ?? "",
  profileImg: f.profileImg ?? "",
  alreadyInvited: Boolean(f.alreadyInvited),
});

const initialState = {
  // NOTE: 이 리스트를 "내 친구 목록" 또는 "초대 가능한 친구 목록"으로 사용하고 있다면
  // normalize된 동일 스키마를 유지하면 컴포넌트가 단순해짐
  list: [],
};

const friendSlice = createSlice({
  name: "friend",
  initialState,
  reducers: {
    setFriendList(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      state.list = arr.map(normalizeFriend);
    },

    // ✅ 친구 1명 upsert(없으면 추가, 있으면 갱신)
    addFriendItem(state, action) {
      const f = normalizeFriend(action.payload);
      if (f.userId === null && !f.email) return; // 식별자 부재면 무시
      const idx = state.list.findIndex(
        (x) => (x.userId !== null && x.userId === f.userId) || (!!x.email && x.email === f.email)
      );
      if (idx === -1) state.list.push(f);
      else state.list[idx] = { ...state.list[idx], ...f };
    },

    // 선택: 필요하면 제거도 제공
    removeFriendById(state, action) {
      const { userId, email = "" } = action.payload ?? {};
      state.list = state.list.filter((x) => {
        if (Number.isInteger(userId)) return x.userId !== userId;
        return x.email !== email;
      });
    },
  },
});

export const { setFriendList, addFriendItem, removeFriendById } = friendSlice.actions;

// 셀렉터
export const selectFriendList = (state) => state.friend.list;

// 친구 목록 불러오기 
export const fetchInvitableFriends = (roomId) => async (dispatch) => {
  try {
    const { success, friends } = await getInvitableFriends(roomId);
    dispatch(setFriendList(success ? friends : []));
  } catch (e) {
    console.error("getInvitableFriends 실패:", e);
    dispatch(setFriendList([]));
  }
};

export default friendSlice.reducer;
