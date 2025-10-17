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
		const screenPoint = scene.lngLatToScreen(this.position.x, this.position.y);
		const screenSize = this.calculateScreenScale();
		const r = screenSize.width / 2;

		// Хаотичная звезда-взрыв с шумом
		const rays = 30;
		const points: Array<{x: number, y: number}> = [];
		for (let i = 0; i < rays; i++) {
			// angle: равномерно, длина: анимация только длины (сияние)
			const angle = (Math.PI * 2 * i) / rays;
			const baseLen = r * 1.3;
			const shine = Math.sin(this.t * Math.PI * 5 + i * 10) * 0.2;
			let len = baseLen * (1 + shine);
			if (i % 2 === 1) len *= 0.7;
			points.push({
				x: screenPoint.x + Math.cos(angle) * len,
				y: screenPoint.y + Math.sin(angle) * len
			});
		}

		// Заполненная хаотичная звезда
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.closePath();
		ctx.fillStyle = this.isEditingMode ? 'orange' : 'yellow';
		ctx.globalAlpha = 0.85;
		ctx.fill();
		ctx.globalAlpha = 1.0;

		// Обводка
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.closePath();
		ctx.strokeStyle = 'orange';
		ctx.lineWidth = this.scale * 2.5;
		ctx.stroke();

		// Вторая (меньшая) звезда по центру
		const innerRays = 20;
		const innerR = r * 0.7;
		const innerPoints: Array<{x: number, y: number}> = [];
		for (let i = 0; i < innerRays; i++) {
			const angle = (Math.PI * 2 * i) / innerRays;
			const shine = Math.sin(this.t * Math.PI * 5 + i * 10) * 0.18;
			let len = innerR * (1 + shine);
			if (i % 2 === 1) len *= 0.7;
			innerPoints.push({
				x: screenPoint.x + Math.cos(angle) * len,
				y: screenPoint.y + Math.sin(angle) * len
			});
		}
		ctx.beginPath();
		ctx.moveTo(innerPoints[0].x, innerPoints[0].y);
		for (let i = 1; i < innerPoints.length; i++) {
			ctx.lineTo(innerPoints[i].x, innerPoints[i].y);
		}
		ctx.closePath();
		ctx.fillStyle = 'yellow';
		ctx.globalAlpha = 0.9;
		ctx.fill();
		ctx.globalAlpha = 1.0;
		ctx.strokeStyle = 'orange';
		ctx.lineWidth = this.scale * 1.5;
		ctx.stroke();

		// Сброс цвета для других объектов
		ctx.strokeStyle = '#000';
		ctx.fillStyle = '#fff';
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