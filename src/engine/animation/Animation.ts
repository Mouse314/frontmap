import type Scene from "../state/Scene.ts";
import type TimeManager from "./TimeManager.ts";

export default class Animation {
    public animDuration: number = 1000;
    private _isPlaying: boolean = false;
    private _rafId: number | null = null;
    private _startTime: number = 0;
    private _pauseTime: number = 0;
    private _paused: boolean = false;
    private _timeManager: TimeManager;

    constructor(timeManager: TimeManager) {
        this._timeManager = timeManager;
        timeManager.rangeLen
    }


    play(scene: Scene) {
        let currentDay = 0;
        const lastDay = this._timeManager.rangeLen;
        const playNextDay = () => {
            if (currentDay > lastDay) return;
            this.playDay(scene, currentDay, () => {
                currentDay++;
                playNextDay();
            });
        };
        playNextDay();
    }

    playDay(scene: Scene, day: number, onComplete?: () => void) {
        if (this._isPlaying) this.stop();
        this._isPlaying = true;
        this._paused = false;
        this._startTime = performance.now();
        const duration = this.animDuration;
        const ctx = scene.ctx;

        const animate = (now: number) => {
            if (!this._isPlaying) return;
            let t = (now - this._startTime) / duration;
            if (t > 1) t = 1;

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            scene.mapController.drawTiles(scene.ctx);
            
            for (const obj of scene.objects) {
                const lerpObject = obj.lerpAnimation(day, t);
                if (lerpObject) lerpObject.draw(scene);
            }

            if (t < 1) {
                this._rafId = requestAnimationFrame(animate);
            } else {
                this._isPlaying = false;
                this._rafId = null;
                if (onComplete) onComplete();
            }
        };
        this._rafId = requestAnimationFrame(animate);
    }

    pause() {
        if (this._isPlaying && !this._paused) {
            this._paused = true;
            this._pauseTime = performance.now();
            if (this._rafId !== null) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
        }
    }

    resume(scene: Scene, day: number) {
        if (this._paused) {
            this._isPlaying = true;
            this._paused = false;
            // скорректировать стартовое время
            this._startTime += performance.now() - this._pauseTime;
            const duration = this.animDuration;
            const ctx = scene.ctx;
            const animate = (now: number) => {
                if (!this._isPlaying) return;
                let t = (now - this._startTime) / duration;
                if (t > 1) t = 1;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                for (const obj of scene.objects) {
                    obj.lerpAnimation(day, t);
                    obj.draw(scene);
                }
                if (t < 1) {
                    this._rafId = requestAnimationFrame(animate);
                } else {
                    this._isPlaying = false;
                    this._rafId = null;
                }
            };
            this._rafId = requestAnimationFrame(animate);
        }
    }

    stop() {
        this._isPlaying = false;
        this._paused = false;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
}