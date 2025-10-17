
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

    // Mouse event delegation from Leaflet to Scene
    // useEffect(() => {
    //     const leafletDiv = document.getElementById('leaflet-map');
    //     const scene = sceneRef.current;
    //     if (!leafletDiv || !scene) return;

    //     // Handlers that delegate to Scene
    //     const handleMouseDown = (e: MouseEvent) => scene.onMouseDown && scene.onMouseDown(e);
    //     const handleMouseUp = (e: MouseEvent) => scene.onMouseUp && scene.onMouseUp(e);
    //     const handleMouseMove = (e: MouseEvent) => scene.onMouseMove && scene.onMouseMove(e);
    //     const handleContextMenu = (e: MouseEvent) => scene.onContextMenu && scene.onContextMenu(e);
    //     const handleWheel = (e: WheelEvent) => scene.onMouseWheel && scene.onMouseWheel(e);

    //     leafletDiv.addEventListener('mousedown', handleMouseDown);
    //     leafletDiv.addEventListener('mouseup', handleMouseUp);
    //     leafletDiv.addEventListener('mousemove', handleMouseMove);
    //     leafletDiv.addEventListener('contextmenu', handleContextMenu);
    //     leafletDiv.addEventListener('wheel', handleWheel);

    //     return () => {
    //         leafletDiv.removeEventListener('mousedown', handleMouseDown);
    //         leafletDiv.removeEventListener('mouseup', handleMouseUp);
    //         leafletDiv.removeEventListener('mousemove', handleMouseMove);
    //         leafletDiv.removeEventListener('contextmenu', handleContextMenu);
    //         leafletDiv.removeEventListener('wheel', handleWheel);
    //     };
    // }, [sceneRef.current]);

    return (
        <>
            <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: -1 }}>
                {/* <LeafletMap /> */}
            </div>
            <canvas id="map" ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'all', background: 'black' }}></canvas>
        </>
    );
}
