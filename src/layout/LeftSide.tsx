import { useState } from "react";
import Brigade from "../engine/objects/Brigade.ts";
import Point from "../engine/math/Point.ts";
import DefenceLine from "../engine/objects/DefenceLine.ts";
import type Scene from "../engine/state/Scene.ts";
import Battle from "../engine/objects/Battle.ts";
import BattleLine from "../engine/objects/BattleLine.ts";

type LeftSideProps = {
    changeVisible: (visible: boolean) => void;
    scene: Scene | null;
};

export default function LeftSide({ changeVisible, scene }: LeftSideProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <aside
            className="left-side"
            style={{ overflow: !isVisible ? 'hidden' : undefined }}
        >
            <div className="show-hide-left-block">
                <button onClick={() => {
                    setIsVisible(!isVisible);
                    changeVisible(!isVisible);
                }} style={{}}>{!isVisible ? "➡️" : "⬅️"}</button>
            </div>
            <h2>Left Side</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                <button
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: scene ? 'linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)' : 'gray',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onClick={() => {
                        if (scene) {
                            scene.addingObject = new Brigade("", new Point(0, 0), 2, "rgba(255, 0, 0, 1)");
                        }

                        setIsVisible(false);
                    }}
                >
                    бригада
                </button>
                <button
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: scene ? 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)' : 'gray',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onClick={() => {
                        if (scene) {
                            const startPoint = new Point(0, 0);
                            const geoDelta = scene.screenToLngLat(new Point(100, 0)).subtract(scene.screenToLngLat(startPoint));
                            scene.addingObject = new DefenceLine("", new Point(0, 0), 2, [startPoint, startPoint.add(geoDelta.multiply(1)), startPoint.add(geoDelta.multiply(2)), startPoint.add(geoDelta.multiply(3))], "rgba(0, 0, 255, 1)");
                        }
                        setIsVisible(false);
                    }}
                >
                    линия обороны
                </button>
                <button
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: scene ? 'linear-gradient(90deg, #979911ff 0%, #efaf38ff 100%)' : 'gray',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onClick={() => {
                        if (scene) {
                            scene.addingObject = new Battle("", new Point(0, 0), 2, "rgba(0, 0, 255, 1)");
                        }
                        setIsVisible(false);
                    }}
                >
                    битва
                </button>
                <button
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: scene ? 'linear-gradient(90deg, #ff8008 0%, #ffc837 100%)' : 'gray',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onClick={() => {
                        if (scene) {
                            const startPoint = new Point(0, 0);
                            const geoDelta = scene.screenToLngLat(new Point(100, 0)).subtract(scene.screenToLngLat(startPoint));
                            scene.addingObject = new BattleLine("", new Point(0, 0), 1, [startPoint, startPoint.add(geoDelta.multiply(1)), startPoint.add(geoDelta.multiply(2)), startPoint.add(geoDelta.multiply(3))], "rgba(255, 255, 255, 1)");
                        }
                        setIsVisible(false);
                    }}
                >
                    линия боёв
                </button>
            </div>
        </aside>
    );
}
