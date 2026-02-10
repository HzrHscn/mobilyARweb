/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useRef, useCallback, useEffect } from "react";
import TopBar from "./topbar.jsx";
import LeftToolbar from "./lefttoolbar.jsx";
import RightPanel from "./rightpanel.jsx";
import WallEditor2D from "./WallEditor2D.jsx";
import RoomScene from "./RoomScene.jsx";
import "./RoomEditorUI.css";

export default function RoomEditorUI({ initialData }) {
    const [projectName, setProjectName] = useState("İsimsiz Proje");
    const [mode, setMode] = useState("2D");
    const [activeTool, setActiveTool] = useState("select");
    const [tab, setTab] = useState("mimari");

    // DURUM YÖNETİMİ
    const [walls, setWalls] = useState([]);
    const [selectedWallId, setSelectedWallId] = useState(null);
    const [doors, setDoors] = useState([]);
    const [windows, setWindows] = useState([]);
    const [radiators, setRadiators] = useState([]);
    const [columns, setColumns] = useState([]);
    const [stairs, setStairs] = useState([]);
    const [texts, setTexts] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    // GEÇMİŞ YÖNETİMİ
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    // İlk kurulum - Duvarları oluştur
    useEffect(() => {
        if (walls.length === 0 && initialData) {
            const { width, depth, wallThickness } = initialData;
            const halfW = width / 2;
            const halfD = depth / 2;
            const t = wallThickness;

            const initialWalls = [
                { id: "wall-top", x1: -halfW, y1: halfD, x2: halfW, y2: halfD, thickness: t },
                { id: "wall-right", x1: halfW, y1: halfD, x2: halfW, y2: -halfD, thickness: t },
                { id: "wall-bottom", x1: halfW, y1: -halfD, x2: -halfW, y2: -halfD, thickness: t },
                { id: "wall-left", x1: -halfW, y1: -halfD, x2: -halfW, y2: halfD, thickness: t }
            ];

            setWalls(initialWalls);
            const initialState = {
                walls: initialWalls,
                doors: [],
                windows: [],
                radiators: [],
                columns: [],
                stairs: [],
                texts: [],
                shapes: [],
                measurements: []
            };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }, [initialData]);

    // Geçmişe kaydet
    const saveToHistory = useCallback((newState) => {
        const currentData = {
            walls: newState.walls !== undefined ? newState.walls : walls,
            doors: newState.doors !== undefined ? newState.doors : doors,
            windows: newState.windows !== undefined ? newState.windows : windows,
            radiators: newState.radiators !== undefined ? newState.radiators : radiators,
            columns: newState.columns !== undefined ? newState.columns : columns,
            stairs: newState.stairs !== undefined ? newState.stairs : stairs,
            texts: newState.texts !== undefined ? newState.texts : texts,
            shapes: newState.shapes !== undefined ? newState.shapes : shapes,
            measurements: newState.measurements !== undefined ? newState.measurements : measurements
        };

        // Aynı state'i tekrar ekleme
        if (historyIndex >= 0 && historyIndex < history.length) {
            const lastState = history[historyIndex];
            if (JSON.stringify(lastState) === JSON.stringify(currentData)) {
                return;
            }
        }

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(currentData)));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex, walls, doors, windows, radiators, columns, stairs, texts, shapes, measurements]);

    // Geri al
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            updateAllStates(prevState);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex]);

    // İleri al
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            updateAllStates(nextState);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex]);

    // Tüm state'leri güncelle
    const updateAllStates = (state) => {
        setWalls(state.walls || []);
        setDoors(state.doors || []);
        setWindows(state.windows || []);
        setRadiators(state.radiators || []);
        setColumns(state.columns || []);
        setStairs(state.stairs || []);
        setTexts(state.texts || []);
        setShapes(state.shapes || []);
        setMeasurements(state.measurements || []);
    };

    // Duvarları güncelle ve geçmişe kaydet
    const handleWallsChange = useCallback((newWalls) => {
        setWalls(newWalls);
        saveToHistory({ walls: newWalls });
    }, [saveToHistory]);

    // DOSYA İŞLEMLERİ
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
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

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
                        updateAllStates(data);
                        saveToHistory(data);
                    } catch (err) {
                        alert("Dosya yüklenirken hata oluştu!");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    // ZOOM VE FIT FONKSİYONLARI
    const handleZoom = (direction) => {
        if (mode === "2D" && canvasRef.current) {
            canvasRef.current.zoom(direction);
        } else if (mode === "3D" && sceneRef.current) {
            sceneRef.current.zoom(direction);
        }
    };

    const handleFitToScreen = () => {
        if (mode === "2D" && canvasRef.current) {
            canvasRef.current.fitToScreen();
        } else if (mode === "3D" && sceneRef.current) {
            sceneRef.current.fitToScreen();
        }
    };

    // ELEMAN EKLEME
    const handleAddElement = (type) => {
        console.log("Adding element:", type);

        const newElement = { id: `${type}-${Date.now()}`, type, x: 0, y: 0, rotation: 0 };

        switch (type) {
            case "door":
                const newDoors = [...doors, { ...newElement, width: 0.9 }];
                setDoors(newDoors);
                saveToHistory({ doors: newDoors });
                break;
            case "window":
                const newWindows = [...windows, { ...newElement, width: 1.2 }];
                setWindows(newWindows);
                saveToHistory({ windows: newWindows });
                break;
            case "radiator":
                const newRadiators = [...radiators, { ...newElement, width: 0.6 }];
                setRadiators(newRadiators);
                saveToHistory({ radiators: newRadiators });
                break;
            case "column":
            case "round-column":
            case "square-column":
                const newColumns = [...columns, { ...newElement, size: 0.3 }];
                setColumns(newColumns);
                saveToHistory({ columns: newColumns });
                break;
            case "stairs":
                const newStairs = [...stairs, { ...newElement, width: 1.0 }];
                setStairs(newStairs);
                saveToHistory({ stairs: newStairs });
                break;
            case "wall":
                setActiveTool("draw-wall");
                break;
            case "opening":
                console.log("Açıklık ekleniyor");
                break;
            default:
                console.log("Bilinmeyen eleman tipi:", type);
                break;
        }
    };

    // ARAÇ DEĞİŞİKLİĞİ - Metin, Şekil, Ölçü için
    const handleToolChange = (tool) => {
        setActiveTool(tool);

        // Metin, şekil veya ölçü ekleme
        if (tool === 'text') {
            const newText = {
                id: `text-${Date.now()}`,
                type: 'text',
                content: 'Yeni Metin',
                x: 0,
                y: 0,
                fontSize: 14,
                color: '#000000'
            };
            const newTexts = [...texts, newText];
            setTexts(newTexts);
            saveToHistory({ texts: newTexts });
            console.log("Metin eklendi");
        } else if (tool === 'shape') {
            const newShape = {
                id: `shape-${Date.now()}`,
                type: 'rectangle',
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                color: '#cccccc'
            };
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            saveToHistory({ shapes: newShapes });
            console.log("Şekil eklendi");
        } else if (tool === 'measure') {
            const newMeasure = {
                id: `measure-${Date.now()}`,
                x1: -1,
                y1: 0,
                x2: 1,
                y2: 0
            };
            const newMeasurements = [...measurements, newMeasure];
            setMeasurements(newMeasurements);
            saveToHistory({ measurements: newMeasurements });
            console.log("Ölçü eklendi");
        }
    };

    // KLAVYE KISAYOLLARI
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    handleUndo();
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    handleRedo();
                } else if (e.key === 's') {
                    e.preventDefault();
                    handleSave();
                }
            }
            if (e.key === 'v') setActiveTool('select');
            else if (e.key === ' ') {
                e.preventDefault();
                setActiveTool('pan');
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === ' ' && activeTool === 'pan') {
                setActiveTool('select');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleUndo, handleRedo, activeTool]);

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
                onToolChange={handleToolChange}
            />

            <div className="main-layout">
                {/* SOL ARAÇ ÇUBUĞU */}
                <LeftToolbar
                    mode={mode}
                    onModeChange={setMode}
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onFitToScreen={handleFitToScreen}
                    onZoom={handleZoom}
                    onRotate={() => mode === "2D" ? setActiveTool("pan") : null}
                />

                {/* KANVAS / VIEWPORT ALANI */}
                <div className="canvas-container">
                    {mode === "2D" ? (
                        <WallEditor2D
                            ref={canvasRef}
                            initialData={initialData}
                            walls={walls}
                            onWallsChange={handleWallsChange}
                            selectedWallId={selectedWallId}
                            onWallSelect={setSelectedWallId}
                            activeTool={activeTool}
                            doors={doors}
                            windows={windows}
                            radiators={radiators}
                            saveToHistory={saveToHistory}
                        />
                    ) : (
                        <RoomScene
                            ref={sceneRef}
                            initialData={initialData}
                            walls={walls}
                            doors={doors}
                            windows={windows}
                            radiators={radiators}
                            selectedWallId={selectedWallId}
                            onWallSelect={setSelectedWallId}
                            onWallsChange={handleWallsChange}
                        />
                    )}
                </div>

                {/* SAĞ PANEL */}
                <RightPanel
                    tab={tab}
                    onTabChange={setTab}
                    onAddElement={handleAddElement}
                />
            </div>
        </div>
    );
}