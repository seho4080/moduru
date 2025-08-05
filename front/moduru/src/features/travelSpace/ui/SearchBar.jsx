import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";

const SearchBar = ({ onSearch }) => {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(keyword);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center bg-white rounded-md shadow px-4 py-2 w-full max-w-lg"
    >
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="여행방 이름 검색"
        className="flex-grow text-sm focus:outline-none"
      />
      <button type="submit" className="ml-2 text-gray-500 hover:text-black">
        <FiSearch size={18} />
      </button>
    </form>
  );
};

export default SearchBar;
