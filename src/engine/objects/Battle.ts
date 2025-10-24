import Color from '../color/Color.ts';
import Point from '../math/Point.ts';
import Size from '../math/Size.ts';
import type Rect from '../math/Rect.ts';
import type Scene from '../state/Scene.ts';
import type MapObject from './MapObject.ts';
import type { MapObjectType } from './Types.ts';

export default class Battle implements MapObject {
	/**
	 * Параметр хаотичности взрыва (0..1), можно менять извне
	 */
	public t: number = 0;

	deleted: boolean = false;

    type?: MapObjectType | undefined = 'Battle';

	name: string;
	position: Point;
	scale: number;
	color: Color;
	isEditingMode: boolean = false;
	gray: number = 0;

	prevStates: (Battle | null)[] = [null, this];
	dayStart: number = 0;
	dayEnd: number = 0;

	constructor(name: string, position: Point, scale: number, color?: string) {
		this.name = name;
		this.position = position;
		this.scale = scale;
		this.color = new Color(color ?? 'orange');
	}

	setPosition(position: Point) {
		this.position = position;
	}

	translate(delta: Point) {
		this.position = this.position.add(delta);
	}

	// --- simple value-noise utilities for organic animation ---
	private hash(n: number): number {
		const s = Math.sin(n) * 43758.5453123;
		return s - Math.floor(s);
	}

	private noise2D(x: number, y: number): number {
		const xi = Math.floor(x);
		const yi = Math.floor(y);
		const xf = x - xi;
		const yf = y - yi;
		const fade = (t: number) => t * t * (3 - 2 * t);
		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
		const n00 = this.hash(xi * 57 + yi * 131);
		const n10 = this.hash((xi + 1) * 57 + yi * 131);
		const n01 = this.hash(xi * 57 + (yi + 1) * 131);
		const n11 = this.hash((xi + 1) * 57 + (yi + 1) * 131);
		const u = fade(xf);
		const v = fade(yf);
		const nx0 = lerp(n00, n10, u);
		const nx1 = lerp(n01, n11, u);
		return lerp(nx0, nx1, v);
	}

	calculateScreenScale(): Size {
		return new Size(Math.max(this.scale, .03) * 30, Math.max(this.scale, .03) * 30);
	}

	isMouseNear(scene: Scene, mousePos: Point): boolean {
		const screenPoint = scene.lngLatToScreen(this.position.x, this.position.y);
		const screenSize = this.calculateScreenScale();
		const r = screenSize.width / 2;
		const dx = mousePos.x - screenPoint.x;
		const dy = mousePos.y - screenPoint.y;
		if (dx * dx + dy * dy <= r * r) {
			this.isEditingMode = true;
			return true;
		} else {
			this.isEditingMode = false;
			return false;
		}
	}

	isInsideRectSelection(scene: Scene, rect: Rect): boolean {
		const screenPos = scene.lngLatToScreen(this.position.x, this.position.y);
		const screenStart = scene.lngLatToScreen(rect.start.x, rect.start.y);
		const screenEnd = scene.lngLatToScreen(rect.end.x, rect.end.y);
		const minX = Math.min(screenStart.x, screenEnd.x);
		const maxX = Math.max(screenStart.x, screenEnd.x);
		const minY = Math.min(screenStart.y, screenEnd.y);
		const maxY = Math.max(screenStart.y, screenEnd.y);
		return (
			screenPos.x >= minX && screenPos.x <= maxX &&
			screenPos.y >= minY && screenPos.y <= maxY
		);
	}

	draw(scene: Scene) {
		const ctx = scene.ctx;
		ctx.save();
		const center = scene.lngLatToScreen(this.position.x, this.position.y);
		const screenSize = this.calculateScreenScale();
		const r = screenSize.width / 2;

		// Parameters for fire shape
		const time = this.t;
		const pulse = 1 + 0.12 * Math.sin(time * 6.0) + 0.05 * (this.noise2D(time * 1.3, 0.0) - 0.5);
		const baseW = r * 1.2 * pulse;
		const baseH = r * 2.2 * pulse;

		// Outer glow
		const glowGrad = ctx.createRadialGradient(center.x, center.y, r * 0.3, center.x, center.y, baseH * 1.2);
		glowGrad.addColorStop(0, 'rgba(255,220,120,0.35)');
		glowGrad.addColorStop(1, 'rgba(255,120,0,0)');
		ctx.fillStyle = glowGrad;
		ctx.beginPath();
		ctx.ellipse(center.x, center.y - baseH * 0.4, baseW * 1.4, baseH * 1.2, 0, 0, Math.PI * 2);
		ctx.fill();

		// Helper to draw a single flame layer as a wavy blob
		const drawFlameLayer = (scale: number, colors: [string, number][], noiseAmp: number, freq: number, blur: number) => {
			const W = baseW * scale;
			const H = baseH * scale;
			const steps = 64;
			const topY = center.y - H;
			const grad = ctx.createLinearGradient(center.x, center.y, center.x, topY);
			for (const [c, stop] of colors) grad.addColorStop(stop, c);
			ctx.fillStyle = grad;
			ctx.shadowColor = 'rgba(255,170,60,0.75)';
			ctx.shadowBlur = blur;
			ctx.beginPath();
			ctx.moveTo(center.x - W, center.y);
			for (let i = 0; i <= steps; i++) {
				const tx = i / steps; // 0..1 across width
				const x = center.x - W + tx * (2 * W);
				const xn = tx * 2 - 1; // -1..1
				// bell-shaped height profile with noisy tips
				const profile = 1 - Math.pow(Math.abs(xn), 1.7);
				const n = this.noise2D(xn * freq + time * 0.6, time * 0.9 + scale * 7.123);
				const wobble = (n - 0.5) * noiseAmp;
				const y = center.y - (profile + wobble) * H;
				ctx.lineTo(x, y);
			}
			// close back along the base
			ctx.lineTo(center.x + W, center.y);
			ctx.closePath();
			ctx.fill();
			// cleanup per layer
			ctx.shadowBlur = 0;
		};

		// Layered flames: inner hot core to outer cooler shell
		drawFlameLayer(0.65, [
			['rgba(255,255,240,0.95)', 0.0],
			['rgba(255,230,120,0.85)', 0.35],
			['rgba(255,170,60,0.6)', 0.7],
			['rgba(255,120,0,0.0)', 1.0],
		], 0.08, 3.5, 12);

		drawFlameLayer(0.9, [
			['rgba(255,240,180,0.8)', 0.0],
			['rgba(255,200,100,0.65)', 0.4],
			['rgba(255,150,40,0.5)', 0.75],
			['rgba(255,110,0,0.0)', 1.0],
		], 0.12, 2.7, 18);

		drawFlameLayer(1.15, [
			['rgba(255,220,120,0.45)', 0.0],
			['rgba(255,170,60,0.35)', 0.5],
			['rgba(255,120,0,0.0)', 1.0],
		], 0.16, 2.2, 22);

		// Base white-hot core glow at the bottom
		const coreGrad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, r * 0.8);
		coreGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
		coreGrad.addColorStop(1, 'rgba(255,200,80,0)');
		ctx.fillStyle = coreGrad;
		ctx.beginPath();
		ctx.ellipse(center.x, center.y, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();

		// Explosion sparks flying in all directions
		ctx.save();
		ctx.shadowColor = 'rgba(255,200,80,0.9)';
		ctx.shadowBlur = 10;
		const sparkCount = 60;
		const maxSparkR = r * 2.2;
		for (let i = 0; i < sparkCount; i++) {
			const seed = i * 17.27;
			const life = (time * 0.9 + seed * 0.013) % 1; // 0..1
			const angBase = (this.hash(seed) * Math.PI * 2);
			const ang = angBase + (this.noise2D(seed * 0.1, time * 1.2) - 0.5) * 0.6; // a bit of jitter
			const dist = (0.2 + 0.9 * life) * maxSparkR;
			const x = center.x + Math.cos(ang) * dist;
			const y = center.y + Math.sin(ang) * dist * 0.75 - life * r * 0.3; // slight upward bias
			const fade = 1 - life;
			const size = 1 + 2.5 * fade * (this.scale * 0.4);
			ctx.globalAlpha = Math.max(0, 0.15 + 0.65 * fade);
			ctx.fillStyle = `rgba(255, ${Math.floor(180 + 60 * fade)}, 80, 1)`;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();

		// Embers (sparks) rising up
		ctx.save();
		ctx.fillStyle = 'rgba(255,220,140,0.85)';
		ctx.shadowColor = 'rgba(255,180,80,0.9)';
		ctx.shadowBlur = 10;
		const emberCount = 22;
		for (let i = 0; i < emberCount; i++) {
			const seed = i * 13.37;
			const phase = (time * 0.8 + seed * 0.017) % 1;
			const rise = phase * (baseH * 1.6);
			const jitter = (this.hash(seed + Math.floor(time * 10)) - 0.5) * (baseW * 0.3);
			const x = center.x + jitter;
			const y = center.y - rise;
			const life = 1 - phase;
			const size = 1 + 2.2 * life * (this.scale * 0.4);
			ctx.globalAlpha = Math.max(0, 0.2 + 0.6 * life);
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();

		// Smoke wisps drifting upward
		ctx.save();
		const smokeCount = 14;
		for (let i = 0; i < smokeCount; i++) {
			const seed = 100 + i * 7.77;
			const phase = (time * 0.35 + seed * 0.021) % 1; // slower than embers
			const drift = (this.noise2D(seed * 0.31, time * 0.6) - 0.5) * baseW * 0.6;
			const x = center.x + drift;
			const y = center.y - phase * (baseH * 2.0) - r * 0.2;
			const size = r * (0.35 + 0.9 * phase);
			const alpha = Math.max(0, 0.22 * (1 - phase));
			const g = ctx.createRadialGradient(x, y, 0, x, y, size);
			g.addColorStop(0, `rgba(80,80,80,${alpha})`);
			g.addColorStop(1, 'rgba(80,80,80,0)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();

		// restore defaults for subsequent objects
		ctx.restore();
	}

	public clone(): MapObject {
		return new Battle(
			this.name,
			this.position.copy(),
			this.scale,
			this.color.copy().toString()
		);
	}

	lerpAnimation(day: number, t: number) {
		if (day === this.dayEnd) {
			if (this.prevStates.length < 3) return null;
			// Плавное исчезновение
			const lerpBattle = new Battle(
				this.name,
				this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
				this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
				'orange'
			);
			const fadedColor = this.color.copy();
			fadedColor.a = 0;
			lerpBattle.color = fadedColor.lerp(this.color, 1 - t);
			lerpBattle.t = (day - this.dayStart) + t;
			lerpBattle.gray = this.prevStates[this.prevStates.length - 2]!.gray + (this.gray - this.prevStates[this.prevStates.length - 2]!.gray) * t;
			return lerpBattle;
		}
		else if (day === this.dayStart) {
			// Плавное появление
			const lerpBattle = new Battle(
				this.name,
				this.prevStates[1]!.position,
				this.prevStates[1]!.scale,
				'orange'
			);
			const fadedColor = this.prevStates[1]!.color.copy();
			fadedColor.a = 0;
			lerpBattle.color = fadedColor.lerp(this.prevStates[1]!.color, t);
			lerpBattle.t = (day - this.dayStart) + t;
			lerpBattle.gray = this.gray + (this.prevStates[1]!.gray - this.gray) * t;
			return lerpBattle;
		}
		else if (day > this.dayStart && day < this.dayEnd) {
			// Плавная трансформация
			const lerpBattle = new Battle(
				this.name,
				this.prevStates[day - this.dayStart]!.position.lerp(this.prevStates[day - this.dayStart + 1]!.position, t),
				this.prevStates[day - this.dayStart]!.scale + (this.prevStates[day - this.dayStart + 1]!.scale - this.prevStates[day - this.dayStart]!.scale) * t,
				'orange'
			);
			lerpBattle.t = (day - this.dayStart) + t;
			lerpBattle.color = this.prevStates[day - this.dayStart]!.color.lerp(this.prevStates[day - this.dayStart + 1]!.color, t);
			lerpBattle.gray = this.prevStates[day - this.dayStart]!.gray + (this.prevStates[day - this.dayStart + 1]!.gray - this.prevStates[day - this.dayStart]!.gray) * t;
			return lerpBattle;
		}
		else {
			return null;
		}
	}
}