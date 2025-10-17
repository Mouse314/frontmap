import Color from "../color/Color.ts";
import { COLOR_GREY } from "../color/ColorConstants.ts";
import Point from "../math/Point.ts";
import type Rect from "../math/Rect.ts";
import Size from "../math/Size.ts";
import type Scene from "../state/Scene.ts";
import type MapObject from "./MapObject.ts";
import type { MapObjectType } from "./Types.ts";

export default class DefenceLine implements MapObject {

    deleted: boolean = false;

    name: string;
    position: Point;
    scale: number;
    points: Point[];
    directionPoint: Point;
    color: Color;
    spikesNum: number = 20;
    isEditingMode: boolean;

    isSpiked: boolean = false;

    gray: number = 0;

    type: MapObjectType = 'DefenceLine';

    prevStates: (DefenceLine | null)[] = [null, this];
    dayStart: number = 0;
    dayEnd: number = 0;

    constructor(name: string, position: Point, scale: number, points: Point[], color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.points = points;
        this.color = new Color(color);

        this.directionPoint = new Point((points[0].x + points[3].x) / 2, (points[0].y + points[3].y) / 2);

        this.isEditingMode = false;
    }

    // position: Point (lng, lat)
    setPosition(position: Point) {
        this.position = position;
        // Optionally, update points relative to new position (lng/lat)
        // Here, just shift all points by delta
        const delta = position.subtract(this.points[0]);
        for (let i = 0; i < this.points.length; i++) {
            this.points[i] = this.points[i].add(delta);
        }
        this.directionPoint = new Point((this.points[0].x + this.points[3].x) / 2, (this.points[0].y + this.points[3].y) / 2);
    }

    // delta: Point (lng, lat)
    translate(delta: Point, currentPoint: Point | null = null) {
        if (currentPoint) {
            currentPoint.translate(delta);
        } else {
            for (let i = 0; i < this.points.length; i++) {
                this.points[i] = this.points[i].add(delta);
            }
            this.position = this.position.add(delta);
            this.directionPoint = new Point((this.points[0].x + this.points[3].x) / 2, (this.points[0].y + this.points[3].y) / 2);
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
        // Используем lngLatToScreen для точного сравнения, как в Brigade
        for (const point of [...this.points, this.directionPoint]) {
            const screenPoint = scene.lngLatToScreen(point.x, point.y);
            if (
                Math.abs(screenPoint.x - mousePos.x) < 10 &&
                Math.abs(screenPoint.y - mousePos.y) < 10
            ) {
                return true;
            }
        }
        return false;
    }

    getNearestPoint(scene: Scene, mousePos: Point): Point | null {
        for (const point of [...this.points, this.directionPoint]) {
            const screenPoint = scene.lngLatToScreen(point.x, point.y);
            if (
                Math.abs(screenPoint.x - mousePos.x) < 10 &&
                Math.abs(screenPoint.y - mousePos.y) < 10
            ) {
                return point;
            }
        }
        return null;
    }

    isInsideRectSelection(scene: Scene, rect: Rect): boolean {
        // rect.start/end — world (lng/lat), выделение по экрану
        const screenStart = scene.lngLatToScreen(rect.start.x, rect.start.y);
        const screenEnd = scene.lngLatToScreen(rect.end.x, rect.end.y);
        const minX = Math.min(screenStart.x, screenEnd.x);
        const maxX = Math.max(screenStart.x, screenEnd.x);
        const minY = Math.min(screenStart.y, screenEnd.y);
        const maxY = Math.max(screenStart.y, screenEnd.y);

        // Проверяем, что все ключевые точки линии попадают в экранный прямоугольник выделения
        const screenPoints = [this.points[0], this.points[3]].map(p => scene.lngLatToScreen(p.x, p.y));
        return screenPoints.every(sp => sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY);
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        // Используем lngLatToScreen для всех точек
        const screenPoints = this.points.map(point => scene.lngLatToScreen(point.x, point.y));
        const mixColor = this.isEditingMode ? "orange" : this.color.lerp(COLOR_GREY, this.gray);
        ctx.fillStyle = mixColor.toString();
        ctx.strokeStyle = mixColor.toString();
        ctx.lineCap = "round";
        // Draw curve
        ctx.lineWidth = this.scale * 2;
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        ctx.bezierCurveTo(screenPoints[1].x, screenPoints[1].y, screenPoints[2].x, screenPoints[2].y, screenPoints[3].x, screenPoints[3].y);
        ctx.stroke();
        ctx.beginPath();
        // Draw spikes with fixed spacing
        if (this.isSpiked) {
            const p1 = this.points[0];
            const p2 = this.points[3];
            const p3 = this.directionPoint;
            const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            console.log("Cross product:", cross);
            const spikeSpacing = 15 + this.scale * 3; // px between spikes
            const spikeLength = 5 + this.scale * 2; // px spike length
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
                ctx.lineTo(point.x + (cross < 0 ? perp.x : -perp.x) * spikeLength, point.y + (cross < 0 ? perp.y : -perp.y) * spikeLength);
                ctx.stroke();
            }
        }
        const screenDirectionPoint = scene.lngLatToScreen(this.directionPoint.x, this.directionPoint.y);
        // Draw points
        if (this.isEditingMode) {
            ctx.fillStyle = "purple";
            screenPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = "magenta";
            ctx.beginPath();
            ctx.arc(screenDirectionPoint.x, screenDirectionPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    public clone(): MapObject {
        const newDefenceLine = new DefenceLine(
            this.name,
            this.position.copy(),
            this.scale,
            this.points.map(point => point.copy()),
            this.color.copy().toString()
        );
        newDefenceLine.isSpiked = this.isSpiked;
        newDefenceLine.directionPoint = this.directionPoint.copy();
        return newDefenceLine;
    }
    
    lerpAnimation(day: number, t: number) {
        if (day === this.dayEnd) {
            if (this.prevStates.length < 3) return
            // Плавное исчезновение в конце жизненного цикла
            const lerpBrigade = new DefenceLine(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                this.points,
                "red"
            );
            lerpBrigade.isSpiked = this.prevStates[day - this.dayStart]!.isSpiked;
            lerpBrigade.directionPoint = this.prevStates[day - this.dayStart]!.directionPoint.copy();
            const fadedColor = this.color.copy();
            fadedColor.a = 0;
            lerpBrigade.color = fadedColor.lerp(this.color, 1 - t);
            return lerpBrigade;
        }
        else if (day === this.dayStart) {
            // Плавное появления в начале жизненного цикла
            const lerpBrigade = new DefenceLine(
                this.name,
                this.prevStates[1]!.position,
                this.prevStates[1]!.scale,
                this.prevStates[1]!.points.map(point => point.copy()),
                "red"
            );
            lerpBrigade.isSpiked = this.prevStates[1]!.isSpiked;
            lerpBrigade.directionPoint = this.prevStates[1]!.directionPoint.copy();
            const fadedColor = this.color.copy();
            fadedColor.a = 0;
            lerpBrigade.color = fadedColor.lerp(this.color, t);
            return lerpBrigade;
        }
        else if (day > this.dayStart && day < this.dayEnd) {
            // Плавная трансформация в середине жизненного цикла
            const lerpBrigade = new DefenceLine(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                [
                    this.prevStates[day - this.dayStart]!.points[0].lerp(this.prevStates[day - this.dayStart + 1]!.points[0], t),
                    this.prevStates[day - this.dayStart]!.points[1].lerp(this.prevStates[day - this.dayStart + 1]!.points[1], t),
                    this.prevStates[day - this.dayStart]!.points[2].lerp(this.prevStates[day - this.dayStart + 1]!.points[2], t),
                    this.prevStates[day - this.dayStart]!.points[3].lerp(this.prevStates[day - this.dayStart + 1]!.points[3], t)
                ],
                "red"
            );
            lerpBrigade.isSpiked = this.prevStates[day - this.dayStart]!.isSpiked;
            lerpBrigade.directionPoint = this.prevStates[day - this.dayStart]!.directionPoint.copy();
            lerpBrigade.color = this.prevStates[day - this.dayStart]!.color.lerp(this.prevStates[day - this.dayStart + 1]!.color, t);
            return lerpBrigade;
        }
        else {
            // Это не наш день
            return null;
        }
    }
}