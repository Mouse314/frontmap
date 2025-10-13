import { useState } from "react";
import Center from "./layout/Center";
import Header from "./layout/Header";
import LeftSide from "./layout/LeftSide";
import RightSide from "./layout/RightSide";

import './layout/style.css';
import type Scene from "./engine/state/Scene";
import type MapObject from "./engine/objects/MapObject";
import Footer from "./layout/Footer";

function App() {
  const [isLeftVisible, setIsLeftVisible] = useState(false);
  const [isRightVisible, setIsRightVisible] = useState(true);
  const [scene, setScene] = useState<Scene | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<MapObject[]>([]);

  return (
    <div className="app">
      <Header />
      <div className="content" style={{ gridTemplateColumns: `${isLeftVisible ? '1fr' : '50px'} 4fr ${isRightVisible ? '1fr' : '100px'}` }}>
        <LeftSide changeVisible={setIsLeftVisible} scene={scene} />
        <div className="center-block">
          <Center setSelectedObjects={setSelectedObjects} setScene={setScene} />
          <Footer scene={scene} />
        </div>
        <RightSide changeVisible={setIsRightVisible} selectedObjects={selectedObjects} scene={scene} />
      </div>
    </div>
  );
}

export default App;