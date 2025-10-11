
import { useEffect, useRef } from "react";
import { initCanvas } from "../engine/main";
import type Scene from "../engine/state/Scene";

export default function Center({ setScene, setSelectedObjects }: { setScene: (scene: Scene | null) => void, setSelectedObjects: (objects: any[]) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const scene = initCanvas(canvas);
            scene.setSelectedObjects = setSelectedObjects;
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
