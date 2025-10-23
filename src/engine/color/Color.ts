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

    copy(): Color {
        return new Color(`rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`);
    }

    // --- Функции для работы с HSL ---
    private toHsl(): { h: number, s: number, l: number } {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s, l };
    }

    private fromHsl(h: number, s: number, l: number): { r: number, g: number, b: number } {
        let r, g, b;
        h /= 360;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    public shiftHue(degrees: number): Color {
        const hsl = this.toHsl();
        hsl.h = (hsl.h + degrees) % 360;
        const { r, g, b } = this.fromHsl(hsl.h, hsl.s, hsl.l);
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }
}