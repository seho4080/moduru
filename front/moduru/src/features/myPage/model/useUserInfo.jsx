import { useSelector } from "react-redux";

export const useUserInfo = () => {
  const userInfo = useSelector((state) => state.user.userInfo);
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  return { userInfo, isLoggedIn };
};
