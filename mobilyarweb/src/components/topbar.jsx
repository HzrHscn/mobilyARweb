import "./TopBar.css";

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
    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <input
                    type="text"
                    className="project-name-input"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    placeholder="İsimsiz Proje"
                />
            </div>

            <div className="top-bar-center">
                <button
                    className="toolbar-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Geri Al (Ctrl+Z)"
                >
                    <span className="btn-icon">↩</span>
                    <span className="btn-label">Geri</span>
                </button>

                <button
                    className="toolbar-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="İleri Al (Ctrl+Y)"
                >
                    <span className="btn-icon">↪</span>
                    <span className="btn-label">İleri</span>
                </button>

                <div className="toolbar-separator"></div>

                <button
                    className={`toolbar-btn ${activeTool === "text" ? "active" : ""}`}
                    onClick={() => onToolChange("text")}
                    title="Metin Ekle"
                >
                    <span className="btn-icon">A</span>
                    <span className="btn-label">Metin</span>
                </button>

                <button
                    className={`toolbar-btn ${activeTool === "measure" ? "active" : ""}`}
                    onClick={() => onToolChange("measure")}
                    title="Ölçüm"
                >
                    <span className="btn-icon">📏</span>
                    <span className="btn-label">Metre</span>
                </button>

                <button
                    className={`toolbar-btn ${activeTool === "shape" ? "active" : ""}`}
                    onClick={() => onToolChange("shape")}
                    title="Şekil Çiz"
                >
                    <span className="btn-icon">◻</span>
                    <span className="btn-label">Şekiller</span>
                </button>

                <div className="toolbar-separator"></div>

                <button
                    className="toolbar-btn"
                    onClick={onSave}
                    title="Kaydet"
                >
                    <span className="btn-icon">💾</span>
                    <span className="btn-label">Kaydet</span>
                </button>

                <button
                    className="toolbar-btn"
                    onClick={onLoad}
                    title="Yükle"
                >
                    <span className="btn-icon">📂</span>
                    <span className="btn-label">Yükle</span>
                </button>
            </div>

            <div className="top-bar-right">
                {/* Buraya gelecekte ekstra özellikler eklenebilir */}
            </div>
        </div>
    );
}