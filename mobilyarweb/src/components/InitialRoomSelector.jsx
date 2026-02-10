import { useState } from "react";
import "./InitialRoomSelector.css";

export default function InitialRoomSelector({ onStart }) {
    const [width, setWidth] = useState(6.00);
    const [depth, setDepth] = useState(4.00);
    const [wallHeight, setWallHeight] = useState(2.75);
    const [wallThickness, setWallThickness] = useState(0.24);

    const handleStart = () => {
        onStart({
            width: parseFloat(width) || 6.0,
            depth: parseFloat(depth) || 4.0,
            wallHeight: parseFloat(wallHeight) || 2.75,
            wallThickness: parseFloat(wallThickness) || 0.24
        });
    };

    return (
        <div className="selector-overlay">
            <div className="selector-modal">
                <div className="selector-header">
                    <h1>mobilyAR Web Designer</h1>
                    <p>Oda parametrelerini belirleyerek tasarıma başlayın</p>
                </div>

                <div className="selector-content">
                    <div className="selector-preview">
                        <div
                            className="preview-room"
                            style={{
                                width: `${Math.min(width * 35, 300)}px`,
                                height: `${Math.min(depth * 35, 250)}px`
                            }}
                        >
                            <span className="preview-label-width">{width} m</span>
                            <span className="preview-label-depth">{depth} m</span>
                            <div style={{ fontSize: '11px', opacity: 0.5 }}>ÖNİZLEME</div>
                        </div>
                    </div>

                    <div className="selector-inputs">
                        <div className="input-group">
                            <label>Oda Genişliği (X)</label>
                            <input type="number" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Oda Derinliği (Y)</label>
                            <input type="number" step="0.1" value={depth} onChange={(e) => setDepth(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Duvar Yüksekliği</label>
                            <input type="number" step="0.05" value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Duvar Kalınlığı</label>
                            <input type="number" step="0.01" value={wallThickness} onChange={(e) => setWallThickness(e.target.value)} />
                        </div>
                        <button className="btn-start" onClick={handleStart}>PROJEYİ BAŞLAT</button>
                    </div>
                </div>
            </div>
        </div>
    );
}