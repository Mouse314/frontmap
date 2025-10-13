import type Scene from "../engine/state/Scene.ts";
import "./style.css";

// TODO: day и totalDays должны приходить из props или контекста

interface FooterProps {
    scene: Scene | null;
}

export default function Footer({ scene }: FooterProps) {
    return (
        <footer className="footer-block">
            <div style={{ width: '100%', textAlign: 'center' }}>
                {scene && <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                    день {scene.day}, максимум: {scene.timeManager.rangeLen}
                </div>}
                {scene && <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <button title="В начало" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.day = 0; scene.render(); }}>{'<<'}</button>
                    <button title="Назад" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.day = Math.max(0, scene.day - 1); scene.render(); }}>{'<'}</button>
                    <button title="Пуск" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.animationController.play(scene); }}>{'▶'}</button>
                    <button title="Пауза" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.animationController.pause(); }}>{'⏸'}</button>
                    <button title="Вперёд" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.day = Math.min(scene.timeManager.rangeLen, scene.day + 1); scene.render(); }}>{'>'}</button>
                    <button title="В конец" style={{ fontSize: 22, padding: '6px 14px' }} onClick={() => { scene.day = scene.timeManager.rangeLen; scene.render(); }}>{'>>'}</button>
                </div>}
                {scene && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                    <button style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, background: '#e0e0e0', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => {
                            scene.addNewDay();
                        }}
                    >
                        Добавить новый день
                    </button>
                </div>}
            </div>
        </footer>
    );
}
