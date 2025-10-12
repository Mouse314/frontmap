

import { useState } from "react";
import type MapObject from "../engine/objects/MapObject";
import type Scene from "../engine/state/Scene";
import Color from "../engine/color/Color";

type RightSideProps = {
  changeVisible: (visible: boolean) => void;
  selectedObjects: MapObject[];
  scene: Scene | null;
};

export default function RightSide({ changeVisible, selectedObjects, scene }: RightSideProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Группировка объектов
  const brigades = selectedObjects.filter(obj => obj.type === 'Brigade');
  const lines = selectedObjects.filter(obj => obj.type === 'DefenceLine');

  // Для групповых контролов берём первое значение из группы (или дефолт)
  const getGroupValue = (arr: string | any[], key: string, def: string | number) => arr.length ? arr[0][key] : def;

  // Групповые обработчики
  const handleGroupScale = (arr: any[], value: number) => {
    arr.forEach(obj => { obj.scale = value; });
    scene?.render();
  };
  const handleGroupColor = (arr: any[], value: string) => {
    arr.forEach(obj => { obj.color = typeof obj.color === 'string' ? value : new Color(value); });
    scene?.render();
  };
  const handleGroupGray = (arr: any[], value: number) => {
    arr.forEach(obj => { obj.gray = value; });
    scene?.render();
  };

  // Групповой обработчик для isSpiked
  const handleGroupSpiked = (arr: any[], value: boolean) => {
    arr.forEach(obj => { obj.isSpiked = value; });
    scene?.render();
  };

  return (
    <aside style={{ overflow: !isVisible ? 'scroll' : undefined }} className="right-side">
      <div className="show-hide-right-block">
        <button onClick={() => {
          setIsVisible(!isVisible);
          changeVisible(!isVisible);
        }} style={{}}>{!isVisible ? "⬅️" : "➡️"}</button>
      </div>
      <h2>Right Side</h2>
      <h3>objects selected</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {brigades.length > 0 && (
          <div style={{ border: '1px solid #aaa', borderRadius: '8px', padding: '12px', background: '#f8f8ff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Бригады: {brigades.length} шт.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13 }}>Scale:</label>
              <input
                type="number"
                value={getGroupValue(brigades, 'scale', 1)}
                min={0.01}
                step={0.01}
                style={{ width: 60 }}
                onChange={e => handleGroupScale(brigades, parseFloat(e.target.value))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Цвет:</label>
              <select
                value={getGroupValue(brigades, 'color', 'rgba(255, 0, 0, 1)').toString()}
                onChange={e => handleGroupColor(brigades, e.target.value)}
                style={{ fontSize: 14 }}
              >
                <option value="rgba(255, 0, 0, 1)">Красный</option>
                <option value="rgba(0, 0, 255, 1)">Синий</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Интенсивность серого:</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={getGroupValue(brigades, 'gray', 0)}
                onChange={e => handleGroupGray(brigades, parseFloat(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 13 }}>{Math.round((getGroupValue(brigades, 'gray', 0)) * 100)}%</span>
            </div>
          </div>
        )}
        {lines.length > 0 && (
          <div style={{ border: '1px solid #aaa', borderRadius: '8px', padding: '12px', background: '#f8f8ff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Линии фронта: {lines.length} шт.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13 }}>Scale:</label>
              <input
                type="number"
                value={getGroupValue(lines, 'scale', 1)}
                min={0.01}
                step={0.01}
                style={{ width: 60 }}
                onChange={e => handleGroupScale(lines, parseFloat(e.target.value))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Цвет:</label>
              <select
                value={getGroupValue(lines, 'color', 'rgba(255, 0, 0, 1)').toString()}
                onChange={e => handleGroupColor(lines, e.target.value)}
                style={{ fontSize: 14 }}
              >
                <option value="rgba(255, 0, 0, 1)">Красный</option>
                <option value="rgba(0, 0, 255, 1)">Синий</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Интенсивность серого:</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={getGroupValue(lines, 'gray', 0)}
                onChange={e => handleGroupGray(lines, parseFloat(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 13 }}>{Math.round((getGroupValue(lines, 'gray', 0)) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={!!getGroupValue(lines, 'isSpiked', 0)}
                onChange={e => handleGroupSpiked(lines, e.target.checked)}
                id="spiked-checkbox"
              />
              <label htmlFor="spiked-checkbox" style={{ fontSize: 13, userSelect: 'none', cursor: 'pointer' }}>С шипами</label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
