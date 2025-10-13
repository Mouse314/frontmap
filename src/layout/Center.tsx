import { useEffect, useRef } from "react";
import { initCanvas } from "../engine/main.ts";
import type Scene from "../engine/state/Scene.ts";
import type MapObject from "../engine/objects/MapObject.ts";

type CenterProps = {
    setScene: (scene: Scene | null) => void;
    setSelectedObjects: (objects: MapObject[]) => void;
};

export default function Center({ setScene, setSelectedObjects }: CenterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<Scene | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const scene = initCanvas(canvas);
            scene.setSelectedObjects = setSelectedObjects;
            sceneRef.current = scene;
            setScene(scene);
        }
        return () => {
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, []);

    return (
        <>
            <main></main>
            <canvas id="map" ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
        </>
    );
}
