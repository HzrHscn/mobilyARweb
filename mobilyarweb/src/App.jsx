import { useState } from "react";
import InitialRoomSelector from "./components/InitialRoomSelector";
import RoomEditorUI from "./components/RoomEditorUI";

export default function App() {
    const [step, setStep] = useState("initial"); // "initial" -> "editor" -> "done"
    const [roomConfig, setRoomConfig] = useState(null);
    const [initialData, setInitialData] = useState(null);

    return (
        <>
            {step === "initial" && (
                <InitialRoomSelector
                    onStart={(data) => {
                        setInitialData(data);
                        setStep("editor");
                    }}
                />
            )}

            {step === "editor" && (
                <RoomEditorUI
                    initialData={initialData}
                    onStart={(data) => {
                        setRoomConfig(data);
                        setStep("done");
                    }}
                />
            )}

            {step === "done" && roomConfig && (
                <div style={{ padding: 20 }}>
                    <h2>ANA EKRAN (Şimdilik placeholder)</h2>
                    <pre>{JSON.stringify(roomConfig, null, 2)}</pre>
                </div>
            )}
        </>
    );
}