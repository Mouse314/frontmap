
import Point from "../math/Point";
import type Scene from "../state/Scene";

const TILE_SIZE = 256;
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
// const TILE_URL = "https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";

export default class MapController {
    public scene: Scene;
    public zoom: number = 4; // OSM/Leaflet zoom
    public mapTiles: Map<string, HTMLImageElement> = new Map(); // key: "z/x/y"

    constructor(scene: Scene) {
        this.scene = scene;
        this.updateMap();
    }

    public getTileUrl(z: number, x: number, y: number): string {
        return TILE_URL.replace("{z}", z.toString()).replace("{x}", x.toString()).replace("{y}", y.toString());
    }

    // Convert world coordinates to lat/lng (Web Mercator)
    public screenToLatLng(screen: Point): { lat: number, lng: number } {
        // Assume world (0,0) is lat=0, lng=0, scale/offset handled by scene
        // For correct OSM alignment, you may want to store map center as lat/lng
        // Here, we use the current scene offset/scale to estimate
        const world = this.scene.screenToWorld(screen);
        // Let's assume world.x = longitude, world.y = latitude for now
        return { lat: world.y, lng: world.x };
    }

    // Convert lat/lng to OSM tile x/y at given zoom
    public latLngToTileXY(lat: number, lng: number, zoom: number): { x: number, y: number } {
        const scale = Math.pow(2, zoom);
        const x = Math.floor((lng + 180) / 360 * scale);
        const latRad = lat * Math.PI / 180;
        const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale);
        return { x, y };
    }

    // Get visible tile range for current scene
    public getVisibleTiles(): { z: number, xStart: number, xEnd: number, yStart: number, yEnd: number } {
        const z = this.zoom;
        const scale = Math.pow(2, z);
        const width = this.scene.canvas.width;
        const height = this.scene.canvas.height;

        // Center of screen in world coordinates
        const centerScreen = new Point(width / 2, height / 2);
        const centerWorld = this.scene.screenToWorld(centerScreen);
        // For correct OSM alignment, treat world.x as longitude, world.y as latitude
        const centerLat = centerWorld.y;
        const centerLng = centerWorld.x;
        const centerTile = this.latLngToTileXY(centerLat, centerLng, z);

        // Always use 256px per tile
        const pxPerTile = TILE_SIZE;
        const tilesHoriz = Math.ceil(width / pxPerTile) + 2;
        const tilesVert = Math.ceil(height / pxPerTile) + 2;

        const xStart = Math.max(0, centerTile.x - Math.floor(tilesHoriz / 2));
        const xEnd = Math.min(scale - 1, centerTile.x + Math.floor(tilesHoriz / 2));
        const yStart = Math.max(0, centerTile.y - Math.floor(tilesVert / 2));
        const yEnd = Math.min(scale - 1, centerTile.y + Math.floor(tilesVert / 2));

        return { z, xStart, xEnd, yStart, yEnd };
    }

    public updateMap() {
        // Load all visible tiles
        const { z, xStart, xEnd, yStart, yEnd } = this.getVisibleTiles();
        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const key = `${z}/${x}/${y}`;
                if (!this.mapTiles.has(key)) {
                    const url = this.getTileUrl(z, x, y);
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        this.mapTiles.set(key, img);
                        this.scene.render();
                    };
                    img.onerror = () => {
                        // Optionally: set a placeholder or retry
                    };
                    img.src = url;
                    // Set a placeholder to avoid duplicate loads
                    this.mapTiles.set(key, img);
                }
            }
        }
    }

    // Draw all loaded tiles at correct pixel positions
    public drawTiles(ctx: CanvasRenderingContext2D) {
        const { z, xStart, xEnd, yStart, yEnd } = this.getVisibleTiles();
        const width = this.scene.canvas.width;
        const height = this.scene.canvas.height;
        // Center of screen in world coordinates
        const centerScreen = new Point(width / 2, height / 2);
        const centerWorld = this.scene.screenToWorld(centerScreen);
        // Convert center lat/lng to tile fractional coordinates
        // const scale = Math.pow(2, z);
        const latRad = centerWorld.y * Math.PI / 180;
        const n = Math.pow(2, z);
        const centerTileX = (centerWorld.x + 180) / 360 * n;
        const centerTileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
        // Where is the center of the screen in pixel space?
        const screenCenterPxX = width / 2;
        const screenCenterPxY = height / 2;
        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const key = `${z}/${x}/${y}`;
                const img = this.mapTiles.get(key);
                if (!img || !img.complete) continue;
                // Calculate pixel position for this tile
                const dx = (x - centerTileX) * TILE_SIZE;
                const dy = (y - centerTileY) * TILE_SIZE;
                const drawX = screenCenterPxX + dx;
                const drawY = screenCenterPxY + dy;
                ctx.drawImage(img, Math.round(drawX), Math.round(drawY), TILE_SIZE, TILE_SIZE);
            }
        }
    }
}