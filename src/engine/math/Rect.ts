import type Scene from "../state/Scene.ts";
import type Point from "./Point.ts";

export default class Rect {
    public start: Point;
    public end: Point;

    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }

    public draw(scene: Scene) {
        if (!scene) return;

        const start = scene.worldToScreen(this.start);
        const end = scene.worldToScreen(this.end);

        scene.ctx.save();

        scene.ctx.strokeStyle = "red";
        scene.ctx.lineWidth = 6;
        scene.ctx.setLineDash([20, 20]); // пунктир: 20px линия, 20px пробел
        scene.ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        scene.ctx.setLineDash([]); // сбросить пунктир для других фигур

        scene.ctx.restore();
    }
}
