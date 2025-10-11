

import { useState } from "react";
import type MapObject from "../engine/objects/MapObject";
import type Scene from "../engine/state/Scene";

type RightSideProps = {
  changeVisible: (visible: boolean) => void;
  selectedObjects: MapObject[];
  scene: Scene | null;
};

export default function RightSide({ changeVisible, selectedObjects, scene }: RightSideProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Обработчик изменения scale
  const handleScaleChange = (object: MapObject, value: number) => {
    object.scale = value;
    scene?.render();
  };

  return (
    <aside className="right-side">
      <div className="show-hide-right-block">
        <button onClick={() => {
          setIsVisible(!isVisible);
          changeVisible(!isVisible);
        }} style={{}}>{!isVisible ? "⬅️" : "➡️"}</button>
      </div>
      <h2>Right Side</h2>
      <h3>objects selected</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {selectedObjects.map((object, idx) => (
          <div key={object.name + idx} style={{
            border: '1px solid #aaa',
            borderRadius: '8px',
            padding: '12px',
            background: '#f8f8ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{object.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Позиция: {object.position?.toString?.()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13 }}>Scale:</label>
              <input
                type="number"
                value={object.scale}
                min={0.01}
                step={0.01}
                style={{ width: 60 }}
                onChange={e => handleScaleChange(object, parseFloat(e.target.value))}
              />
            </div>
            {/* Можно добавить другие поля для редактирования */}
          </div>
        ))}
      </div>
    </aside>
  );
}
