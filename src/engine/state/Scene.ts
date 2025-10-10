import Point from "../math/Point";
import Size from "../math/Size";
import type MapObject from "../objects/MapObject";

export default class Scene {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    public backgroundImage: HTMLImageElement | null = null;

    public objects: MapObject[];
    public offsetX: number;
    public offsetY: number;
    public scale: number;
    isMouseDown: boolean = false;

    public lastMousePos: Point;
    
    public moveCallback : Function | null;
    public isPanning : boolean = false;

    constructor(canvas: HTMLCanvasElement) {

        // Canvas init
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Canvas background image
        const backgroundImage = new Image();
        backgroundImage.src = '/maps/Kirov-west.png';
        backgroundImage.onload = () => {
            this.backgroundImage = backgroundImage;
            this.render();
        };

        // Projection variables
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 50;

        this.objects = [];

        this.lastMousePos = new Point(0, 0);

        this.moveCallback = null;

        this.canvas.addEventListener("mousedown", (event) => this.onMouseDown(event));
        this.canvas.addEventListener("mouseup", (event) => this.onMouseUp(event));
        this.canvas.addEventListener("mousemove", (event) => this.onMouseMove(event));

        this.canvas.addEventListener("wheel", (event) => this.onMouseWheel(event));
    }

    public setObjects(objects: MapObject[]) {
        this.objects = objects;
    }

    public getMousePos(evt: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;    // отношение CSS к реальному размеру
        const scaleY = this.canvas.height / rect.height;

        return new Point(
            (evt.clientX - rect.left) * scaleX,
            (evt.clientY - rect.top) * scaleY
        );
    }

    public worldToScreen(point: Point): Point {
        return new Point(
            (point.x - this.offsetX) * this.scale,
            (point.y - this.offsetY) * this.scale
        );
    }

    public screenToWorld(point: Point): Point {
        return new Point(
            point.x / this.scale + this.offsetX,
            point.y / this.scale + this.offsetY
        );
    }

    public worldSizeToScreen(size: Size): Size {
        return new Size(
            size.width * this.scale,
            size.height * this.scale
        );
    }

    
    private onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
        this.lastMousePos = this.getMousePos(event);
    }
    private onMouseUp(event: MouseEvent) {
        this.isMouseDown = false;
        this.moveCallback = null;
        this.isPanning = false;

        console.log(event);
    }
    private onMouseMove(event: MouseEvent) {
        const mousePos = this.getMousePos(event);
        const worldMousePos = this.screenToWorld(mousePos);
        
        if (this.isMouseDown) {
            // Objects move
            if (this.moveCallback) {
                this.moveCallback(worldMousePos);
                this.render();
                return;
            }
            else if (!this.isPanning) {
                this.objects.forEach((object) => {
                    const callback = object.getMouseMoveCallback(this, mousePos);
                    if (callback) {
                        this.moveCallback = callback;
                        return;
                    }
                });
            }

            this.isPanning = true;

            // Pan the view
            const dx = (mousePos.x - this.lastMousePos.x) / this.scale;
            const dy = (mousePos.y - this.lastMousePos.y) / this.scale;
            this.offsetX -= dx;
            this.offsetY -= dy;

            this.lastMousePos = mousePos;

            this.render();
        }
    }
    private onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        // Передаём координаты курсора относительно canvas
        const {x, y} = this.getMousePos(event);
        this.zoom(event.deltaY, x, y);
    }
    
    private zoomTarget: number | null = null;
    private zoomAnimationFrame: number | null = null;
    private zoomCursorWorld: Point | null = null;
    private zoomCursorScreen: { x: number; y: number } | null = null;

    private zoom(wheelDelta: number, cursorX?: number, cursorY?: number) {
        const zoomFactor = 0.01;
        const minScale = 10;
        const maxScale = 100;
        // Если переданы координаты курсора, сохраняем их
        if (typeof cursorX === "number" && typeof cursorY === "number") {
            this.zoomCursorScreen = { x: cursorX, y: cursorY };
            this.zoomCursorWorld = this.screenToWorld(new Point(cursorX, cursorY));
        } else {
            this.zoomCursorScreen = null;
            this.zoomCursorWorld = null;
        }
        // Задаём целевой масштаб
        const target = Math.min(Math.max(this.scale + (-wheelDelta) * zoomFactor, minScale), maxScale);
        this.startSmoothZoom(target);
    }

    private startSmoothZoom(target: number) {
        if (this.zoomAnimationFrame !== null) {
            cancelAnimationFrame(this.zoomAnimationFrame);
        }
        this.zoomTarget = target;
        this.animateZoom();
    }

    private animateZoom() {
        if (this.zoomTarget === null) return;
        const speed = 0.15; // Чем меньше, тем плавнее
        const diff = this.zoomTarget - this.scale;
        if (Math.abs(diff) < 0.001) {
            // Финальный шаг: скорректировать offsetX/offsetY для зума к курсору
            if (this.zoomCursorWorld && this.zoomCursorScreen) {
                const newWorld = this.screenToWorld(new Point(this.zoomCursorScreen.x, this.zoomCursorScreen.y));
                this.offsetX += this.zoomCursorWorld.x - newWorld.x;
                this.offsetY += this.zoomCursorWorld.y - newWorld.y;
            }
            this.scale = this.zoomTarget;
            this.zoomTarget = null;
            this.zoomCursorWorld = null;
            this.zoomCursorScreen = null;
            this.render();
            return;
        }
        this.scale += diff * speed;
        // Корректируем offsetX/offsetY на каждом шаге для плавности
        if (this.zoomCursorWorld && this.zoomCursorScreen) {
            const newWorld = this.screenToWorld(new Point(this.zoomCursorScreen.x, this.zoomCursorScreen.y));
            this.offsetX += this.zoomCursorWorld.x - newWorld.x;
            this.offsetY += this.zoomCursorWorld.y - newWorld.y;
        }
        this.render();
        this.zoomAnimationFrame = requestAnimationFrame(() => this.animateZoom());
    }

    public render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.backgroundImage) {
            // Левый верх мира в экранных координатах
            const topLeft = this.worldToScreen(new Point(0, 0));
            const width = this.backgroundImage.width * this.scale / 25;
            const height = this.backgroundImage.height * this.scale / 25;
            this.ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, width, height);
        }

        this.objects.forEach((object) => object.draw(this));
    }
}