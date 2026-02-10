/* eslint-disable no-unused-vars */
import { useState } from "react";
import "./lefttoolbar.css";

export default function LeftToolbar({
    mode,
    onModeChange,
    activeTool,
    onToolChange,
    onFitToScreen,
    onZoom,
    onRotate
}) {
    return (
        <div className="left-toolbar-fixed">
            {/* GÖRÜNÜM MODLARI (2D/3D) */}
            <div className="toolbar-section">
                <button
                    className={`toolbar-icon ${mode === "2D" ? "active" : ""}`}
                    onClick={() => onModeChange("2D")}
                    title="2D Mimari Görünüm"
                >
                    <span className="mode-text">2D</span>
                </button>
                <button
                    className={`toolbar-icon ${mode === "3D" ? "active" : ""}`}
                    onClick={() => onModeChange("3D")}
                    title="3D Görselleştirme"
                >
                    <span className="mode-text">3D</span>
                </button>
            </div>

            <div className="toolbar-divider"></div>

            {/* ETKİLEŞİM ARAÇLARI */}
            <div className="toolbar-section">
                <button
                    className={`toolbar-icon ${activeTool === "select" ? "active" : ""}`}
                    onClick={() => onToolChange("select")}
                    title="Seç ve İşlem Yap"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    </svg>
                </button>

                <button
                    className={`toolbar-icon ${activeTool === "rotate" ? "active" : ""}`}
                    onClick={() => {
                        onToolChange("rotate");
                        if (onRotate) onRotate();
                    }}
                    title={mode === "2D" ? "Ekranı Kaydır" : "Eksende Dön"}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                    </svg>
                </button>
            </div>

            <div className="toolbar-divider"></div>

            {/* NAVİGASYON (ZOOM/FIT) */}
            <div className="toolbar-section">
                <button className="toolbar-icon" onClick={() => onZoom("in")} title="Yakınlaştır">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button className="toolbar-icon" onClick={onFitToScreen} title="Ekrana Sığdır">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
                    </svg>
                </button>
                <button className="toolbar-icon" onClick={() => onZoom("out")} title="Uzaklaştır">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}