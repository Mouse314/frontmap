import { useState } from "react";

type RightSideProps = {
    changeVisible: (visible: boolean) => void;
};

export default function RightSide({ changeVisible }: RightSideProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <aside className="right-side">
      <div className="show-hide-right-block">
        <button onClick={() => {
          setIsVisible(!isVisible);
          changeVisible(!isVisible);
        }} style={{}}>{!isVisible ? "⬅️" : "➡️"}</button>
      </div>
      <h2>Right Side</h2>
    </aside>
  )
}
