import { useEffect, useRef } from "react";
import { initCanvas } from "../engine/main";

export default function Center() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // ...установка размеров...
            initCanvas(canvas);
        }
        // Можно добавить очистку, если нужно
        return () => {
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, []);

    return (
        <>
            <main>
            </main>
            <canvas id="map" ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
        </>
    );
}
