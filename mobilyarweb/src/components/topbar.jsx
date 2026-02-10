/* eslint-disable no-unused-vars */
import { useState } from "react";
import "./topbar.css";

export default function TopBar({
    projectName,
    onProjectNameChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onSave,
    onLoad,
    activeTool,
    onToolChange
}) {
    const [isEditingName, setIsEditingName] = useState(false);

    return (
        <div className="top-bar">
            {/* SOL: PROJE ADI */}
            <div className="top-bar-left">
                {isEditingName ? (
                    <input
                        autoFocus
                        value={projectName}
                        onChange={(e) => onProjectNameChange(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingName(false);
                        }}
                        className="project-name-input"
                    />
                ) : (
                    <h2
                        className="project-name"
                        onClick={() => setIsEditingName(true)}
                        title="Düzenlemek için tıklayın"
                    >
                        {projectName}
                    </h2>
                )}
            </div>

            {/* ORTA: ARAÇLAR */}
            <div className="top-bar-center">
                <button
                    className="top-bar-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Geri Al (Ctrl+Z)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                    </svg>
                </button>

                <button
                    className="top-bar-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="İleri Al (Ctrl+Y)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                    </svg>
                </button>

                <div className="top-bar-divider"></div>

                <button
                    className={`top-bar-btn ${activeTool === 'text' ? 'active' : ''}`}
                    onClick={() => onToolChange('text')}
                    title="Metin Ekle"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                </button>

                <button
                    className={`top-bar-btn ${activeTool === 'shape' ? 'active' : ''}`}
                    onClick={() => onToolChange('shape')}
                    title="Şekil Ekle"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                </button>

                <button
                    className={`top-bar-btn ${activeTool === 'measure' ? 'active' : ''}`}
                    onClick={() => onToolChange('measure')}
                    title="Ölçü Ekle"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h18v18H3zM9 3v18M3 9h18M3 15h18M15 3v18" />
                    </svg>
                </button>
            </div>

            {/* SAĞ: DOSYA İŞLEMLERİ */}
            <div className="top-bar-right">
                <button className="top-bar-btn" onClick={onSave} title="Projeyi Kaydet (Ctrl+S)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    <span>Kaydet</span>
                </button>

                <button className="top-bar-btn" onClick={onLoad} title="Proje Yükle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span>Yükle</span>
                </button>
            </div>
        </div>
    );
}