// // src/shared/ui/WishStarButton.jsx
// import { useState } from 'react';
// import { FaRegStar, FaStar } from 'react-icons/fa';

// export default function WishStarButton({ place }) {
//   const [wished, setWished] = useState(false);

//   const toggleWish = () => {
//     setWished((prev) => !prev);
//     // TODO: 나중에 API 연결 예정
//   };

//   return (
//     <button onClick={toggleWish} title="찜하기" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
//       {wished ? <FaStar color="#ffcc00" size={18} /> : <FaRegStar color="#ccc" size={18} />}
//     </button>
//   );
// }
