import React from "react";
import ProfileImage from "../../../shared/profileImage";
import { useUserInfo } from "../model/useUserInfo";

const ProfileBox = () => {
  const { userInfo } = useUserInfo();

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        내 프로필
      </h2>
      <div className="flex flex-col items-center">
        <ProfileImage />
        <div className="mt-4 text-sm text-gray-600 text-center space-y-1 leading-relaxed">
          <p>
            <span className="font-semibold">닉네임:</span> {userInfo?.nickname}
          </p>
          <p>
            <span className="font-semibold">이메일:</span> {userInfo?.email}
          </p>
          <p>
            <span className="font-semibold">성별:</span> {userInfo?.gender}
          </p>
          <p>
            <span className="font-semibold">생년월일:</span>{" "}
            {userInfo?.birthdate}
          </p>
        </div>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">
          정보 수정
        </button>
      </div>
    </section>
  );
};

export default ProfileBox;
