import type Point from "../math/Point";
import type Rect from "../math/Rect";
import type Scene from "../state/Scene";
import type { MapObjectType } from "./Types";

export default interface MapObject {
    name: string;
    position: Point;
    scale: number;
    isEditingMode: boolean;
    type: MapObjectType;
    color: string;
    setPosition: (position: Point) => void;
    translate: (delta: Point, point?: Point | null) => void;
    draw: (scene: Scene) => void;
    isMouseNear: (scene: Scene, mousePos: Point) => boolean;
    isInsideRectSelection: (scene: Scene, rect: Rect) => boolean;

    getNearestPoint?: (scene: Scene, mousePos: Point) => Point | null;
}