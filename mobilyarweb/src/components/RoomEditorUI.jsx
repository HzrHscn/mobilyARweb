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
    const [floorColor, setFloorColor] = useState("#c8a86e");
    const [floorScale, setFloorScale] = useState({ x: 1, y: 1 }); // zemin scale state

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const lastWallsRef = useRef(null);

    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

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
            lastWallsRef.current = JSON.stringify(initialWalls);

            const initialState = {
                walls: initialWalls,
                doors: [],
                windows: [],
                radiators: [],
                columns: [],
                stairs: [],
                texts: [],
                shapes: [],
                measurements: [],
                floorColor: "#e8e8e8"
            };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }, [initialData]);

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
            measurements: newState.measurements !== undefined ? newState.measurements : measurements,
            floorColor: newState.floorColor !== undefined ? newState.floorColor : floorColor
        };

        const currentWallsStr = JSON.stringify(currentData.walls);

        if (currentWallsStr === lastWallsRef.current && historyIndex >= 0) {
            return;
        }

        lastWallsRef.current = currentWallsStr;

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(currentData)));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex, walls, doors, windows, radiators, columns, stairs, texts, shapes, measurements, floorColor]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            updateAllStates(prevState);
            setHistoryIndex(historyIndex - 1);
            lastWallsRef.current = JSON.stringify(prevState.walls);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            updateAllStates(nextState);
            setHistoryIndex(historyIndex + 1);
            lastWallsRef.current = JSON.stringify(nextState.walls);
        }
    }, [history, historyIndex]);

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
        setFloorColor(state.floorColor || "#e8e8e8");
    };

    const handleWallsChange = useCallback((newWalls) => {
        setWalls(newWalls);
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            if (walls.length > 0) {
                const currentStr = JSON.stringify(walls);
                if (currentStr !== lastWallsRef.current) {
                    saveToHistory({ walls });
                }
            }
        };

        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [walls, saveToHistory]);

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
            floorColor,
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

    const handleAddElement = (type) => {
        console.log("Adding element:", type);

        const centerX = 0;
        const centerY = 0;

        const newElement = {
            id: `${type}-${Date.now()}`,
            type,
            x: centerX,
            y: centerY,
            rotation: 0
        };

        switch (type) {
            case "door":
                const newDoors = [...doors, { ...newElement, width: 0.9, height: 2.1 }];
                setDoors(newDoors);
                saveToHistory({ doors: newDoors });
                console.log("Kapı eklendi:", newElement);
                break;
            case "window":
                const newWindows = [...windows, { ...newElement, width: 1.2, height: 1.2 }];
                setWindows(newWindows);
                saveToHistory({ windows: newWindows });
                console.log("Pencere eklendi:", newElement);
                break;
            case "radiator":
                const newRadiators = [...radiators, { ...newElement, width: 0.6, height: 0.6 }];
                setRadiators(newRadiators);
                saveToHistory({ radiators: newRadiators });
                console.log("Radyatör eklendi:", newElement);
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
                setActiveTool("select");
                // Yeni duvar eklemek için + butonuna basılmalı
                console.log("Duvar çizmek için bir duvarı seçin ve + butonuna basın");
                break;
            case "opening":
                const newOpening = { ...newElement, width: 1.0 };
                setWindows([...windows, newOpening]);
                saveToHistory({ windows: [...windows, newOpening] });
                break;
            default:
                console.log("Bilinmeyen eleman tipi:", type);
                break;
        }
    };

    const handleToolChange = (tool) => {
        setActiveTool(tool);

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
        } else if (tool === 'measure') {
            console.log("Ölçü aracı aktif");
        }
    };

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
                <LeftToolbar
                    mode={mode}
                    onModeChange={setMode}
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onFitToScreen={handleFitToScreen}
                    onZoom={handleZoom}
                    onRotate={() => mode === "2D" ? setActiveTool("pan") : null}
                />

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
                            texts={texts}
                            shapes={shapes}
                            measurements={measurements}
                            onDoorsChange={setDoors}
                            onWindowsChange={setWindows}
                            onRadiatorsChange={setRadiators}
                            onTextsChange={setTexts}
                            onShapesChange={setShapes}
                            onMeasurementsChange={setMeasurements}
                            floorColor={floorColor}
                            onFloorColorChange={setFloorColor}
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
                            floorColor={floorColor}
                        />
                    )}
                </div>

                <RightPanel
                    tab={tab}
                    onTabChange={setTab}
                    onAddElement={handleAddElement}
                />
            </div>
        </div>
    );
}