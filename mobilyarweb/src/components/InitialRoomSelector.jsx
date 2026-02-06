import { useState } from "react";

export default function InitialRoomSelector({ onStart }) {
    const [selectedShape, setSelectedShape] = useState("rect");
    const [wallHeight, setWallHeight] = useState(2.75);
    const [wallThickness, setWallThickness] = useState(0.24);

    const shapes = [
        { id: "none", label: "Duvar yok", icon: "⬜" },
        { id: "rect", label: "Dikdörtgen", icon: "▭" },
        { id: "l", label: "L-Şekli", icon: "└" },
        { id: "z", label: "Z-Şekli", icon: "⚡" },
        { id: "s", label: "S-Şekli", icon: "≈" },
        { id: "t", label: "T-Şekli", icon: "⊢" },
        { id: "u", label: "U-Şekli", icon: "⊔" },
        { id: "corner", label: "Köşe", icon: "┐" },
        { id: "blind", label: "Kör köşe", icon: "◢" },
    ];

    const renderParams = () => {
        switch (selectedShape) {
            case "rect":
                return (
                    <>
                        <ParamInput label="Genişlik (m)" />
                        <ParamInput label="Derinlik (m)" />
                    </>
                );

            case "l":
                return (
                    <>
                        <ParamInput label="Ana Genişlik (A)" />
                        <ParamInput label="Ana Derinlik (B)" />
                        <ParamInput label="Çıkıntı Genişliği (C)" />
                        <ParamInput label="Çıkıntı Derinliği (D)" />
                    </>
                );

            case "z":
                return (
                    <>
                        <ParamInput label="Üst Genişlik (A)" />
                        <ParamInput label="Orta Bağ (B)" />
                        <ParamInput label="Alt Genişlik (C)" />
                        <ParamInput label="Derinlik (D)" />
                    </>
                );

            case "s":
                return (
                    <>
                        <ParamInput label="Üst Bölüm (A)" />
                        <ParamInput label="Orta Bölüm (B)" />
                        <ParamInput label="Alt Bölüm (C)" />
                        <ParamInput label="Derinlik (D)"/>
                    </>
                );

            case "t":
                return (
                    <>
                        <ParamInput label="Gövde Uzunluğu (A)" />
                        <ParamInput label="Üst Bölüm Uzunluğu (B)" />
                        <ParamInput label="Derinlik (C)" />
                    </>
                );

            case "u":
                return (
                    <>
                        <ParamInput label="Açıklık Genişliği (A)" />
                        <ParamInput label="Sol Kol Uzunluğu (B)" />
                        <ParamInput label="Sağ Kol Uzunluğu (C)" />
                    </>
                );

            case "corner":
                return (
                    <>
                        <ParamInput label="Yatay Uzunluk (A)" />
                        <ParamInput label="Dikey Uzunluk (B)" />
                    </>
                );

            case "blind":
                return (
                    <>
                        <ParamInput label="Ana Duvar (A)" />
                        <ParamInput label="Kör Köşe (A)" />
                    </>
                );

            default:
                return <p style={{ opacity: 0.7 }}>Bu şekil için parametreler daha sonra eklenecek.</p>;
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999
        }}>

            <div style={{
                background: "#ffffff",
                width: "95%",
                maxWidth: "1200px",
                borderRadius: "18px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "20px"
            }}>

                {/* SOL TARAF: ŞEKİLLER */}
                <div>
                    <h2 style={{ marginBottom: "12px" }}>
                        Oda Şeklini Seçin
                    </h2>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px"
                    }}>
                        {shapes.map(shape => (
                            <button
                                key={shape.id}
                                onClick={() => setSelectedShape(shape.id)}
                                style={{
                                    padding: "16px",
                                    borderRadius: "12px",
                                    border: selectedShape === shape.id
                                        ? "2px solid #8b0c6f"
                                        : "1px solid #ddd",
                                    background: selectedShape === shape.id ? "#f5e6f1" : "#f7f7f7",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    fontSize: "18px"
                                }}
                            >
                                <div style={{ fontSize: "28px", marginBottom: "6px" }}>
                                    {shape.icon}
                                </div>
                                {shape.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SAĞ TARAF: PARAMETRELER */}
                <div style={{
                    background: "#f3f3f3",
                    borderRadius: "14px",
                    padding: "16px"
                }}>
                    <h3 style={{ marginBottom: "10px" }}>Duvar Ayarları</h3>

                    <ParamInput
                        label="Duvar Yüksekliği (m)"
                        value={wallHeight}
                        onChange={setWallHeight}
                    />

                    <ParamInput
                        label="Duvar Kalınlığı (m)"
                        value={wallThickness}
                        onChange={setWallThickness}
                    />

                    <hr style={{ margin: "12px 0" }} />

                    <h3>Şekle Özel Ölçüler</h3>
                    {renderParams()}

                    <button
                        onClick={() => onStart({
                            shape: selectedShape,
                            wallHeight,
                            wallThickness
                        })}
                        style={{
                            marginTop: "20px",
                            width: "100%",
                            padding: "12px",
                            background: "#8b0c6f",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "16px",
                            cursor: "pointer"
                        }}
                    >
                        ODAYI OLUŞTUR
                    </button>
                </div>
            </div>
        </div>
    );
}

function ParamInput({ label, value, onChange }) {
    return (
        <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "12px", opacity: 0.7 }}>
                {label}
            </label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={e => onChange && onChange(parseFloat(e.target.value))}
                style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                }}
            />
        </div>
    );
}
