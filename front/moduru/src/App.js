// // // src/App.js
// // import React from 'react';
// // import SidebarContainer from './widgets/sidebar/SidebarContainer';

// // function App() {
// //   return (
// //     <div className="App">
// //       <SidebarContainer />
// //     </div>
// //   );
// // }

// // export default App;

// import React, { useState, useRef } from 'react';
// import Controls from './features/map/ui/MapControls';
// import KakaoMap from './features/map/ui/KakaoMap';

// export default function App() {
//   const [mode, setMode]             = useState('marker');
//   const [zoomable, setZoomable]     = useState(true);
//   const [region, setRegion]         = useState(null);
//   const [removeMode, setRemoveMode] = useState(false);
//   const [toRemove, setToRemove]     = useState(new Set());
//   const mapRef = useRef();

//   const handleDeleteConfirm = () => {
//     if (toRemove.size === 0) {
//       alert('삭제할 핀을 먼저 선택하세요.');
//       return;
//     }
//     if (window.confirm('삭제하시겠습니까?')) {
//       toRemove.forEach(mk => mk.setMap(null));
//       setToRemove(new Set());
//       setRemoveMode(false);
//       setMode('marker');
//     }
//   };

//   return (
//     <>
//       <Controls
//         mode={mode} setMode={setMode}
//         zoomable={zoomable} setZoomable={setZoomable}
//         zoomIn={()=>mapRef.current.zoomIn()}
//         zoomOut={()=>mapRef.current.zoomOut()}
//         region={region} setRegion={setRegion}
//         removeMode={removeMode} setRemoveMode={setRemoveMode}
//         onDeleteConfirm={handleDeleteConfirm}
//       />
//       <KakaoMap
//         ref={mapRef}
//         mode={mode}
//         zoomable={zoomable}
//         region={region}
//         removeMode={removeMode}
//         onSelectMarker={selSet=>setToRemove(new Set(selSet))}
//       />
//     </>
//   );
// }

import React, { useState, useRef } from 'react';
import SidebarContainer from './widgets/sidebar/SidebarContainer';
import Controls from './features/map/ui/MapControls';
import KakaoMap from './features/map/ui/KakaoMap';

export default function App() {
  const [mode, setMode] = useState('marker');
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());
  const mapRef = useRef();

  const handleDeleteConfirm = () => {
    if (toRemove.size === 0) {
      alert('삭제할 핀을 먼저 선택하세요.');
      return;
    }
    if (window.confirm('삭제하시겠습니까?')) {
      toRemove.forEach(mk => mk.setMap(null));
      setToRemove(new Set());
      setRemoveMode(false);
      setMode('marker');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* ⬅️ 왼쪽 사이드바 */}
      <SidebarContainer />

      {/* ➡️ 오른쪽 지도 + 컨트롤 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Controls
          mode={mode} setMode={setMode}
          zoomable={zoomable} setZoomable={setZoomable}
          zoomIn={() => mapRef.current.zoomIn()}
          zoomOut={() => mapRef.current.zoomOut()}
          region={region} setRegion={setRegion}
          removeMode={removeMode} setRemoveMode={setRemoveMode}
          onDeleteConfirm={handleDeleteConfirm}
        />
        <KakaoMap
          ref={mapRef}
          mode={mode}
          zoomable={zoomable}
          region={region}
          removeMode={removeMode}
          onSelectMarker={selSet => setToRemove(new Set(selSet))}
        />
      </div>
    </div>
  );
}
