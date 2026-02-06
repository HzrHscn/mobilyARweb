import { useState, useEffect } from "react";
import RoomCanvas from "./RoomCanvas";

export default function RoomEditorUI({ initialData }) {
    // ← ÖNEMLİ: props olarak alıyoruz

    const [mode, setMode] = useState("2D");
    const [activeTool, setActiveTool] = useState("select");
    const [tab, setTab] = useState("mimari");
    const [projectName, setProjectName] = useState("İsimsiz Proje");

    // 🔹 Ölçüler — BAŞLANGIÇTA initialData’dan çekiyoruz
    const [roomWidth, setRoomWidth] = useState(6);
    const [roomDepth, setRoomDepth] = useState(4);
    const [wallThickness, setWallThickness] = useState(0.24);

    useEffect(() => {
        if (initialData) {
            setRoomWidth(initialData.width ?? 6);
            setRoomDepth(initialData.depth ?? 4);
            setWallThickness(initialData.wall ?? 0.24);
        }
    }, [initialData]);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "#e5e5e5",
            fontFamily: "Segoe UI, Arial, sans-serif"
        }}>

            {/* ÜST BAR */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: "white",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                gap: "10px",
                zIndex: 10
            }}>

                <input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        width: "160px"
                    }}
                />

                <button>↩ Geri</button>
                <button disabled>↪ İleri</button>
                <button>📏 Metre</button>
                <button>💾 Kaydet</button>
                <button>📂 Yükle</button>
            </div>

            {/* SOL ARAÇ ÇUBUĞU */}
            <div style={{
                position: "absolute",
                left: "12px",
                top: "80px",
                width: "70px",
                background: "white",
                borderRadius: "14px",
                padding: "10px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
            }}>

                <button
                    onClick={() => setMode("2D")}
                    style={{
                        background: mode === "2D" ? "#8b0c6f" : "#eee",
                        color: mode === "2D" ? "white" : "black"
                    }}
                >
                    2D
                </button>

                <button
                    onClick={() => setMode("3D")}
                    style={{
                        background: mode === "3D" ? "#8b0c6f" : "#eee",
                        color: mode === "3D" ? "white" : "black"
                    }}
                >
                    3D
                </button>

                <hr />

                <button onClick={() => setActiveTool("select")}>Seç</button>
                <button onClick={() => setActiveTool("move")}>Taşı</button>
                <button onClick={() => setActiveTool("rotate")}>Döndür</button>
                <button onClick={() => setActiveTool("pan")}>Pan</button>
            </div>

            {/* SAĞ PANEL — ARTIK SADECE MİMARİ ELEMANLAR */}
            <div style={{
                position: "absolute",
                right: "12px",
                top: "80px",
                width: "240px",
                background: "white",
                borderRadius: "14px",
                padding: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}>

                <div style={{ display: "flex", marginBottom: "10px", gap: "6px" }}>
                    <button onClick={() => setTab("mimari")} style={{ flex: 1 }}>
                        Mimari
                    </button>

                    <button onClick={() => setTab("urun")} style={{ flex: 1 }}>
                        Ürünler
                    </button>
                </div>

                {tab === "mimari" && (
                    <div>
                        <p>🚪 Kapı</p>
                        <p>🪟 Pencere</p>
                        <p>🔥 Radyatör</p>
                        <p>🧱 Kolon</p>
                        <p>🪜 Merdiven</p>
                    </div>
                )}

                {tab === "urun" && (
                    <div>
                        <p>📦 (Modeller daha sonra eklenecek)</p>
                    </div>
                )}
            </div>

            {/* MERKEZ ÇALIŞMA ALANI */}
            <div style={{
                position: "absolute",
                top: "60px",
                left: "100px",
                right: "260px",
                bottom: "60px",
                background: "#dcdcdc",
            }}>
                <RoomCanvas
                    mode={mode}
                    roomShape={initialData?.shape || "rect"}
                    width={roomWidth}
                    depth={roomDepth}
                    wall={wallThickness}
                />
            </div>

        </div>
    );
}
