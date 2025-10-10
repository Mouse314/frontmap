import { useState } from "react";
import Center from "./layout/Center"
import Header from "./layout/Header"
import LeftSide from "./layout/LeftSide"
import RightSide from "./layout/RightSide"

import './layout/style.css';

function App() {

  const [isLeftVisible, setIsLeftVisible] = useState(false);
  const [isRightVisible, setIsRightVisible] = useState(false);

  return (
    <div className="app">
      <Header />
      <div className="content" style={{gridTemplateColumns: `${isLeftVisible ? '1fr' : '50px'} 4fr ${isRightVisible ? '1fr' : '100px'}`}}>
        <LeftSide changeVisible={setIsLeftVisible} />
        <Center />
        <RightSide changeVisible={setIsRightVisible} />
      </div>
    </div>
  )
}

export default App