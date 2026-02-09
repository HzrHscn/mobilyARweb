/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
import { useState, useRef, useCallback, useEffect } from "react";
import TopBar from "./topbar.jsx";
import LeftToolbar from "./lefttoolbar.jsx";
import RightPanel from "./rightpanel.jsx";
import RoomCanvas from "./RoomCanvas";
import "./RoomEditorUI.css";

export default function RoomEditorUI({ initialData }) {
    const [projectName, setProjectName] = useState("İsimsiz Proje");
    const [mode, setMode] = useState("2D");
    const [activeTool, setActiveTool] = useState("select");
    const [tab, setTab] = useState("mimari");

    // Duvar verileri
    const [walls, setWalls] = useState([]);
    const [selectedWallId, setSelectedWallId] = useState(null);

    // Mimari elemanlar
    const [doors, setDoors] = useState([]);
    const [windows, setWindows] = useState([]);
    const [radiators, setRadiators] = useState([]);
    const [columns, setColumns] = useState([]);
    const [stairs, setStairs] = useState([]);

    // Diğer elemanlar
    const [texts, setTexts] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    // History (undo/redo)
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const canvasRef = useRef(null);

    // İlk duvarları oluştur
    useEffect(() => {
        if (walls.length === 0 && initialData) {
            const { width, depth, wallThickness } = initialData;
            const halfW = width / 2;
            const halfD = depth / 2;

            const initialWalls = [
                {
                    id: "wall-top",
                    x1: -halfW, y1: halfD,
                    x2: halfW, y2: halfD,
                    thickness: wallThickness
                },
                {
                    id: "wall-right",
                    x1: halfW, y1: halfD,
                    x2: halfW, y2: -halfD,
                    thickness: wallThickness
                },
                {
                    id: "wall-bottom",
                    x1: halfW, y1: -halfD,
                    x2: -halfW, y2: -halfD,
                    thickness: wallThickness
                },
                {
                    id: "wall-left",
                    x1: -halfW, y1: -halfD,
                    x2: -halfW, y2: halfD,
                    thickness: wallThickness
                }
            ];

            setWalls(initialWalls);
            saveToHistory({ walls: initialWalls });
        }
    }, [initialData]);

    // History kaydetme
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
            columns,
            stairs,
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
                        setColumns(data.columns || []);
                        setStairs(data.stairs || []);
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

    // --- SOL BAR FONKSİYONLARI ---
    const handleZoom = (direction) => {
        if (canvasRef.current && canvasRef.current.zoom) {
            canvasRef.current.zoom(direction);
        }
    };

    const handleFitToScreen = () => {
        if (canvasRef.current && canvasRef.current.fitToScreen) {
            canvasRef.current.fitToScreen();
        }
    };

    // Mimari eleman ekleme
    const handleAddElement = (type) => {
        const newElement = {
            id: `${type}-${Date.now()}`,
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
            case "column":
                setColumns([...columns, { ...newElement, size: 0.3 }]);
                break;
            case "stairs":
                setStairs([...stairs, { ...newElement, width: 1.0 }]);
                break;
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    handleUndo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
            if (e.key === 'v') {
                setActiveTool('select');
            } else if (e.key === ' ') {
                e.preventDefault();
                setActiveTool('pan');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    return (
        <div className="room-editor">
            {/* ÜST BAR */}
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

            <div className="main-layout">

                {/* SOL ARAÇ ÇUBUĞU */}
                <LeftToolbar
                    mode={mode}
                    onModeChange={setMode}
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onFitToScreen={handleFitToScreen}
                    onZoom={handleZoom} // Yeni prop
                />

                {/* SAĞ PANEL */}
                <RightPanel
                    tab={tab}
                    onTabChange={setTab}
                    onAddElement={handleAddElement}
                />

                {/* KANVAS ALANI */}
                <div className="canvas-container">
                    <RoomCanvas
                        ref={canvasRef}
                        mode={mode}
                        initialData={initialData}
                        walls={walls}
                        onWallsChange={setWalls}
                        selectedWallId={selectedWallId}
                        onWallSelect={setSelectedWallId}
                        activeTool={activeTool}
                        doors={doors}
                        windows={windows}
                        radiators={radiators}
                        columns={columns}
                        stairs={stairs}
                        texts={texts}
                        shapes={shapes}
                        measurements={measurements}
                        onDoorsChange={setDoors}
                        onWindowsChange={setWindows}
                        onRadiatorsChange={setRadiators}
                        onColumnsChange={setColumns}
                        onStairsChange={setStairs}
                        onTextsChange={setTexts}
                        onShapesChange={setShapes}
                        onMeasurementsChange={setMeasurements}
                        saveToHistory={saveToHistory}
                    />
                </div>
            </div>
        </div>
    );
}