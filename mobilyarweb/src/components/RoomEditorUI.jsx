/* eslint-disable no-unused-vars */
import { useState, useRef, useCallback } from "react";
import RoomCanvas from "./RoomCanvas";
import TopBar from "./topbar";
import LeftToolbar from "./lefttoolbar";
import RightPanel from "./rightpanel";
import "./RoomEditorUI.css";

export default function RoomEditor({ initialData, onBack }) {
    const [projectName, setProjectName] = useState("İsimsiz Proje");
    const [viewMode, setViewMode] = useState("2D");
    const [activeTool, setActiveTool] = useState("select");
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [walls, setWalls] = useState([]);
    const [selectedWallId, setSelectedWallId] = useState(null);
    const [doors, setDoors] = useState([]);
    const [windows, setWindows] = useState([]);
    const [radiators, setRadiators] = useState([]);
    const [texts, setTexts] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    const canvasRef = useRef(null);

    // Değişiklikleri kaydet (undo/redo için)
    const saveToHistory = useCallback((newState) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Geri al
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setWalls(prevState.walls || []);
            setDoors(prevState.doors || []);
            setWindows(prevState.windows || []);
            setRadiators(prevState.radiators || []);
            setTexts(prevState.texts || []);
            setShapes(prevState.shapes || []);
            setMeasurements(prevState.measurements || []);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex]);

    // İleri al
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setWalls(nextState.walls || []);
            setDoors(nextState.doors || []);
            setWindows(nextState.windows || []);
            setRadiators(nextState.radiators || []);
            setTexts(nextState.texts || []);
            setShapes(nextState.shapes || []);
            setMeasurements(nextState.measurements || []);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex]);

    // Kaydet
    const handleSave = () => {
        const data = {
            projectName,
            initialData,
            walls,
            doors,
            windows,
            radiators,
            texts,
            shapes,
            measurements,
            timestamp: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Yükle
    const handleLoad = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        setProjectName(data.projectName || "İsimsiz Proje");
                        setWalls(data.walls || []);
                        setDoors(data.doors || []);
                        setWindows(data.windows || []);
                        setRadiators(data.radiators || []);
                        setTexts(data.texts || []);
                        setShapes(data.shapes || []);
                        setMeasurements(data.measurements || []);
                    } catch (err) {
                        alert("Dosya yüklenirken hata oluştu!");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    // Ekrana sığdır
    const handleFitToScreen = () => {
        if (canvasRef.current) {
            canvasRef.current.fitToScreen();
        }
    };

    // Mimari eleman ekleme
    const handleAddArchitecturalElement = (type) => {
        const newElement = {
            id: Date.now(),
            type,
            x: 0,
            y: 0,
            rotation: 0
        };

        switch (type) {
            case "door":
                setDoors([...doors, { ...newElement, width: 0.9 }]);
                break;
            case "window":
                setWindows([...windows, { ...newElement, width: 1.2 }]);
                break;
            case "radiator":
                setRadiators([...radiators, { ...newElement, width: 0.6 }]);
                break;
        }
    };

    return (
        <div className="room-editor">
            <TopBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onSave={handleSave}
                onLoad={handleLoad}
                activeTool={activeTool}
                onToolChange={setActiveTool}
            />

            <LeftToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onFitToScreen={handleFitToScreen}
            />

            <RightPanel
                onAddElement={handleAddArchitecturalElement}
            />

            <div className="canvas-container">
                {viewMode === "2D" && (
                    <RoomCanvas
                        ref={canvasRef}
                        initialData={initialData}
                        walls={walls}
                        onWallsChange={setWalls}
                        selectedWallId={selectedWallId}
                        onWallSelect={setSelectedWallId}
                        activeTool={activeTool}
                        doors={doors}
                        windows={windows}
                        radiators={radiators}
                        texts={texts}
                        shapes={shapes}
                        measurements={measurements}
                        onDoorsChange={setDoors}
                        onWindowsChange={setWindows}
                        onRadiatorsChange={setRadiators}
                        onTextsChange={setTexts}
                        onShapesChange={setShapes}
                        onMeasurementsChange={setMeasurements}
                        saveToHistory={saveToHistory}
                    />
                )}

                {viewMode === "3D" && (
                    <div className="canvas-3d-placeholder">
                        <h2>3D Görünüm</h2>
                        <p>3D görünüm yakında eklenecek...</p>
                    </div>
                )}
            </div>
        </div>
    );
}