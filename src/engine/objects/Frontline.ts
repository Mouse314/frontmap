import Color from "../color/Color";
import type Point from "../math/Point";
import type Scene from "../state/Scene";

export default class Frontline {
    public colorA: Color;
    public colorB: Color;

    public APoints: Point[];
    public BPoints: Point[];
    public commonLine: Point[];

    constructor() {
        this.colorA = new Color('rgba(255, 0, 0, 0.5)');
        this.colorB = new Color('rgba(0, 0, 255, 0.5)');
        this.commonLine = [];
        this.APoints = [];
        this.BPoints = [];
    }

    getMouseNearPoint(scene: Scene, mouse: Point): Point | null {
        const allPoints = [...this.APoints, ...this.BPoints, ...this.commonLine];
        const allScreenPoints = allPoints.map(point => scene.lngLatToScreen(point.x, point.y));
        const threshold = 5; // pixels

        for (const point of allScreenPoints) {
            const dx = point.x - mouse.x;
            const dy = point.y - mouse.y;
            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
                return point;
            }
        }
        return null;
    }

    getMouseClickAction(scene: Scene, mouse: Point) {
        const nearPoint = this.getMouseNearPoint(scene, mouse);
        if (!nearPoint) {
            // Добавим новую точку в подходящее место
            return;
        }

        if (this.APoints.includes(nearPoint)) {
            // Удаляем точку из команды А
            this.APoints = this.APoints.filter(point => point !== nearPoint);
            return 'A';
        } else if (this.BPoints.includes(nearPoint)) {
            // Удаляем точку из команды B
            this.BPoints = this.BPoints.filter(point => point !== nearPoint);
            return 'B';
        } else if (this.commonLine.includes(nearPoint)) {
            // Удаляем точку из общей линии
            this.commonLine = this.commonLine.filter(point => point !== nearPoint);
            return 'C'; 
        }
        return null;
    }

    draw(scene: Scene) {
        const ctx = scene.canvas.getContext('2d');
        if (!ctx) return;

        // Draw A area (APoints + reversed commonLine)
        if (this.APoints.length && this.commonLine.length) {
            ctx.save();
            ctx.beginPath();
            const allA = [...this.APoints, ...this.commonLine.slice().reverse()];
            ctx.moveTo(allA[0].x, allA[0].y);
            for (let i = 1; i < allA.length; i++) {
                ctx.lineTo(allA[i].x, allA[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = this.colorA.toString();
            ctx.fill();
            ctx.restore();
        }

        // Draw B area (BPoints + commonLine)
        if (this.BPoints.length && this.commonLine.length) {
            ctx.save();
            ctx.beginPath();
            const allB = [...this.BPoints, ...this.commonLine];
            ctx.moveTo(allB[0].x, allB[0].y);
            for (let i = 1; i < allB.length; i++) {
                ctx.lineTo(allB[i].x, allB[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = this.colorB.toString();
            ctx.fill();
            ctx.restore();
        }

        // Draw common line
        if (this.commonLine.length > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.commonLine[0].x, this.commonLine[0].y);
            for (let i = 1; i < this.commonLine.length; i++) {
                ctx.lineTo(this.commonLine[i].x, this.commonLine[i].y);
            }
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}