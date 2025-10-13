import type Color from "../color/Color";
import type Point from "../math/Point";
import type Rect from "../math/Rect";
import type Scene from "../state/Scene";
import type { MapObjectType } from "./Types";

export default interface MapObject {

    deleted : boolean;

    // Unique identifier for the object
    name: string;
    position: Point;
    scale: number;
    isEditingMode: boolean;
    type: MapObjectType;

    // Color of the object
    color: Color;
    gray?: number;

    // Day system
    dayStart: number;
    dayEnd: number;
    prevStates: any[];

    // Positioning methods
    setPosition: (position: Point) => void;
    translate: (delta: Point, point?: Point | null) => void;
    draw: (scene: Scene) => void;

    clone: () => any;

    // Mouse interaction methods
    isMouseNear: (scene: Scene, mousePos: Point) => boolean;
    isInsideRectSelection: (scene: Scene, rect: Rect) => boolean;
    getNearestPoint?: (scene: Scene, mousePos: Point) => Point | null;

    // Animation methods
    lerpAnimation: (day : number, t : number) => any;
}