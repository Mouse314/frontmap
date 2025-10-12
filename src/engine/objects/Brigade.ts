import Color from '../color/Color';
import { COLOR_GREY, COLOR_GREY_SOFT, COLOR_ORANGE } from '../color/ColorConstants';
import Point from '../math/Point';
import type Rect from '../math/Rect';
import Size from '../math/Size';
import type Scene from '../state/Scene';
import type MapObject from './MapObject';
import type { MapObjectType } from './Types';

export default class Brigade implements MapObject {
    name: string;
    position: Point;
    scale: number;
    color: Color;
    isEditingMode: boolean = false;

    gray: number = 0;

    type: MapObjectType = 'Brigade';

    constructor(name: string, position: Point, scale: number, color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.color = new Color(color);
    }

    setPosition(position: Point) {
        this.position = position;
    }

    translate(delta: Point) {
        this.position = this.position.add(delta);
    }

    calculateScreenScale(scene: Scene): Size {
        return new Size(Math.max(this.scale / scene.scale, .03) * 20, Math.max(this.scale / scene.scale, .03) * 10);
    }

    isMouseNear(scene: Scene, mousePos: Point): boolean {
        const screenPoint = scene.worldToScreen(this.position);
        const screenSize = scene.worldSizeToScreen(this.calculateScreenScale(scene));

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

        const topLeft = new Point(Math.min(rect.start.x, rect.end.x), Math.min(rect.start.y, rect.end.y));
        const bottomRight = new Point(Math.max(rect.start.x, rect.end.x), Math.max(rect.start.y, rect.end.y));

        if (this.position.x >= topLeft.x && this.position.x <= bottomRight.x && this.position.y >= topLeft.y && this.position.y <= bottomRight.y) {
            return true;
        }

        return false;
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        const screenPoint = scene.worldToScreen(this.position);
        const screenSize = scene.worldSizeToScreen(this.calculateScreenScale(scene));

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
}