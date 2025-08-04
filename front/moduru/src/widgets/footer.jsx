// src/widgets/footer.jsx

import React from "react";

const Footer = () => {
  return (
    <footer className="mt-10 text-xs text-gray-500 text-center">
      © 2025 에잇(스파). All rights reserved
    </footer>
  );
};

export default Footer;

// src/features/myPage/model/useUserInfo.js

import { useSelector } from "react-redux";

export const useUserInfo = () => {
  const userInfo = useSelector((state) => state.user.userInfo);
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  return { userInfo, isLoggedIn };
};
