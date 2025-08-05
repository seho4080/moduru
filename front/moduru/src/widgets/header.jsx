import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/model/useAuth";
import logoImage from "../assets/images/moduru-logo.png";
import loginIcon from "../assets/icons/login-icon.png";

const Header = ({ onLoginIconClick, nickname }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      onLoginIconClick();
    } else {
      navigate("/my-page");
    }
  };

  return (
    <header className="w-full flex justify-center bg-[#f5faff]">
      <div className="w-full max-w-[1000px] flex justify-between items-center px-6 py-5">
        <div
          className="w-[100px] h-auto cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logoImage} alt="로고" className="w-full h-auto" />
        </div>
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={handleProfileClick}
        >
          <img
            src={loginIcon}
            alt="로그인 아이콘"
            className="w-[50px] h-[50px]"
          />
          {isLoggedIn && (
            <span className="text-sm text-gray-700 mt-1">{nickname}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
