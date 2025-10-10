import Point from '../math/Point';
import Size from '../math/Size';
import type Scene from '../state/Scene';
import type MapObject from './MapObject';

export default class Brigade implements MapObject {
    name: string;
    position: Point;
    scale: number;
    color: string;

    constructor(name: string, position: Point, scale: number, color: string) {
        this.name = name;
        this.position = position;
        this.scale = scale;
        this.color = color;
    }

    calculateScreenScale(scene: Scene): Size {
        return new Size(Math.max(this.scale / scene.scale, .03) * 20, Math.max(this.scale / scene.scale, .03) * 10);
    }

    getMouseMoveCallback(scene: Scene, mousePos: Point) {
        const screenPoint = scene.worldToScreen(this.position);
        const screenSize = scene.worldSizeToScreen(this.calculateScreenScale(scene));

        if (
            mousePos.x >= screenPoint.x - screenSize.width / 2 &&
            mousePos.x <= screenPoint.x + screenSize.width / 2 &&
            mousePos.y >= screenPoint.y - screenSize.height / 2 &&
            mousePos.y <= screenPoint.y + screenSize.height / 2
        ) 
        {
            const worldMousePos = scene.screenToWorld(mousePos);
            const offset = new Point(worldMousePos.x - this.position.x, worldMousePos.y - this.position.y);
            return (mousePosition: { x: number; y: number; }) => {this.position.setPos(mousePosition.x - offset.x / 2, mousePosition.y - offset.y / 2)};
        } 
        else return null;
    }

    draw(scene: Scene) {
        const ctx = scene.ctx;
        ctx.save();
        const screenPoint = scene.worldToScreen(this.position);
        const screenSize = scene.worldSizeToScreen(this.calculateScreenScale(scene));
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.scale * 2;
        ctx.roundRect(screenPoint.x - screenSize.width / 2, screenPoint.y - screenSize.height / 2, screenSize.width, screenSize.height, screenSize.width / 10);
        ctx.stroke();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(screenPoint.x - screenSize.width / 2.2, screenPoint.y - screenSize.height / 2.2);
        ctx.lineTo(screenPoint.x + screenSize.width / 2.2, screenPoint.y + screenSize.height / 2.2);
        ctx.moveTo(screenPoint.x - screenSize.width / 2.2, screenPoint.y + screenSize.height / 2.2);
        ctx.lineTo(screenPoint.x + screenSize.width / 2.2, screenPoint.y - screenSize.height / 2.2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}