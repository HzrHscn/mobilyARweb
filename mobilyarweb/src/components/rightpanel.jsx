/* eslint-disable no-unused-vars */
import { useState } from "react";
import "./rightpanel.css";

export default function RightPanel({ tab, onTabChange, onAddElement }) {
    const [showMimariDrawer, setShowMimariDrawer] = useState(false);
    const [showKatalogDrawer, setShowKatalogDrawer] = useState(false);

    const architecturalElements = [
        { id: "wall", label: "Duvar çiz", icon: "⬜" },
        { id: "opening", label: "Açıklık", icon: "📐" },
        { id: "door", label: "Kapı", icon: "🚪" },
        { id: "window", label: "Pencere", icon: "🪟" },
        { id: "double-door", label: "Çift Kanat Kapı", icon: "🚪🚪" },
        { id: "glass-door", label: "Cam kapı", icon: "🚪" },
        { id: "glass-panel", label: "Cam Cephe", icon: "🪟" },
        { id: "round-window", label: "Yuvarlak pencere", icon: "⭕" },
        { id: "column", label: "Yuvarlak kolon", icon: "🔘" },
        { id: "square-column", label: "Kare kolon", icon: "⬛" },
        { id: "radiator", label: "Radyatör", icon: "🔥" }
    ];

    const handleElementClick = (elementId) => {
        console.log("Element clicked:", elementId);
        if (onAddElement) {
            onAddElement(elementId);
        }
        setShowMimariDrawer(false);
        setShowKatalogDrawer(false);
    };

    return (
        <>
            {/* SABİT YUVARLAK İKONLAR */}
            <div className="right-toolbar-fixed">
                <button
                    className={`toolbar-icon-right ${showMimariDrawer ? "active" : ""}`}
                    onClick={() => {
                        setShowMimariDrawer(!showMimariDrawer);
                        setShowKatalogDrawer(false);
                    }}
                    title="Mimari"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                </button>

                <button
                    className={`toolbar-icon-right ${showKatalogDrawer ? "active" : ""}`}
                    onClick={() => {
                        setShowKatalogDrawer(!showKatalogDrawer);
                        setShowMimariDrawer(false);
                    }}
                    title="Katalog"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <path d="M9 22V12h6v10" />
                    </svg>
                </button>
            </div>

            {/* MİMARİ DRAWER */}
            {showMimariDrawer && (
                <div className="right-drawer">
                    <div className="drawer-header">
                        <h3>Mimari</h3>
                        <button
                            className="drawer-close"
                            onClick={() => setShowMimariDrawer(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="drawer-content">
                        {architecturalElements.map((element) => (
                            <button
                                key={element.id}
                                className="drawer-item"
                                onClick={() => handleElementClick(element.id)}
                            >
                                <span className="drawer-item-icon">{element.icon}</span>
                                <span className="drawer-item-label">{element.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* KATALOG DRAWER */}
            {showKatalogDrawer && (
                <div className="right-drawer">
                    <div className="drawer-header">
                        <h3>Katalog</h3>
                        <button
                            className="drawer-close"
                            onClick={() => setShowKatalogDrawer(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="drawer-content">
                        <div className="catalog-placeholder">
                            <div className="placeholder-icon">📦</div>
                            <p>Ürün modelleri yakında eklenecek...</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}