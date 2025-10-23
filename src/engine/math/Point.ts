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

    public subtract(other: Point): Point {
        return new Point(this.x - other.x, this.y - other.y);
    }

    public multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar);
    }

    public getPerpendicular(): Point {
        return new Point(-this.y, this.x);
    }

    public distanceTo(other: Point): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public normalize(): Point {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length === 0) return new Point(0, 0);
        return new Point(this.x / length, this.y / length);
    }

    public translate(delta: Point): void {
        this.x += delta.x;
        this.y += delta.y;
    }

    public lerp(target: Point, t: number): Point {
        const x = this.x + (target.x - this.x) * t;
        const y = this.y + (target.y - this.y) * t;
        return new Point(x, y);
    }


    public setPosition(x: number, y: number) {
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