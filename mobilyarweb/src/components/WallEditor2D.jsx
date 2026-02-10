/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "./WallEditor2D.css";

const WallEditor2D = forwardRef(({
    initialData, walls, onWallsChange, selectedWallId, onWallSelect, activeTool, saveToHistory
}, ref) => {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(50);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [draggedWall, setDraggedWall] = useState(null);
    const [dragMode, setDragMode] = useState(null);
    const [draggedPoint, setDraggedPoint] = useState(null);
    const [editingDim, setEditingDim] = useState(null);
    const [newWallStart, setNewWallStart] = useState(null);
    const [mousePos, setMousePos] = useState(null);
    const [dimInputValue, setDimInputValue] = useState("");

    useImperativeHandle(ref, () => ({
        zoom: (dir) => setScale(s => Math.max(5, Math.min(s * (dir === "in" ? 1.2 : 0.8), 300))),
        fitToScreen: () => {
            if (!initialData || !canvasRef.current) return;
            const pad = 150;
            setScale(Math.min((canvasRef.current.width - pad) / initialData.width, (canvasRef.current.height - pad) / initialData.depth, 70));
            setOffset({ x: 0, y: 0 });
        }
    }));

    const toScreen = (x, y) => ({
        x: canvasRef.current.width / 2 + x * scale + offset.x,
        y: canvasRef.current.height / 2 - y * scale + offset.y
    });

    const toWorld = (sx, sy) => ({
        x: (sx - canvasRef.current.width / 2 - offset.x) / scale,
        y: (canvasRef.current.height / 2 - sy - offset.y) / scale
    });

    const snapToNearbyPoint = (x, y, tolerance = 0.3) => {
        for (const wall of walls) {
            if (Math.hypot(wall.x1 - x, wall.y1 - y) < tolerance) return { x: wall.x1, y: wall.y1 };
            if (Math.hypot(wall.x2 - x, wall.y2 - y) < tolerance) return { x: wall.x2, y: wall.y2 };
        }
        return { x, y };
    };

    const updateWallsStructure = (currentWalls, movedWall, dx, dy, mode, point) => {
        const tolerance = 0.1;
        const updatedWalls = currentWalls.map(w => ({ ...w }));

        const movedIndex = updatedWalls.findIndex(w => w.id === movedWall.id);
        if (movedIndex === -1) return currentWalls;

        const wall = updatedWalls[movedIndex];
        const oldX1 = wall.x1, oldY1 = wall.y1;
        const oldX2 = wall.x2, oldY2 = wall.y2;

        if (mode === 'move') {
            const isHor = Math.abs(wall.y1 - wall.y2) < 0.01;
            if (isHor) {
                wall.y1 += dy;
                wall.y2 += dy;
            } else {
                wall.x1 += dx;
                wall.x2 += dx;
            }
        } else if (mode === 'resize') {
            if (point === 'p1') {
                wall.x1 += dx;
                wall.y1 += dy;
            } else {
                wall.x2 += dx;
                wall.y2 += dy;
            }
        }

        updatedWalls.forEach((w, idx) => {
            if (idx === movedIndex) return;

            if (Math.abs(w.x1 - oldX1) < tolerance && Math.abs(w.y1 - oldY1) < tolerance) {
                w.x1 = wall.x1;
                w.y1 = wall.y1;
            }
            if (Math.abs(w.x1 - oldX2) < tolerance && Math.abs(w.y1 - oldY2) < tolerance) {
                w.x1 = wall.x2;
                w.y1 = wall.y2;
            }

            if (Math.abs(w.x2 - oldX1) < tolerance && Math.abs(w.y2 - oldY1) < tolerance) {
                w.x2 = wall.x1;
                w.y2 = wall.y1;
            }
            if (Math.abs(w.x2 - oldX2) < tolerance && Math.abs(w.y2 - oldY2) < tolerance) {
                w.x2 = wall.x2;
                w.y2 = wall.y2;
            }
        });

        return updatedWalls;
    };

    const handleDimSubmit = (direction) => {
        const newValue = parseFloat(dimInputValue);
        if (isNaN(newValue) || !editingDim) return;

        const wall = walls.find(w => w.id === editingDim.wallId);
        if (!wall) return;

        const currentLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        const diff = newValue - currentLen;
        const isHorizontal = Math.abs(wall.y1 - wall.y2) < 0.01;

        let dx = 0, dy = 0;

        if (direction === 'positive') {
            if (isHorizontal) {
                dx = diff;
                dy = 0;
            } else {
                dx = 0;
                dy = diff;
            }
            onWallsChange(updateWallsStructure(walls, wall, dx, dy, 'resize', 'p2'));
        } else {
            if (isHorizontal) {
                dx = -diff;
                dy = 0;
            } else {
                dx = 0;
                dy = -diff;
            }
            onWallsChange(updateWallsStructure(walls, wall, dx, dy, 'resize', 'p1'));
        }

        setEditingDim(null);
        setDimInputValue("");
    };

    const getConnectedWalls = (wall) => {
        const tolerance = 0.1;
        return walls.filter(w => {
            if (w.id === wall.id) return false;
            return (
                Math.hypot(w.x1 - wall.x1, w.y1 - wall.y1) < tolerance ||
                Math.hypot(w.x1 - wall.x2, w.y1 - wall.y2) < tolerance ||
                Math.hypot(w.x2 - wall.x1, w.y2 - wall.y1) < tolerance ||
                Math.hypot(w.x2 - wall.x2, w.y2 - wall.y2) < tolerance
            );
        });
    };

    const distanceToWallLine = (px, py, wall) => {
        const p1 = toScreen(wall.x1, wall.y1);
        const p2 = toScreen(wall.x2, wall.y2);

        const A = px - p1.x;
        const B = py - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (walls.length >= 3) {
            ctx.fillStyle = "#e8e8e8";
            ctx.beginPath();
            walls.forEach((w, i) => {
                const p = toScreen(w.x1, w.y1);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
        }

        walls.forEach(wall => {
            const p1 = toScreen(wall.x1, wall.y1);
            const p2 = toScreen(wall.x2, wall.y2);
            const isSel = wall.id === selectedWallId;

            ctx.strokeStyle = isSel ? "#8b0c6f" : "#444";
            ctx.lineWidth = wall.thickness * scale;
            ctx.lineCap = "square";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            if (isSel) {
                const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const offsetD = (wall.thickness * scale / 2) + 20;

                ctx.font = "bold 12px Arial";
                ctx.textAlign = "center";

                const innerOffsetX = midX + Math.sin(angle) * offsetD;
                const innerOffsetY = midY - Math.cos(angle) * offsetD;
                ctx.fillStyle = "#000";
                ctx.fillText(`${len.toFixed(2)} m`, innerOffsetX, innerOffsetY);

                const outerOffsetX = midX - Math.sin(angle) * (offsetD + 10);
                const outerOffsetY = midY + Math.cos(angle) * (offsetD + 10);
                ctx.fillStyle = "#777";
                ctx.fillText(`${(len + wall.thickness * 2).toFixed(2)} m`, outerOffsetX, outerOffsetY);

                const connectedWalls = getConnectedWalls(wall);
                connectedWalls.forEach(w => {
                    const wp1 = toScreen(w.x1, w.y1);
                    const wp2 = toScreen(w.x2, w.y2);
                    const wLen = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
                    ctx.fillStyle = "#999";
                    ctx.fillText(`${wLen.toFixed(2)}m`, (wp1.x + wp2.x) / 2, (wp1.y + wp2.y) / 2 - 15);
                });

                ctx.fillStyle = "#ff00ff";
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#8b0c6f";
                ctx.beginPath();
                ctx.arc(midX, midY, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.arc(p2.x + 25, p2.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.fillText("+", p2.x + 25, p2.y + 4);
            }
        });

        if (newWallStart && mousePos) {
            const p1 = toScreen(newWallStart.x, newWallStart.y);
            const len = Math.hypot(mousePos.x - newWallStart.x, mousePos.y - newWallStart.y);

            ctx.strokeStyle = "#8b0c6f";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mousePos.screenX, mousePos.screenY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#000";
            ctx.font = "bold 12px Arial";
            ctx.fillText(`${len.toFixed(2)} m`, (p1.x + mousePos.screenX) / 2, (p1.y + mousePos.screenY) / 2 - 10);
        }

        if (mousePos && !newWallStart) {
            walls.forEach(wall => {
                const p1 = toScreen(wall.x1, wall.y1);
                const p2 = toScreen(wall.x2, wall.y2);

                if (Math.hypot(mousePos.screenX - p1.x, mousePos.screenY - p1.y) < 15) {
                    ctx.strokeStyle = "#00ff00";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p1.x, p1.y, 12, 0, Math.PI * 2);
                    ctx.stroke();
                }
                if (Math.hypot(mousePos.screenX - p2.x, mousePos.screenY - p2.y) < 15) {
                    ctx.strokeStyle = "#00ff00";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p2.x, p2.y, 12, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }
    }, [walls, scale, offset, selectedWallId, newWallStart, mousePos]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (activeTool === "pan" || e.button === 1) {
            setIsPanning(true);
            setDragStart({ x: mx, y: my });
            return;
        }

        if (newWallStart) {
            const snapped = snapToNearbyPoint(worldPos.x, worldPos.y);
            const newWall = {
                id: `wall-${Date.now()}`,
                x1: newWallStart.x,
                y1: newWallStart.y,
                x2: snapped.x,
                y2: snapped.y,
                thickness: initialData.wallThickness || 0.24
            };
            onWallsChange([...walls, newWall]);
            onWallSelect(newWall.id);
            setNewWallStart(null);
            setMousePos(null);
            return;
        }

        for (const wall of walls) {
            const p1 = toScreen(wall.x1, wall.y1);
            const p2 = toScreen(wall.x2, wall.y2);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const offsetD = (wall.thickness * scale / 2) + 20;

            if (wall.id === selectedWallId) {
                const innerOffsetX = midX + Math.sin(angle) * offsetD;
                const innerOffsetY = midY - Math.cos(angle) * offsetD;
                if (Math.hypot(mx - innerOffsetX, my - innerOffsetY) < 25) {
                    const isHorizontal = Math.abs(wall.y1 - wall.y2) < 0.01;
                    const currentLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                    setEditingDim({
                        wallId: wall.id,
                        isHorizontal,
                        currentLength: currentLen.toFixed(2)
                    });
                    setDimInputValue(currentLen.toFixed(2));
                    return;
                }

                if (Math.hypot(mx - (p2.x + 25), my - p2.y) < 15) {
                    const snapped = snapToNearbyPoint(wall.x2, wall.y2);
                    setNewWallStart(snapped);
                    setMousePos({ x: worldPos.x, y: worldPos.y, screenX: mx, screenY: my });
                    return;
                }

                if (Math.hypot(mx - p1.x, my - p1.y) < 15) {
                    setDraggedWall(wall);
                    setDragMode("resize");
                    setDraggedPoint("p1");
                    setDragStart({ worldPos });
                    return;
                }
                if (Math.hypot(mx - p2.x, my - p2.y) < 15) {
                    setDraggedWall(wall);
                    setDragMode("resize");
                    setDraggedPoint("p2");
                    setDragStart({ worldPos });
                    return;
                }
                if (Math.hypot(mx - midX, my - midY) < 20) {
                    setDraggedWall(wall);
                    setDragMode("move");
                    setDragStart({ worldPos });
                    return;
                }
            }

            const distToWall = distanceToWallLine(mx, my, wall);
            const wallThicknessInPixels = wall.thickness * scale;
            if (distToWall < wallThicknessInPixels / 2 + 5) {
                onWallSelect(wall.id);
                return;
            }
        }
        onWallSelect(null);
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (newWallStart) {
            setMousePos({ x: worldPos.x, y: worldPos.y, screenX: mx, screenY: my });
            return;
        }

        setMousePos({ x: worldPos.x, y: worldPos.y, screenX: mx, screenY: my });

        if (isPanning) {
            setOffset(o => ({ x: o.x + (mx - dragStart.x), y: o.y + (my - dragStart.y) }));
            setDragStart({ x: mx, y: my });
            return;
        }

        if (draggedWall) {
            const dx = worldPos.x - dragStart.worldPos.x;
            const dy = worldPos.y - dragStart.worldPos.y;
            onWallsChange(updateWallsStructure(walls, draggedWall, dx, dy, dragMode, draggedPoint));
            setDragStart({ ...dragStart, worldPos });
        }
    };

    const handleMouseUp = () => {
        setDraggedWall(null);
        setDragMode(null);
        setIsPanning(false);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={(e) => setScale(s => Math.max(5, s * (e.deltaY > 0 ? 0.9 : 1.1)))}
                style={{ width: '100%', height: '100%', cursor: isPanning ? "grabbing" : newWallStart ? "crosshair" : "default" }}
            />

            {editingDim && (
                <div className="dimension-popup">
                    <div className="dimension-popup-header">
                        <h3>Duvar Uzunluğu Düzenle</h3>
                        <button
                            className="dimension-popup-close"
                            onClick={() => {
                                setEditingDim(null);
                                setDimInputValue("");
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="dimension-popup-content">
                        <label>Yeni Uzunluk (metre)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimInputValue}
                            onChange={(e) => setDimInputValue(e.target.value)}
                            className="dimension-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleDimSubmit('positive');
                                }
                            }}
                        />
                        <div className="dimension-direction">
                            <label>Uzatma Yönü:</label>
                            <div className="dimension-buttons">
                                <button
                                    className="dimension-btn"
                                    onClick={() => handleDimSubmit('positive')}
                                    title={editingDim.isHorizontal ? "Sağa doğru uzat" : "Yukarı doğru uzat"}
                                >
                                    {editingDim.isHorizontal ? "→ Sağ" : "↑ Yukarı"}
                                </button>
                                <button
                                    className="dimension-btn"
                                    onClick={() => handleDimSubmit('negative')}
                                    title={editingDim.isHorizontal ? "Sola doğru uzat" : "Aşağı doğru uzat"}
                                >
                                    {editingDim.isHorizontal ? "← Sol" : "↓ Aşağı"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default WallEditor2D;