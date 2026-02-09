/* eslint-disable no-undef */
import "./lefttoolbar.css";

export default function LeftToolbar({
    mode,
    onModeChange,
    activeTool,
    onToolChange,
    onFitToScreen,
    onZoom
}) {
    return (
        <div className="left-toolbar">
            {/* 2D-3D MODU */}
            <div className="tool-section">
                <button
                    className={`tool-btn ${mode === "2D" ? "active" : ""}`}
                    onClick={() => onModeChange("2D")}
                    title="2D Görünüm"
                >
                    2D
                </button>

                <button
                    className={`tool-btn ${mode === "3D" ? "active" : ""}`}
                    onClick={() => onModeChange("3D")}
                    title="3D Görünüm"
                >
                    3D
                </button>
            </div>

            <div className="tool-divider"></div>

            {/* SEÇİM VE DÖNDÜRME */}
            <div className="tool-section">
                <button
                    className={`tool-btn ${activeTool === "select" ? "active" : ""}`}
                    onClick={() => onToolChange("select")}
                    title="Seç (V)"
                >
                    <span className="icon">↖</span>
                </button>

                <button
                    className={`tool-btn ${activeTool === "rotate" ? "active" : ""}`}
                    onClick={() => onToolChange("rotate")}
                    title={mode === "2D" ? "Ekranı Döndür" : "Eksende Dön"}
                >
                    <span className="icon">↻</span>
                </button>
            </div>

            <div className="tool-divider"></div>

            {/* ZOOM VE FIT */}
            <div className="tool-section">
                <button
                    className="tool-btn"
                    onClick={() => onZoom("in")}
                    title="Yakınlaştır (+)"
                >
                    <span className="icon">+</span>
                </button>

                <button
                    className="tool-btn"
                    onClick={onFitToScreen}
                    title="Ekrana Sığdır"
                >
                    <span className="icon">⊡</span>
                </button>

                <button
                    className="tool-btn"
                    onClick={() => onZoom("out")}
                    title="Uzaklaştır (-)"
                >
                    <span className="icon">-</span>
                </button>
            </div>
            <div className="tool-section">

                <button

                    className={`tool-btn ${activeTool === "pan" ? "active" : ""}`}

                    onClick={() => onToolChange("pan")}

                    title="Kaydır (Space)"

                >

                    <span className="icon">🤚</span>

                </button>

            </div>
        </div>
    );
}