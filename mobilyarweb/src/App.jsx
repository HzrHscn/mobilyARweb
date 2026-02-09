import { useState } from "react";
import InitialRoomSelector from "./components/InitialRoomSelector";
import RoomEditorUI from "./components/RoomEditorUI";
import "./App.css";

export default function App() {
    const [step, setStep] = useState("initial");
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

            {step === "editor" && initialData && (
                <RoomEditorUI
                    initialData={initialData}
                    onBack={() => setStep("initial")}
                />
            )}
        </>
    );
}