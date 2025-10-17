import Scene from "./state/Scene.ts";

export function initCanvas(canvas: HTMLCanvasElement) {
    const scene = new Scene(canvas);

    scene.mapController.updateMap();

    return scene;
}

