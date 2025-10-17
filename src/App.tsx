import { useState } from "react";
import Center from "./layout/Center";
import Header from "./layout/Header";
import LeftSide from "./layout/LeftSide";
import RightSide from "./layout/RightSide";

import './layout/style.css';
import type Scene from "./engine/state/Scene.ts";
import type MapObject from "./engine/objects/MapObject.ts";
import Footer from "./layout/Footer";

function App() {
  const [isLeftVisible, setIsLeftVisible] = useState(false);
  const [isRightVisible, setIsRightVisible] = useState(true);
  const [scene, setScene] = useState<Scene | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<MapObject[]>([]);
  const [isAllHidden, setIsAllHidden] = useState(false);

  return (
    <div className="app">
      <button style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000
      }}
        onClick={() => setIsAllHidden(!isAllHidden)}>
        🐶
      </button>
      {!isAllHidden && <Header />}
      <div className="content" style={{ gridTemplateColumns: `${isLeftVisible ? '1fr' : '50px'} 4fr ${isRightVisible ? '1fr' : '100px'}` }}>
        {!isAllHidden && <LeftSide changeVisible={setIsLeftVisible} scene={scene} />}
        <div className="center-block">
          <Center setSelectedObjects={setSelectedObjects} setScene={setScene} />
          {!isAllHidden && <Footer scene={scene} />}
        </div>
        {!isAllHidden && <RightSide changeVisible={setIsRightVisible} selectedObjects={selectedObjects} scene={scene} />}
      </div>
    </div>
  );
}

export default App;