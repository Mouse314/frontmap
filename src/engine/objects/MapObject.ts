import type Point from "../math/Point";
import type Scene from "../state/Scene";

export default interface MapObject {
    name: string;
    position: Point;
    scale: number;
    draw: (scene: Scene) => void;
    getMouseMoveCallback: (scene: Scene, mousePos: Point) => Function | null;
}