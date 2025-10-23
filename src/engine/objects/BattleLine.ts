import Color from "../color/Color.ts";
import { COLOR_GREY } from "../color/ColorConstants.ts";
import Point from "../math/Point.ts";
import type Rect from "../math/Rect.ts";
import Size from "../math/Size.ts";
import type Scene from "../state/Scene.ts";
import type MapObject from "./MapObject.ts";
import type { MapObjectType } from "./Types.ts";

export default class BattleLine implements MapObject {

    deleted: boolean = false;

    name: string;
    position: Point;
    scale: number;
    points: Point[];
    glowDirection: 'both' | 'left' | 'right' = 'both';
    color: Color;
    isEditingMode: boolean;
    public t: number = 0;

    gray: number = 0;

    type: MapObjectType = 'BattleLine';

    prevStates: (BattleLine | null)[] = [null, this];
    dayStart: number = 0;
    dayEnd: number = 0;

    constructor(name: string, position: Point, scale: number, points: Point[], color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.points = points;
        this.color = new Color(color);
        this.isEditingMode = false;
    }

    setPosition(position: Point) {
        this.position = position;
        const delta = position.subtract(this.points[0]);
        for (let i = 0; i < this.points.length; i++) {
            this.points[i] = this.points[i].add(delta);
        }
    }

    translate(delta: Point, currentPoint: Point | null = null) {
        if (currentPoint) {
            currentPoint.translate(delta);
        } else {
            for (let i = 0; i < this.points.length; i++) {
                this.points[i] = this.points[i].add(delta);
            }
            this.position = this.position.add(delta);
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
        for (const point of this.points) {
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
        const screenStart = scene.lngLatToScreen(rect.start.x, rect.start.y);
        const screenEnd = scene.lngLatToScreen(rect.end.x, rect.end.y);
        const minX = Math.min(screenStart.x, screenEnd.x);
        const maxX = Math.max(screenStart.x, screenEnd.x);
        const minY = Math.min(screenStart.y, screenEnd.y);
        const maxY = Math.max(screenStart.y, screenEnd.y);

        const screenPoints = [this.points[0], this.points[3]].map(p => scene.lngLatToScreen(p.x, p.y));
        return screenPoints.every(sp => sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY);
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        const screenPoints = this.points.map(point => scene.lngLatToScreen(point.x, point.y));
        const mixColor = this.isEditingMode ? "orange" : this.color.lerp(COLOR_GREY, this.gray);
        ctx.strokeStyle = mixColor.toString();
        ctx.lineCap = "round";

        // --- Основная линия ---
        ctx.lineWidth = this.scale;
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        ctx.bezierCurveTo(screenPoints[1].x, screenPoints[1].y, screenPoints[2].x, screenPoints[2].y, screenPoints[3].x, screenPoints[3].y);
        ctx.stroke();

        // --- Свечение ---
        const drawGlow = (direction: number) => {
            const offset = this.scale * 2.5;
            const steps = 30;
            const lightYellow = new Color('rgba(255, 180, 0, 1)');
            const darkYellow = new Color('rgba(255, 180, 0, 1)');

            for (let i = 0; i < steps; i++) {
                // Анимация длины каждого сегмента
                const lengthAnim = Math.sin(this.t * 5 + i * 0.5) * 0.2 + 0.8; // от 0.8 до 1.2
                const gradientOffset = offset * 6 * lengthAnim;

                // Анимация цвета (lerp между светло- и темно-желтым)
                const colorT = Math.sin(this.t * 3 + i * 0.8) * 0.5 + 0.5; // от 0 до 1
                const gradColor = lightYellow.lerp(darkYellow, colorT);

                // Анимация непрозрачности
                const alphaAnim = Math.sin(this.t * 4 + i * 0.6) * 0.1 + 0.4; // от 0.3 до 0.5
                
                const startColor = `rgba(${gradColor.r}, ${gradColor.g}, ${gradColor.b}, ${alphaAnim})`;
                const endColor = `rgba(${gradColor.r}, ${gradColor.g}, ${gradColor.b}, 0)`;

                const t1 = i / steps;
                const t2 = (i + 1) / steps;

                const p_start1 = this.bezierPoint(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t1);
                const p_start2 = this.bezierPoint(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t2);

                const tangent1 = this.bezierTangent(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t1);
                const perp1 = new Point(-tangent1.y, tangent1.x).normalize().multiply(direction);
                const p_end1 = p_start1.add(perp1.multiply(gradientOffset));

                const tangent2 = this.bezierTangent(screenPoints[0], screenPoints[1], screenPoints[2], screenPoints[3], t2);
                const perp2 = new Point(-tangent2.y, tangent2.x).normalize().multiply(direction);
                const p_end2 = p_start2.add(perp2.multiply(gradientOffset));

                const gradient = ctx.createLinearGradient(p_start1.x, p_start1.y, p_end1.x, p_end1.y);
                gradient.addColorStop(0, startColor);
                gradient.addColorStop(1, endColor);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(p_start1.x, p_start1.y);
                ctx.lineTo(p_start2.x, p_start2.y);
                ctx.lineTo(p_end2.x, p_end2.y);
                ctx.lineTo(p_end1.x, p_end1.y);
                ctx.closePath();
                ctx.fill();
            }
        };

        if (this.glowDirection === 'left' || this.glowDirection === 'both') {
            drawGlow(1);
        }
        if (this.glowDirection === 'right' || this.glowDirection === 'both') {
            drawGlow(-1);
        }

        if (this.isEditingMode) {
            ctx.fillStyle = "purple";
            screenPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    }

    public clone(): MapObject {
        const newLine = new BattleLine(
            this.name,
            this.position.copy(),
            this.scale,
            this.points.map(point => point.copy()),
            this.color.copy().toString()
        );
        newLine.glowDirection = this.glowDirection;
        return newLine;
    }
    
    lerpAnimation(day: number, t: number) {
        if (day === this.dayEnd) {
            if (this.prevStates.length < 3 || !this.prevStates[day - this.dayStart] || !this.prevStates[day - this.dayStart + 1]) return null;
            // Плавное исчезновение
            const lerpLine = new BattleLine(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                this.points,
                "white"
            );
            lerpLine.glowDirection = this.prevStates[day - this.dayStart]!.glowDirection;
            const fadedColor = this.color.copy();
            fadedColor.a = 0;
            lerpLine.color = this.color.lerp(fadedColor, t);
            lerpLine.t = (day - this.dayStart) + t;
            return lerpLine;
        }
        else if (day === this.dayStart) {
            if (!this.prevStates[1]) return null;
            // Плавное появление
            const lerpLine = new BattleLine(
                this.name,
                this.prevStates[1]!.position,
                this.prevStates[1]!.scale,
                this.prevStates[1]!.points.map(point => point.copy()),
                "white"
            );
            lerpLine.glowDirection = this.prevStates[1]!.glowDirection;
            const fadedColor = this.prevStates[1]!.color.copy();
            fadedColor.a = 0;
            lerpLine.color = fadedColor.lerp(this.prevStates[1]!.color, t);
            lerpLine.t = (day - this.dayStart) + t;
            return lerpLine;
        }
        else if (day > this.dayStart && day < this.dayEnd) {
            if (!this.prevStates[day - this.dayStart] || !this.prevStates[day - this.dayStart + 1]) return null;
            // Плавная трансформация
            const lerpLine = new BattleLine(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                [
                    this.prevStates[day - this.dayStart]!.points[0].lerp(this.prevStates[day - this.dayStart + 1]!.points[0], t),
                    this.prevStates[day - this.dayStart]!.points[1].lerp(this.prevStates[day - this.dayStart + 1]!.points[1], t),
                    this.prevStates[day - this.dayStart]!.points[2].lerp(this.prevStates[day - this.dayStart + 1]!.points[2], t),
                    this.prevStates[day - this.dayStart]!.points[3].lerp(this.prevStates[day - this.dayStart + 1]!.points[3], t)
                ],
                "white"
            );
            lerpLine.glowDirection = this.prevStates[day - this.dayStart + 1]!.glowDirection;
            lerpLine.color = this.prevStates[day - this.dayStart]!.color.lerp(this.prevStates[day - this.dayStart + 1]!.color, t);
            lerpLine.t = (day - this.dayStart) + t;
            return lerpLine;
        }
        else {
            return null;
        }
    }
}
