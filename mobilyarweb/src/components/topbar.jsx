import "./topbar.css";

export default function topbar({
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
            <div className="top-bar-group">
                <input
                    type="text"
                    className="project-name"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    placeholder="İsimsiz Proje"
                />
            </div>

            <div className="top-bar-group">
                <button
                    className="top-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Geri Al (Ctrl+Z)"
                >
                    <span className="btn-icon">↩</span>
                    Geri
                </button>

                <button
                    className="top-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="İleri Al (Ctrl+Y)"
                >
                    <span className="btn-icon">↪</span>
                    İleri
                </button>

                <div className="separator"></div>

                <button
                    className={`top-btn ${activeTool === "text" ? "active" : ""}`}
                    onClick={() => onToolChange("text")}
                    title="Metin Ekle"
                >
                    <span className="btn-icon">A</span>
                    Metin
                </button>

                <button
                    className={`top-btn ${activeTool === "measure" ? "active" : ""}`}
                    onClick={() => onToolChange("measure")}
                    title="Ölçüm"
                >
                    <span className="btn-icon">📏</span>
                    Metre
                </button>

                <button
                    className={`top-btn ${activeTool === "shape" ? "active" : ""}`}
                    onClick={() => onToolChange("shape")}
                    title="Şekil Çiz"
                >
                    <span className="btn-icon">◻</span>
                    Şekiller
                </button>

                <div className="separator"></div>

                <button
                    className="top-btn"
                    onClick={onSave}
                    title="Kaydet"
                >
                    <span className="btn-icon">💾</span>
                    Kaydet
                </button>

                <button
                    className="top-btn"
                    onClick={onLoad}
                    title="Yükle"
                >
                    <span className="btn-icon">📂</span>
                    Yükle
                </button>
            </div>
        </div>
    );
}