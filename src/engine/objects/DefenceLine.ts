import Point from "../math/Point";
import type Rect from "../math/Rect";
import Size from "../math/Size";
import type Scene from "../state/Scene";
import type MapObject from "./MapObject";
import type { MapObjectType } from "./Types";

export default class DefenceLine implements MapObject {
    name: string;
    position: Point;
    scale: number;
    points: Point[];
    color: string;
    spikesNum: number = 20;
    isEditingMode: boolean;

    type: MapObjectType = 'DefenceLine';

    constructor(name: string, position: Point, scale: number, points: Point[], color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.points = points;
        this.color = color;

        this.isEditingMode = false;
    }

    setPosition(position: Point) {
        this.position = position;
    }

    translate(delta: Point, currentPoint: Point | null = null) {
        if (currentPoint) {
            currentPoint.translate(delta);
        } 
        else {
            for (const point of this.points) {
                point.translate(delta);
            }
        }
    }

    calculateScreenScale(scene: Scene): Size {
        return new Size(Math.max(this.points.length / scene.scale, .03) * 20, Math.max(this.points.length / scene.scale, .03) * 10);
    }

    private bezierPoint(p1: Point, p2: Point, p3: Point, p4: Point, t: number): Point {
        const mt = 1 - t;
        return new Point(
            mt * mt * mt * p1.x + 3 * mt * mt * t * p2.x + 3 * mt * t * t * p3.x + t * t * t * p4.x,
            mt * mt * mt * p1.y + 3 * mt * mt * t * p2.y + 3 * mt * t * t * p3.y + t * t * t * p4.y
        );
    }

    private bezierTangent(p1: Point, p2: Point, p3: Point, p4: Point, t: number): Point {
        const mt = 1 - t;
        return new Point(
            3 * mt * mt * (p2.x - p1.x) + 6 * mt * t * (p3.x - p2.x) + 3 * t * t * (p4.x - p3.x),
            3 * mt * mt * (p2.y - p1.y) + 6 * mt * t * (p3.y - p2.y) + 3 * t * t * (p4.y - p3.y)
        );
    }

    isMouseNear(scene: Scene, mousePos: Point): boolean {

        for (const point of this.points) {
            const screenPoint = scene.worldToScreen(point);
            if (Math.abs(screenPoint.x - mousePos.x) < 10 && Math.abs(screenPoint.y - mousePos.y) < 10) {
                // Mouse is near this point
                return true;
            }
        }

        return false;
    }

    getNearestPoint(scene: Scene, mousePos: Point): Point | null {
        for (const point of this.points) {
            const screenPoint = scene.worldToScreen(point);
            if (Math.abs(screenPoint.x - mousePos.x) < 10 && Math.abs(screenPoint.y - mousePos.y) < 10) {
                // Mouse is near this point
                return point;
            }
        }

        return null;
    }

    isInsideRectSelection(scene: Scene, rect: Rect): boolean {

        const topLeft = new Point(Math.min(rect.start.x, rect.end.x), Math.min(rect.start.y, rect.end.y));
        const bottomRight = new Point(Math.max(rect.start.x, rect.end.x), Math.max(rect.start.y, rect.end.y));

        if (this.points[0].x >= topLeft.x && this.points[0].x <= bottomRight.x && this.points[0].y >= topLeft.y && this.points[0].y <= bottomRight.y &&
            this.points[3].x >= topLeft.x && this.points[3].x <= bottomRight.x && this.points[3].y >= topLeft.y && this.points[3].y <= bottomRight.y
        ) {
            return true;
        }

        return false;
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        const screenPoints = this.points.map(point => scene.worldToScreen(point));
        const screenSize = scene.worldSizeToScreen(this.calculateScreenScale(scene));

        ctx.fillStyle = this.isEditingMode ? "orange" : this.color;
        ctx.strokeStyle = this.isEditingMode ? "orange" : this.color;
        ctx.lineCap = "round";

        // Draw curve
        ctx.lineWidth = screenSize.height / 4;
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        ctx.bezierCurveTo(screenPoints[1].x, screenPoints[1].y, screenPoints[2].x, screenPoints[2].y, screenPoints[3].x, screenPoints[3].y);
        ctx.stroke();

        // Draw spikes with fixed spacing
        const spikeSpacing = 30; // px between spikes
        // Approximate curve length
        let curveLength = 0;
        let prev = this.bezierPoint(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], 0);
        const steps = 100;
        for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const curr = this.bezierPoint(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t);
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            curveLength += Math.sqrt(dx * dx + dy * dy);
            prev = curr;
        }
        const spikesNum = Math.max(1, Math.floor(curveLength / spikeSpacing));
        for (let i = 0; i <= spikesNum; i++) {
            const t = i / spikesNum;
            const point = this.bezierPoint(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t);
            const tangent = this.bezierTangent(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t);
            const perp = { x: -tangent.y, y: tangent.x };
            const length = Math.sqrt(perp.x * perp.x + perp.y * perp.y);
            if (length > 0) {
                perp.x /= length;
                perp.y /= length;
            }
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(point.x + perp.x * 15, point.y + perp.y * 15);
            ctx.stroke();
        }

        // Draw points
        if (this.isEditingMode) {
            ctx.fillStyle = this.isEditingMode ? "purple" : this.color;
            screenPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        ctx.restore();
    }
}