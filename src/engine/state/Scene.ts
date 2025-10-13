import Animation from "../animation/Animation.ts";
import TimeManager from "../animation/TimeManager.ts";
import Point from "../math/Point.ts";
import Rect from "../math/Rect.ts";
import Size from "../math/Size.ts";
import type MapObject from "../objects/MapObject.ts";

export default class Scene {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    public backgroundImage: HTMLImageElement | null = null;

    public objects: MapObject[] = [];
    public selectedObjects: MapObject[] = [];

    public offsetX: number;
    public offsetY: number;
    public scale: number;
    isMouseDown: boolean = false;

    public lastMousePos: Point;

    public isPanning: boolean = false;
    mouseDownPos: Point = new Point(0, 0);

    public selectionRect: Rect | null = null;
    prevMousePos: Point = new Point(0, 0);
    isShifting: boolean = false;

    // React events
    public setSelectedObjects: ((objects: MapObject[]) => void) | null = null;
    public addingObject: MapObject | null = null;

    // Animation controller
    public animationController: Animation;
    public timeManager: TimeManager;
    public day: number = 0;

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

        this.lastMousePos = new Point(0, 0);

        this.timeManager = new TimeManager('days');
        this.animationController = new Animation(this.timeManager);

        this.canvas.addEventListener("mousedown", (event) => this.onMouseDown(event));
        this.canvas.addEventListener("mouseup", (event) => this.onMouseUp(event));
        this.canvas.addEventListener("mousemove", (event) => this.onMouseMove(event));
        this.canvas.addEventListener("contextmenu", (event) => this.onContextMenu(event));
        this.canvas.addEventListener("wheel", (event) => this.onMouseWheel(event));

        window.addEventListener("keydown", (event) => this.onKeyDown(event));
        window.addEventListener("keyup", (event) => this.onKeyUp(event));
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

    public screenDeltaToWorld(delta: Point): Point {
        return new Point(delta.x / this.scale, delta.y / this.scale);
    }

    public isMouseAnyNear = false;
    public defenceLineNearestPoint: Point | null = null;
    private onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
        this.lastMousePos = this.getMousePos(event);
        this.prevMousePos = this.lastMousePos;
        this.mouseDownPos = this.lastMousePos;
        const worldMouseDownPos = this.screenToWorld(this.mouseDownPos);

        if (event.button === 2) {
            this.selectedObjects = [];
            this.selectionRect = new Rect(worldMouseDownPos, worldMouseDownPos);
            return;
        }

        for (const object of this.selectedObjects) {
            if (object.isMouseNear(this, this.lastMousePos)) {
                this.isMouseAnyNear = true;
                if (object.getNearestPoint) this.defenceLineNearestPoint = object.getNearestPoint(this, this.lastMousePos);
                return;
            }
        }
    }
    private onMouseUp(event: MouseEvent) {
        this.isMouseDown = false;
        this.isPanning = false;
        this.isMouseAnyNear = false;

        if (event.button === 2) {
            this.selectionRect = null;
            this.render();
            return;
        }

        const mousePos = this.getMousePos(event);

        if (Math.abs(mousePos.x - this.mouseDownPos.x) < 3 && Math.abs(mousePos.y - this.mouseDownPos.y) < 3) {
            // Mouse click detected

            if (this.addingObject) {
                this.objects.push(this.addingObject);

                this.addingObject = null;
            }
            else {
                let foundSelected = false;

                for (const object of this.objects) {
                    if (object.isMouseNear(this, mousePos) && !foundSelected) {

                        object.isEditingMode = true;
                        this.selectedObjects = [object];


                        if (this.setSelectedObjects) this.setSelectedObjects([...this.selectedObjects]);
                        foundSelected = true;
                        this.render();
                        return;
                    }
                    else {
                        object.isEditingMode = false;
                    }
                }

                if (!foundSelected) {
                    this.selectedObjects = [];
                    if (this.setSelectedObjects) this.setSelectedObjects([...this.selectedObjects]);
                }
            }

        }

        this.render();
    }
    private onMouseMove(event: MouseEvent) {
        const mousePos = this.getMousePos(event);
        const worldMousePos = this.screenToWorld(mousePos);
        const mouseDelta = mousePos.subtract(this.prevMousePos);
        const worldMouseDelta = this.screenDeltaToWorld(mouseDelta);

        if (this.isMouseDown) {
            if (this.selectionRect) {
                this.selectionRect.end = worldMousePos;

                // Rect Selection
                for (const object of this.objects) {
                    if (object.isInsideRectSelection(this.selectionRect)) {
                        object.isEditingMode = true;
                    }
                    else {
                        object.isEditingMode = false;
                    }
                }

                this.selectedObjects = this.objects.filter(object => object.isEditingMode);
                if (this.setSelectedObjects) this.setSelectedObjects([...this.selectedObjects]);

                this.render();
                this.prevMousePos = mousePos;
                return;
            }

            // Objects move
            if (this.selectedObjects.length > 0) {
                if (this.isMouseAnyNear) {
                    this.selectedObjects.forEach(object => {
                        if (object.type === 'Brigade') {
                            object.translate(worldMouseDelta);
                        }
                        else if (object.type === 'DefenceLine') {
                            if (this.selectedObjects.length > 1 || this.isShifting) {
                                object.translate(worldMouseDelta);
                            }
                            else {
                                if (this.defenceLineNearestPoint) {
                                    object.translate(worldMouseDelta, this.defenceLineNearestPoint);
                                }
                            }
                        }
                    });
                    this.render();
                    this.prevMousePos = mousePos;
                    return;
                }
                else {

                }
            }
            if (!this.isPanning) {
                for (const object of this.objects) {
                    if (object.isMouseNear(this, mousePos)) {
                        this.isMouseAnyNear = true;
                        this.selectedObjects = [object];
                        object.isEditingMode = true;
                        this.render();
                        this.prevMousePos = mousePos;
                        return;
                    }
                }
            }

            this.isPanning = true;

            // Pan the view
            const dx = (mousePos.x - this.lastMousePos.x) / this.scale;
            const dy = (mousePos.y - this.lastMousePos.y) / this.scale;
            this.offsetX -= dx;
            this.offsetY -= dy;

            this.lastMousePos = mousePos;

            this.render();
            this.prevMousePos = mousePos;
        }
        else {
            if (this.addingObject) {
                this.addingObject.setPosition(worldMousePos);
                this.addingObject.dayStart = this.day;
                this.addingObject.dayEnd = this.day;
                this.render();
            }
        }

        this.lastMousePos = mousePos;
    }
    private onContextMenu(event: MouseEvent) {
        event.preventDefault();
    }

    private onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        // Передаём координаты курсора относительно canvas
        const { x, y } = this.getMousePos(event);
        this.zoom(event.deltaY, x, y);
    }


    // KEYBOARD EVENTS

    private onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Shift') {
            this.isShifting = true;
        }
        else if (event.key === 'Delete') {
            this.selectedObjects.forEach(object => {
                object.deleted = true;
            });
            this.selectedObjects = [];
            this.render();
        }
    }
    private onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Shift') {
            this.isShifting = false;
        }
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

    public addNewDay() {
        this.timeManager.rangeLen++;
        this.day++;

        for (const object of this.objects) {
            if (object.deleted) continue;
            object.prevStates[object.prevStates.length - 1] = object.clone();
            object.prevStates.push(object);
            object.dayEnd = this.day;
        }

        console.log(this.objects);

        this.render();
    }

    public render() {
        // Отрисовка сцены
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.backgroundImage) {
            // Левый верх мира в экранных координатах
            const topLeft = this.worldToScreen(new Point(0, 0));
            const width = this.backgroundImage.width * this.scale / 25;
            const height = this.backgroundImage.height * this.scale / 25;
            this.ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, width, height);
        }

        // Отрисовка объектов
        for (const object of this.objects) {
            if (object.deleted) continue;
            if (this.day >= object.dayStart && this.day <= object.dayEnd) {
                object.prevStates[this.day - object.dayStart + 1]?.draw(this);
            }
        }

        // Отрисовка добавляемого объекта
        if (this.addingObject) {
            this.addingObject.draw(this);
        }

        // Отрисовка рамки выделения
        if (this.selectionRect) {
            this.selectionRect.draw(this);
        }

        // Обновление Реакт окружения
        for (const object of this.objects) {
            object.isEditingMode = false;
        }
        for (const object of this.selectedObjects) {
            object.isEditingMode = true;
        }

        this.setSelectedObjects?.([...this.selectedObjects]);
    }
}