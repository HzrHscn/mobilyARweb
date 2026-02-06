import "./LeftToolbar.css";

export default function LeftToolbar({
    viewMode,
    onViewModeChange,
    activeTool,
    onToolChange,
    onFitToScreen
}) {
    return (
        <div className="left-toolbar">
            <div className="toolbar-section">
                <button
                    className={`tool-btn ${viewMode === "2D" ? "active" : ""}`}
                    onClick={() => onViewModeChange("2D")}
                    title="2D Görünüm"
                >
                    2D
                </button>

                <button
                    className={`tool-btn ${viewMode === "3D" ? "active" : ""}`}
                    onClick={() => onViewModeChange("3D")}
                    title="3D Görünüm"
                >
                    3D
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <button
                    className={`tool-btn ${activeTool === "select" ? "active" : ""}`}
                    onClick={() => onToolChange("select")}
                    title="Seç (V)"
                >
                    <span className="tool-icon">↖</span>
                </button>

                <button
                    className={`tool-btn ${activeTool === "move" ? "active" : ""}`}
                    onClick={() => onToolChange("move")}
                    title="Taşı"
                >
                    <span className="tool-icon">✋</span>
                </button>

                <button
                    className={`tool-btn ${activeTool === "rotate" ? "active" : ""}`}
                    onClick={() => onToolChange("rotate")}
                    title="Döndür"
                >
                    <span className="tool-icon">↻</span>
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <button
                    className={`tool-btn ${activeTool === "zoom-in" ? "active" : ""}`}
                    onClick={() => onToolChange("zoom-in")}
                    title="Yakınlaştır (+)"
                >
                    <span className="tool-icon">🔍+</span>
                </button>

                <button
                    className="tool-btn"
                    onClick={onFitToScreen}
                    title="Ekrana Sığdır"
                >
                    <span className="tool-icon">⊡</span>
                </button>

                <button
                    className={`tool-btn ${activeTool === "zoom-out" ? "active" : ""}`}
                    onClick={() => onToolChange("zoom-out")}
                    title="Uzaklaştır (-)"
                >
                    <span className="tool-icon">🔍-</span>
                </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <button
                    className={`tool-btn ${activeTool === "pan" ? "active" : ""}`}
                    onClick={() => onToolChange("pan")}
                    title="Kaydır (Space)"
                >
                    <span className="tool-icon">🤚</span>
                </button>
            </div>
        </div>
    );
}