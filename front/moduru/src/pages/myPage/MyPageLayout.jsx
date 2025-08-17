// builtin
import React from "react";

// external
import Header from "../../widgets/header";
import Footer from "../../widgets/footer";
import { Outlet } from "react-router-dom";

const MyPageLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5faff] items-center relative">
      <div className="w-[90%] py-5 flex justify-between items-center">
        <Header />
      </div>

      <main className="flex-1 flex flex-col md:flex-row justify-center items-stretch gap-12 px-4 max-w-[1000px] w-[90%] bg-white rounded-[40px] shadow-md" style={{ paddingTop: 0, marginTop: 0 }}>
        <Outlet />
      </main>

      <footer className="mt-10 text-sm text-gray-500 text-center">
        <Footer />
      </footer>
    </div>
  );
};

export default MyPageLayout;
