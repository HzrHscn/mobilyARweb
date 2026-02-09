import "./rightpanel.css";

export default function rightpanel({ tab, onTabChange, onAddElement }) {
    const architecturalElements = [
        { id: "door", label: "Kapı", icon: "🚪" },
        { id: "window", label: "Pencere", icon: "🪟" },
        { id: "radiator", label: "Radyatör", icon: "🔥" },
        { id: "column", label: "Kolon", icon: "🧱" },
        { id: "stairs", label: "Merdiven", icon: "🪜" }
    ];

    return (
        <div className="right-panel">
            <div className="panel-tabs">
                <button
                    className={`tab-btn ${tab === "mimari" ? "active" : ""}`}
                    onClick={() => onTabChange("mimari")}
                >
                    Mimari
                </button>
                <button
                    className={`tab-btn ${tab === "urun" ? "active" : ""}`}
                    onClick={() => onTabChange("urun")}
                >
                    Ürünler
                </button>
            </div>

            <div className="panel-content">
                {tab === "mimari" && (
                    <div className="elements-grid">
                        {architecturalElements.map((element) => (
                            <button
                                key={element.id}
                                className="element-btn"
                                onClick={() => onAddElement(element.id)}
                                title={element.label}
                            >
                                <span className="element-icon">{element.icon}</span>
                                <span className="element-label">{element.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {tab === "urun" && (
                    <div className="products-placeholder">
                        <div className="placeholder-icon">📦</div>
                        <p>Ürün modelleri yakında eklenecek...</p>
                    </div>
                )}
            </div>
        </div>
    );
}