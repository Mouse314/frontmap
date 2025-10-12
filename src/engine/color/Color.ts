export default class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(colorString: string) {
        const [r, g, b, a] = this.parseColor(colorString);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    parseColor(color: string): [number, number, number, number] {
        let r = 0, g = 0, b = 0, a = 1;

        if (color.startsWith('rgba')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
                a = match[4] ? parseFloat(match[4]) : 1;
            }
        } else if (color.startsWith('rgb')) {
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
            }
        }

        return [r, g, b, a];
    }

    toString(): string {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    lerp(target: Color, t: number): Color {
        const r1 = this.r;
        const g1 = this.g;
        const b1 = this.b;
        const a1 = this.a;

        const r2 = target.r;
        const g2 = target.g;
        const b2 = target.b;
        const a2 = target.a;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        const a = a1 + (a2 - a1) * t;

        return new Color(`rgba(${r}, ${g}, ${b}, ${a})`);
    }
}