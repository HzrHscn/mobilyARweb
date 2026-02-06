import { useState } from "react";
import "./RightPanel.css";

export default function RightPanel({ onAddElement }) {
    const [activeTab, setActiveTab] = useState("architecture");

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
                    className={`tab-btn ${activeTab === "architecture" ? "active" : ""}`}
                    onClick={() => setActiveTab("architecture")}
                >
                    Mimari
                </button>
                <button
                    className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
                    onClick={() => setActiveTab("products")}
                >
                    Ürünler
                </button>
            </div>

            <div className="panel-content">
                {activeTab === "architecture" && (
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

                {activeTab === "products" && (
                    <div className="products-placeholder">
                        <div className="placeholder-icon">📦</div>
                        <p>Ürün modelleri yakında eklenecek...</p>
                    </div>
                )}
            </div>
        </div>
    );
}