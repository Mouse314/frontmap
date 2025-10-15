import type Color from "../color/Color.ts";
import type Point from "../math/Point.ts";
import type Rect from "../math/Rect.ts";
import type Scene from "../state/Scene.ts";
import type { MapObjectType } from "./Types.ts";

// All coordinates are now in WGS84 (lng, lat)
export default interface MapObject {
    deleted : boolean;
    // Unique identifier for the object
    name: string;
    position: Point; // lng, lat (WGS84)
    scale: number;
    isEditingMode: boolean;
    type: MapObjectType;
    color: Color;
    gray?: number;
    dayStart: number;
    dayEnd: number;
    prevStates: any[];
    setPosition: (position: Point) => void;
    translate: (delta: Point, point?: Point | null) => void;
    draw: (scene: Scene) => void;
    clone: () => any;
    isMouseNear: (scene: Scene, mousePos: Point) => boolean;
    isInsideRectSelection: (scene: Scene, rect: Rect) => boolean;
    getNearestPoint?: (scene: Scene, mousePos: Point) => Point | null;
    lerpAnimation: (day : number, t : number) => any;
}