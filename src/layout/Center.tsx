
import { useEffect, useRef } from "react";
import { initCanvas } from "../engine/main.ts";
import type Scene from "../engine/state/Scene.ts";
import type MapObject from "../engine/objects/MapObject.ts";
import Effector from "../engine/shaderOverlay/effector.ts";

type CenterProps = {
    setScene: (scene: Scene | null) => void;
    setSelectedObjects: (objects: MapObject[]) => void;
};

export default function Center({ setScene, setSelectedObjects }: CenterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const effectorCanvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<Scene | null>(null);

    useEffect(() => {
        const effector = new Effector();
        effectorCanvasRef.current = effector.getCanvas();

        const canvas = canvasRef.current;
        if (canvas) {
            const scene = initCanvas(canvas);
            scene.setSelectedObjects = setSelectedObjects;
            scene.effector = effector;
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

    const effectorContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (effectorCanvasRef.current && effectorContainerRef.current) {
            const effectorCanvas = effectorCanvasRef.current;
            effectorCanvas.style.width = '100%';
            effectorCanvas.style.height = '100%';
            effectorCanvas.style.position = 'absolute';
            effectorCanvas.style.top = '0';
            effectorCanvas.style.left = '0';
            effectorContainerRef.current.innerHTML = "";
            effectorContainerRef.current.appendChild(effectorCanvas);
        }
    }, [effectorCanvasRef.current]);

    return (
        <>
            <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: -1 }}>
            </div>
            <canvas id="map" ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'all', background: 'black' }}></canvas>
            <div ref={effectorContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
        </>
    );
}
