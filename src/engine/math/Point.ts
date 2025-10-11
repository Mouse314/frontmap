export default class Point {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y);
    }

    public translate(delta: Point): void {
        this.x += delta.x;
        this.y += delta.y;
    }

    public subtract(other: Point): Point {
        return new Point(this.x - other.x, this.y - other.y);
    }

    public setPos(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public toString(): string {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    public copy(): Point {
        return new Point(this.x, this.y);
    }
}