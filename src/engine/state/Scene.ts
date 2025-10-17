import Animation from "../animation/Animation.ts";
import TimeManager from "../animation/TimeManager.ts";
import MapController from "../GIS/MapController.ts";
import Point from "../math/Point.ts";
import Rect from "../math/Rect.ts";
import Size from "../math/Size.ts";
import type MapObject from "../objects/MapObject.ts";

export default class Scene {
    /**
     * Преобразует мировые координаты (x, y в проекции Меркатора) в географические (lng, lat)
     * @param world Point (x, y) в проекции Меркатора
     * @returns Point (lng, lat) в градусах
     */
    public worldToLngLat(world: Point): Point {
        // OSM/Leaflet: x = (lng + 180) / 360 * worldSize
        //              y = (1 - ln(tan(latRad) + sec(latRad)) / π) / 2 * worldSize
        // Обратные формулы:
        const worldSize = 256 * Math.pow(2, this.mapController.zoom);
        const lng = (world.x / worldSize) * 360 - 180;
        const n = Math.PI - 2 * Math.PI * world.y / worldSize;
        const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return new Point(lng, lat);
    }
    /**
     * Преобразует экранные координаты (x, y) в географические (lng, lat)
     * @param point Point (x, y) в пикселях
     * @returns Point (lng, lat) в градусах
     */
    public screenToLngLat(point: Point): Point {
        // Прямое преобразование экранных координат (x, y) в lng/lat через Web Mercator
        // 1. Получаем смещение в пикселях от центра canvas
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const dx = point.x - cx;
        const dy = point.y - cy;

        // 2. Переводим смещение в тайлы
        const zoom = this.mapController.zoom;
        const tileSize = 256;
        const n = Math.pow(2, zoom);
        // center lng/lat -> center tileX/tileY
        const centerTileX = (this.offsetX + 180) / 360 * n;
        const centerLatRad = this.offsetY * Math.PI / 180;
        const centerTileY = (1 - Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2)) / Math.PI) / 2 * n;

        // 3. Смещение в тайлах
        const deltaTileX = dx / tileSize;
        const deltaTileY = dy / tileSize;

        // 4. Итоговые tileX/tileY
        const tileX = centerTileX + deltaTileX;
        const tileY = centerTileY + deltaTileY;

        // 5. tileX/tileY -> lng/lat
        const lng = tileX / n * 360 - 180;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)));
        const lat = latRad * 180 / Math.PI;
        return new Point(lng, lat);
    }
    /**
     * Преобразует координаты lng/lat (WGS84) в экранные координаты относительно карты (Web Mercator)
     * @param lng долгота
     * @param lat широта
     * @returns Point (x, y) на canvas
     */
    public lngLatToScreen(lng: number, lat: number): Point {
        // OSM/Leaflet tile math
        const zoom = this.mapController.zoom;
        const tileSize = 256;
        const n = Math.pow(2, zoom);
        // 1. lng/lat -> tileX/tileY (float)
        const tileX = (lng + 180) / 360 * n;
        const latRad = lat * Math.PI / 180;
        const tileY = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2 * n;
        // 2. center lng/lat -> center tileX/tileY
        const centerTileX = (this.offsetX + 180) / 360 * n;
        const centerLatRad = this.offsetY * Math.PI / 180;
        const centerTileY = (1 - Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2)) / Math.PI) / 2 * n;
        // 3. Смещение в пикселях от центра карты
        const dx = (tileX - centerTileX) * tileSize;
        const dy = (tileY - centerTileY) * tileSize;
        // 4. Центр canvas
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        return new Point(cx + dx, cy + dy);
    }
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

    // GIS
    public mapController: MapController;

    constructor(canvas: HTMLCanvasElement) {

        // Canvas init
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.imageSmoothingEnabled = false;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;


        // Projection variables
        // offsetX/offsetY: центр карты в градусах (долгота/широта)
        this.offsetX = 37.618423; // Москва по умолчанию
        this.offsetY = 55.751244;
        this.mapController = new MapController(this);
        this.scale = this.calcScale(this.mapController.zoom); // px per degree

        // Canvas background image
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

    // Пересчитываем масштаб (px per degree) для текущего zoom
    public calcScale(zoom: number): number {
        // TILE_SIZE * 2^zoom / 360 (градусов на весь мир)
        return 256 * Math.pow(2, zoom) / 360;
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
        // point.x = lng, point.y = lat
        // X: линейно, Y: инверсия (север вверх)
        const width = this.canvas.width;
        const height = this.canvas.height;
        return new Point(
            (point.x - this.offsetX) * this.scale + width / 2,
            (this.offsetY - point.y) * this.scale + height / 2
        );
    }

    public screenToWorld(point: Point): Point {
        const width = this.canvas.width;
        const height = this.canvas.height;
        return new Point(
            (point.x - width / 2) / this.scale + this.offsetX,
            this.offsetY - (point.y - height / 2) / this.scale
        );
    }

    public worldSizeToScreen(size: Size): Size {
        return new Size(
            size.width * this.scale,
            size.height * this.scale
        );
    }

    public screenDeltaToWorld(delta: Point): Point {
        return new Point(delta.x / this.scale, -delta.y / this.scale);
    }

    public isMouseAnyNear = false;
    public defenceLineNearestPoint: Point | null = null;
    public onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
        this.lastMousePos = this.getMousePos(event);
        this.prevMousePos = this.lastMousePos;
        this.mouseDownPos = this.lastMousePos;
        const worldMouseDownPos = this.screenToLngLat(this.mouseDownPos);

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

        this.selectedObjects = [];
    }
    public onMouseUp(event: MouseEvent) {
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
    public onMouseMove(event: MouseEvent) {
        const mousePos = this.getMousePos(event);
        const geoPos = this.screenToLngLat(mousePos);
        const prevGeoPos = this.screenToLngLat(this.prevMousePos);
        const geoMouseDelta = geoPos.subtract(prevGeoPos);

        if (this.isMouseDown) {
            if (this.selectionRect) {
                this.selectionRect.end = geoPos;

                // Rect Selection
                for (const object of this.objects) {
                    if (object.isInsideRectSelection(this, this.selectionRect)) {
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
                        if (object.type === 'DefenceLine') {
                            if (this.selectedObjects.length > 1 || this.isShifting) {
                                object.translate(geoMouseDelta);
                            }
                            else {
                                if (this.defenceLineNearestPoint) {
                                    object.translate(geoMouseDelta, this.defenceLineNearestPoint);
                                }
                            }
                        }
                        else {
                            object.translate(geoMouseDelta);
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

            // Pan the view (Web Mercator correct vertical)
            // Горизонталь: lng — линейно, вертикаль: lat — через обратную Web Mercator
            const dx = mousePos.x - this.lastMousePos.x;
            const dy = -(mousePos.y - this.lastMousePos.y); // инверсия для экранных координат
            const zoom = this.mapController.zoom;
            const lngPerPx = 360 / (256 * Math.pow(2, zoom));
            const deltaLng = -dx * lngPerPx;
            // Y через меркатор
            const centerLatBefore = this.offsetY;
            const n = Math.pow(2, zoom);
            const latRadBefore = centerLatBefore * Math.PI / 180;
            const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRadBefore / 2));
            const centerTileY = (1 - mercatorY / Math.PI) / 2 * n;
            const pxPerTile = 256;
            const centerTileYPx = centerTileY * pxPerTile;
            const newTileYPx = centerTileYPx + dy;
            const newTileY = newTileYPx / pxPerTile;
            const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * newTileY / n)));
            const deltaLat = latRad * 180 / Math.PI - centerLatBefore;
            this.offsetX += deltaLng;
            this.offsetY += deltaLat;
            // Перемещаем все выбранные объекты на тот же world-delta
            if (this.selectedObjects.length > 0) {
                const worldDelta = new Point(deltaLng, deltaLat);
                this.selectedObjects.forEach(object => {
                    if (object.type === 'Brigade') {
                        object.translate(worldDelta);
                    } else if (object.type === 'DefenceLine') {
                        if (this.selectedObjects.length > 1 || this.isShifting) {
                            object.translate(worldDelta);
                        } else {
                            if (this.defenceLineNearestPoint) {
                                object.translate(worldDelta, this.defenceLineNearestPoint);
                            }
                        }
                    }
                });
            }
            this.lastMousePos = mousePos;
            this.mapController.updateMap();
            this.render();
            this.prevMousePos = mousePos;
        }
        else {
            if (this.addingObject) {
                this.addingObject.setPosition(geoPos);
                this.addingObject.dayStart = this.day;
                this.addingObject.dayEnd = this.day;
                this.render();
            }
        }

        this.lastMousePos = mousePos;
    }
    public onContextMenu(event: MouseEvent) {
        event.preventDefault();
    }

    public onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        // Передаём координаты курсора относительно canvas
        const { x, y } = this.getMousePos(event);
        this.zoom(event.deltaY, x, y);
    }


    // KEYBOARD EVENTS

    public onKeyDown(event: KeyboardEvent) {
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
    public onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Shift') {
            this.isShifting = false;
        }
    }

    // private zoomTarget: number | null = null;
    // private zoomAnimationFrame: number | null = null;
    // private zoomCursorWorld: Point | null = null;
    // private zoomCursorScreen: { x: number; y: number } | null = null;

    private zoom(wheelDelta: number, cursorX?: number, cursorY?: number) {
        // Зум относительно курсора: world-координаты под курсором должны остаться на месте
        let cursorWorld: Point | null = null;
        if (typeof cursorX === "number" && typeof cursorY === "number") {
            cursorWorld = this.screenToLngLat(new Point(cursorX, cursorY));
        }
        // wheelDelta < 0 — увеличиваем зум, > 0 — уменьшаем
        let newZoom = this.mapController.zoom + (wheelDelta < 0 ? 1 : -1);
        newZoom = Math.max(1, Math.min(19, newZoom));
        if (newZoom === this.mapController.zoom) return;
        // Пересчитать масштаб
        this.mapController.zoom = newZoom;
        this.scale = this.calcScale(newZoom);
        // Корректируем offsetX/offsetY так, чтобы world под курсором не сдвинулся
        if (cursorWorld && typeof cursorX === "number" && typeof cursorY === "number") {
            // Новые world-координаты под курсором после смены масштаба
            const newWorld = this.screenToLngLat(new Point(cursorX, cursorY));
            this.offsetX += cursorWorld.x - newWorld.x;
            this.offsetY += cursorWorld.y - newWorld.y;
        }
        this.mapController.updateMap();
        this.render();
    }

    // private startSmoothZoom(target: number) {
    //     if (this.zoomAnimationFrame !== null) {
    //         cancelAnimationFrame(this.zoomAnimationFrame);
    //     }
    //     this.zoomTarget = target;
    //     this.animateZoom();
    // }

    // private animateZoom() {
    //     if (this.zoomTarget === null) return;
    //     const speed = 0.15; // Чем меньше, тем плавнее
    //     const diff = this.zoomTarget - this.scale;
    //     if (Math.abs(diff) < 0.001) {
    //         // Финальный шаг: скорректировать offsetX/offsetY для зума к курсору
    //         if (this.zoomCursorWorld && this.zoomCursorScreen) {
    //             const newWorld = this.screenToWorld(new Point(this.zoomCursorScreen.x, this.zoomCursorScreen.y));
    //             this.offsetX += this.zoomCursorWorld.x - newWorld.x;
    //             this.offsetY += this.zoomCursorWorld.y - newWorld.y;
    //         }
    //         this.scale = this.zoomTarget;
    //         this.zoomTarget = null;
    //         this.zoomCursorWorld = null;
    //         this.zoomCursorScreen = null;
    //         this.render();
    //         return;
    //     }
    //     this.scale += diff * speed;
    //     // Корректируем offsetX/offsetY на каждом шаге для плавности
    //     if (this.zoomCursorWorld && this.zoomCursorScreen) {
    //         const newWorld = this.screenToWorld(new Point(this.zoomCursorScreen.x, this.zoomCursorScreen.y));
    //         this.offsetX += this.zoomCursorWorld.x - newWorld.x;
    //         this.offsetY += this.zoomCursorWorld.y - newWorld.y;
    //     }
    //     this.render();
    //     // this.zoomAnimationFrame = requestAnimationFrame(() => this.animateZoom());
    // }

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
            const width = this.backgroundImage.width * this.scale / 50;
            const height = this.backgroundImage.height * this.scale / 50;
            this.ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, width, height);
        }
        // Отрисовка карты (тайлов OSM)
        this.mapController.drawTiles(this.ctx);

        // Отрисовка объектов
        for (const object of this.objects) {
            if (object.deleted) continue;
            if (this.day >= object.dayStart && this.day <= object.dayEnd) {
                object.prevStates[this.day - object.dayStart + 1]?.draw(this);
            }
        }

        // Отрисовка добавляемого объекта
        if (this.addingObject) {
            // const screenPos = this.lngLatToScreen(this.addingObject.position.x, this.addingObject.position.y);
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