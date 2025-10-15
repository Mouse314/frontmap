import Color from '../color/Color.ts';
import { COLOR_GREY, COLOR_GREY_SOFT, COLOR_ORANGE } from '../color/ColorConstants.ts';
import Point from '../math/Point.ts';
import type Rect from '../math/Rect.ts';
import Size from '../math/Size.ts';
import type Scene from '../state/Scene.ts';
import type MapObject from './MapObject.ts';
import type { MapObjectType } from './Types.ts';

export default class Brigade implements MapObject {
    deleted: boolean = false;

    name: string;
    position: Point;
    scale: number;
    color: Color;
    isEditingMode: boolean = false;

    gray: number = 0;

    type: MapObjectType = 'Brigade';

    prevStates: (Brigade | null)[] = [null, this];
    dayStart: number = 0;
    dayEnd: number = 0;

    constructor(name: string, position: Point, scale: number, color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.color = new Color(color);
    }


    // position: Point (lng, lat)
    setPosition(position: Point) {
        this.position = position;
    }

    // delta: Point (lng, lat)
    translate(delta: Point) {
        this.position = this.position.add(delta);
    }

    calculateScreenScale(scene: Scene): Size {
        // Optionally: use a fixed pixel size or scale with zoom
        return new Size(Math.max(this.scale, .03) * 20, Math.max(this.scale, .03) * 10);
    }

    isMouseNear(scene: Scene, mousePos: Point): boolean {
        // Используем lngLatToScreen для точного сравнения
        const screenPoint = scene.lngLatToScreen(this.position.x, this.position.y);
        const screenSize = this.calculateScreenScale(scene);
        if (
            mousePos.x >= screenPoint.x - screenSize.width / 2 &&
            mousePos.x <= screenPoint.x + screenSize.width / 2 &&
            mousePos.y >= screenPoint.y - screenSize.height / 2 &&
            mousePos.y <= screenPoint.y + screenSize.height / 2
        ) {
            this.isEditingMode = true;
            return true;
        } else {
            this.isEditingMode = false;
            return false;
        }
    }

    isInsideRectSelection(scene: Scene, rect: Rect): boolean {
        // rect.start/end — world (lng/lat), выделение по экрану
        const screenPos = scene.lngLatToScreen(this.position.x, this.position.y);
        const screenStart = scene.lngLatToScreen(rect.start.x, rect.start.y);
        const screenEnd = scene.lngLatToScreen(rect.end.x, rect.end.y);
        const minX = Math.min(screenStart.x, screenEnd.x);
        const maxX = Math.max(screenStart.x, screenEnd.x);
        const minY = Math.min(screenStart.y, screenEnd.y);
        const maxY = Math.max(screenStart.y, screenEnd.y);
        return (
            screenPos.x >= minX && screenPos.x <= maxX &&
            screenPos.y >= minY && screenPos.y <= maxY
        );
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        // Используем lngLatToScreen для точного позиционирования
        const screenPoint = scene.lngLatToScreen(this.position.x, this.position.y);
        const screenSize = this.calculateScreenScale(scene);

        // Мягкая подложка
        const backColor = this.color.lerp(new Color("rgba(255, 255, 255, 1)"), 0.5).lerp(COLOR_GREY_SOFT, this.gray).toString();

        ctx.fillStyle = this.isEditingMode ? COLOR_ORANGE.toString() : backColor;
        ctx.roundRect(
            screenPoint.x - screenSize.width / 2,
            screenPoint.y - screenSize.height / 2,
            screenSize.width,
            screenSize.height,
            screenSize.width / 10
        );
        ctx.fill();

        const mixedColor = this.color.lerp(COLOR_GREY, this.gray).toString();

        // Прямоугольник
        ctx.strokeStyle = mixedColor;
        ctx.lineWidth = this.scale * 2;
        ctx.beginPath();
        ctx.roundRect(
            screenPoint.x - screenSize.width / 2,
            screenPoint.y - screenSize.height / 2,
            screenSize.width,
            screenSize.height,
            screenSize.width / 10
        );
        ctx.stroke();

        // Перекрёстные линии
        ctx.strokeStyle = mixedColor;
        ctx.lineWidth = this.scale * 2;
        ctx.beginPath();
        ctx.moveTo(
            screenPoint.x - screenSize.width / 2.2,
            screenPoint.y - screenSize.height / 2.2
        );
        ctx.lineTo(
            screenPoint.x + screenSize.width / 2.2,
            screenPoint.y + screenSize.height / 2.2
        );
        ctx.moveTo(
            screenPoint.x - screenSize.width / 2.2,
            screenPoint.y + screenSize.height / 2.2
        );
        ctx.lineTo(
            screenPoint.x + screenSize.width / 2.2,
            screenPoint.y - screenSize.height / 2.2
        );
        ctx.stroke();

        ctx.restore();
    }

    public clone(): MapObject {
        return new Brigade(
            this.name,
            this.position.copy(),
            this.scale,
            this.color.copy().toString()
        );
    }

    lerpAnimation(day: number, t: number) {
        if (day === this.dayEnd) {
            if (this.prevStates.length < 3) return null;
            // Плавное исчезновение в конце жизненного цикла
            const lerpBrigade = new Brigade(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                "red"
            );
            const fadedColor = this.color.copy();
            fadedColor.a = 0;
            lerpBrigade.color = fadedColor.lerp(this.color, 1 - t);
            lerpBrigade.gray = this.prevStates[this.prevStates.length - 2]!.gray + (this.gray - this.prevStates[this.prevStates.length - 2]!.gray) * t;
            return lerpBrigade;
        }
        else if (day === this.dayStart) {
            // Плавное появления в начале жизненного цикла
            const lerpBrigade = new Brigade(
                this.name,
                this.prevStates[1]!.position,
                this.prevStates[1]!.scale,
                "red"
            );
            const fadedColor = this.prevStates[1]!.color.copy();
            fadedColor.a = 0;
            lerpBrigade.color = fadedColor.lerp(this.prevStates[1]!.color, t);
            lerpBrigade.gray = this.gray + (this.prevStates[1]!.gray - this.gray) * t;
            return lerpBrigade;
        }
        else if (day > this.dayStart && day < this.dayEnd) {
            // Плавная трансформация в середине жизненного цикла
            const lerpBrigade = new Brigade(
                this.name,
                this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
                this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
                "red"
            );
            lerpBrigade.color = this.prevStates[day - this.dayStart]!.color.lerp(this.prevStates[day - this.dayStart + 1]!.color, t);
            lerpBrigade.gray = this.prevStates[day - this.dayStart]!.gray + (this.prevStates[day - this.dayStart + 1]!.gray - this.prevStates[day - this.dayStart]!.gray) * t;
            return lerpBrigade;
        }
        else {
            // Это не наш день
            return null;
        }
    }
}