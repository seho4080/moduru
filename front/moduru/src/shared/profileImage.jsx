import React from "react";
import mascotImage from "../assets/images/moduru-mascot.png";

const ProfileImage = () => {
  return (
    <img
      src={mascotImage}
      alt="프로필 이미지"
      className="w-20 h-20 rounded-full shadow-md"
    />
  );
};

export default ProfileImage;
