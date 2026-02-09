import { useState } from "react";
import "./InitialRoomSelector.css";

export default function InitialRoomSelector({ onStart }) {
    const [width, setWidth] = useState(6);
    const [depth, setDepth] = useState(4);
    const [wallHeight, setWallHeight] = useState(2.75);
    const [wallThickness, setWallThickness] = useState(0.24);

    const handleStart = () => {
        onStart({
            width: parseFloat(width) || 6,
            depth: parseFloat(depth) || 4,
            wallHeight: parseFloat(wallHeight) || 2.75,
            wallThickness: parseFloat(wallThickness) || 0.24
        });
    };

    return (
        <div className="selector-overlay">
            <div className="selector-modal">
                <div className="selector-header">
                    <h1>Yeni Oda Oluştur</h1>
                    <p>Oda ölçülerini girin</p>
                </div>

                <div className="selector-content">
                    <div className="selector-preview">
                        <div
                            className="preview-room"
                            style={{
                                width: `${Math.min(width * 40, 300)}px`,
                                height: `${Math.min(depth * 40, 200)}px`
                            }}
                        >
                            <span className="preview-label-width">{width}m</span>
                            <span className="preview-label-depth">{depth}m</span>
                        </div>
                    </div>

                    <div className="selector-inputs">
                        <div className="input-group">
                            <label>Genişlik (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="1"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Derinlik (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="1"
                                value={depth}
                                onChange={(e) => setDepth(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Duvar Yüksekliği (m)</label>
                            <input
                                type="number"
                                step="0.05"
                                min="2"
                                value={wallHeight}
                                onChange={(e) => setWallHeight(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Duvar Kalınlığı (m)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={wallThickness}
                                onChange={(e) => setWallThickness(e.target.value)}
                            />
                        </div>

                        <button className="btn-start" onClick={handleStart}>
                            ODAYI OLUŞTUR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}