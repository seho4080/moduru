// src/redux/slices/tripMemberSlice.js

// NOTE: 초기 상태
const initialState = {
  // NOTE: roomId별 멤버 배열 저장
  membersByRoomId: {}, // { [roomId]: [ { userId, nickname, email, profileImg, owner, friend } ] }
};

// NOTE: 액션 타입
const SET_TRIP_MEMBERS   = 'tripMember/SET_TRIP_MEMBERS';   // NOTE: 전체 동기화(교체)
const CLEAR_TRIP_MEMBERS = 'tripMember/CLEAR_TRIP_MEMBERS';
const ADD_TRIP_MEMBER    = 'tripMember/ADD_TRIP_MEMBER';    // NOTE: 부분 추가(병합)
const REMOVE_TRIP_MEMBER = 'tripMember/REMOVE_TRIP_MEMBER'; // NOTE: 부분 삭제

// NOTE: 유틸 - 정규화 & 키 생성
function normalizeMember(m) {
  return {
    userId: typeof m.userId === 'number' ? m.userId : null,
    nickname: m.nickname ?? '',
    email: m.email ?? '',
    profileImg: m.profileImg ?? '',
    owner: Boolean(m.owner),
    friend: Boolean(m.friend),
  };
}
function memberKey(m) {
  return m.userId !== null ? `id:${m.userId}` : `em:${m.email}`;
}

// NOTE: 유틸 - 방장 불변식 보장
// - 목록에 owner:true 가 하나도 없으면: 첫 멤버를 owner:true로 승격
// - owner:true 가 여러 명이면: "첫 번째만" owner 유지, 나머지는 owner:false
function ensureOwnerInvariant(list) {
  if (!Array.isArray(list) || list.length === 0) return list ?? [];

  let firstOwnerIdx = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i]?.owner) { firstOwnerIdx = i; break; }
  }

  const next = list.map((m) => ({ ...m }));

  if (firstOwnerIdx === -1) {
    // 방장 없으면 첫 멤버를 방장으로
    next[0].owner = true;
  } else {
    // 여러 방장일 경우 첫 방장만 유지
    for (let i = 0; i < next.length; i++) {
      next[i].owner = i === firstOwnerIdx;
    }
  }

  // 방장을 항상 맨 앞으로 오게 정렬(표시 안정성)
  next.sort((a, b) => Number(b.owner) - Number(a.owner));
  return next;
}

// NOTE: 액션 생성자
export const setTripMembers = ({ roomId, members }) => ({
  type: SET_TRIP_MEMBERS,
  payload: { roomId, members },
});
export const clearTripMembers = (roomId) => ({
  type: CLEAR_TRIP_MEMBERS,
  payload: roomId,
});
export const addTripMember = (roomId, member) => ({
  type: ADD_TRIP_MEMBER,
  payload: { roomId, member },
});
export const removeTripMember = (roomId, { userId = null, email = '' } = {}) => ({
  type: REMOVE_TRIP_MEMBER,
  payload: { roomId, userId, email },
});

// NOTE: 리듀서
export default function tripMemberReducer(state = initialState, action) {
  switch (action.type) {
    case SET_TRIP_MEMBERS: {
      const { roomId, members } = action.payload;

      // NOTE: 서버 응답으로 해당 방의 목록을 "교체"
      const seen = new Set();
      const normalized = [];
      for (const raw of Array.isArray(members) ? members : []) {
        const m = normalizeMember(raw);
        const key = memberKey(m);
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push(m);
      }

      const finalList = ensureOwnerInvariant(normalized);

      return {
        ...state,
        membersByRoomId: {
          ...state.membersByRoomId,
          [roomId]: finalList,
        },
      };
    }

    case ADD_TRIP_MEMBER: {
      const { roomId, member } = action.payload;
      const list = state.membersByRoomId[roomId] ?? [];
      const m = normalizeMember(member);
      const key = memberKey(m);

      // NOTE: 중복 방지 병합
      const exists = list.some(x => memberKey(x) === key);
      const merged = exists ? list : [...list, m];

      // NOTE: 최초 추가라면 자동으로 방장 지정(이미 있으면 유지)
      const finalList = ensureOwnerInvariant(merged);

      return {
        ...state,
        membersByRoomId: {
          ...state.membersByRoomId,
          [roomId]: finalList,
        },
      };
    }

    case REMOVE_TRIP_MEMBER: {
      const { roomId, userId, email } = action.payload;
      const list = state.membersByRoomId[roomId] ?? [];
      const nextList = list.filter(x => {
        // NOTE: userId 우선 식별, 없으면 email로 식별
        if (userId !== null) return x.userId !== userId;
        return x.email !== (email ?? '');
      });

      // NOTE: 방장 삭제 후에도 항상 한 명을 방장으로 유지(목록이 남아 있다면)
      const finalList = ensureOwnerInvariant(nextList);

      return {
        ...state,
        membersByRoomId: {
          ...state.membersByRoomId,
          [roomId]: finalList,
        },
      };
    }

    case CLEAR_TRIP_MEMBERS: {
      const roomId = action.payload;
      const next = { ...state.membersByRoomId };
      delete next[roomId];
      return { ...state, membersByRoomId: next };
    }

    default:
      return state;
  }
}

// NOTE: 셀렉터 - 방별 멤버 배열(방장이 맨 앞)
export const selectMembersByRoom = (state, roomId) =>
  state.tripMember?.membersByRoomId?.[roomId] ?? [];

// NOTE: 셀렉터 - 방장 단일 객체
export const selectRoomOwner = (state, roomId) => {
  const list = selectMembersByRoom(state, roomId);
  return list.find(m => m.owner) ?? list[0] ?? null;
};

// NOTE: 셀렉터 - 방장 제외 멤버 배열
export const selectMembersExceptOwner = (state, roomId) => {
  const list = selectMembersByRoom(state, roomId);
  const owner = list.find(m => m.owner);
  if (!owner) return list.slice(1); // 방장 표시가 없다면 첫 번째를 방장으로 간주
  const ok = (x) => (x.userId !== null ? `id:${x.userId}` : `em:${x.email}`);
  const ownerKey = ok(owner);
  return list.filter(m => ok(m) !== ownerKey);
};

// NOTE: 셀렉터 - 표시용 "닉네임(이메일)" 문자열 배열(전체)
export const selectMemberDisplayList = (state, roomId) =>
  selectMembersByRoom(state, roomId).map((m) => {
    const nick = m.nickname && m.nickname.trim().length ? m.nickname : '닉네임없음';
    return m.email ? `${nick}(${m.email})` : nick;
  });

// NOTE: 셀렉터 - 표시용 그룹 { owner, members: [] }
export const selectMemberDisplayGroups = (state, roomId) => {
  const owner = selectRoomOwner(state, roomId);
  const others = selectMembersExceptOwner(state, roomId);
  const fmt = (m) => {
    if (!m) return null;
    const nick = m.nickname && m.nickname.trim().length ? m.nickname : '닉네임없음';
    return m.email ? `${nick}(${m.email})` : nick;
  };
  return {
    owner: fmt(owner),
    members: others.map(fmt),
  };
};

// NOTE: 비동기 로더(thunk) - 전체 동기화(교체)
// NOTE: 정책 - 성공 + 빈 배열: 교체 / 실패: 기존 상태 보존(디스패치 생략)
export const fetchTripMembers = (roomId) =>
  async (dispatch, _getState, { getTripMembers }) => {
    const res = await getTripMembers(roomId);

    // NOTE: 실패 시 캐시 유지(디스패치 생략)
    if (!res?.success) return;

    // NOTE: 성공 시 서버 값으로 교체(빈 배열도 그대로 반영)
    dispatch(setTripMembers({ roomId, members: Array.isArray(res.members) ? res.members : [] }));
  };
