/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "./WallEditor2D.css";

const WallEditor2D = forwardRef(({
    initialData,
    walls,
    onWallsChange,
    selectedWallId,
    onWallSelect,
    activeTool,
    doors,
    windows,
    radiators,
    saveToHistory
}, ref) => {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(50);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [draggedWall, setDraggedWall] = useState(null);
    const [draggedPoint, setDraggedPoint] = useState(null);
    const [hoverWallId, setHoverWallId] = useState(null);
    const [isPanning, setIsPanning] = useState(false);

    // Dünya → Ekran
    const toScreen = (x, y) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        return {
            x: canvas.width / 2 + x * scale + offset.x,
            y: canvas.height / 2 - y * scale + offset.y
        };
    };

    // Ekran → Dünya
    const toWorld = (sx, sy) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        return {
            x: (sx - canvas.width / 2 - offset.x) / scale,
            y: (canvas.height / 2 - sy - offset.y) / scale
        };
    };

    // Ekrana sığdır
    useImperativeHandle(ref, () => ({
        fitToScreen: () => {
            if (!initialData || walls.length === 0) return;
            const canvas = canvasRef.current;
            if (!canvas) return;

            const padding = 100;
            const availableWidth = canvas.width - padding * 2;
            const availableHeight = canvas.height - padding * 2;

            const scaleX = availableWidth / initialData.width;
            const scaleY = availableHeight / initialData.depth;
            const newScale = Math.min(scaleX, scaleY, 80);

            setScale(newScale);
            setOffset({ x: 0, y: 0 });
        }
    }));

    // Canvas çizimi
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        // Arkaplan
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        drawGrid(ctx, canvas);

        // Duvarları çiz
        if (walls && walls.length > 0) {
            walls.forEach((wall) => {
                drawWall(ctx, wall, wall.id === selectedWallId, wall.id === hoverWallId);
            });
        }

        // Kapıları çiz
        if (doors && doors.length > 0) {
            doors.forEach((door) => {
                drawDoor(ctx, door);
            });
        }

        // Pencereleri çiz
        if (windows && windows.length > 0) {
            windows.forEach((window) => {
                drawWindow(ctx, window);
            });
        }

        // Radyatörleri çiz
        if (radiators && radiators.length > 0) {
            radiators.forEach((radiator) => {
                drawRadiator(ctx, radiator);
            });
        }

    }, [walls, selectedWallId, hoverWallId, scale, offset, doors, windows, radiators]);

    // Grid çizimi
    const drawGrid = (ctx, canvas) => {
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;

        const gridSize = scale;
        const centerX = canvas.width / 2 + offset.x;
        const centerY = canvas.height / 2 + offset.y;

        // Dikey çizgiler
        for (let x = centerX % gridSize; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Yatay çizgiler
        for (let y = centerY % gridSize; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Ana eksenler
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
    };

    // Duvar çizimi
    const drawWall = (ctx, wall, isSelected, isHover) => {
        const p1 = toScreen(wall.x1, wall.y1);
        const p2 = toScreen(wall.x2, wall.y2);

        ctx.strokeStyle = isSelected ? "#8b0c6f" : isHover ? "#a83895" : "#555";
        ctx.lineWidth = wall.thickness * scale;
        ctx.lineCap = "square";

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Seçili duvarda uç noktaları göster
        if (isSelected) {
            ctx.fillStyle = "#8b0c6f";
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    // Kapı çizimi
    const drawDoor = (ctx, door) => {
        const pos = toScreen(door.x, door.y);
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(pos.x - 5, pos.y - 20, 10, 40);
    };

    // Pencere çizimi
    const drawWindow = (ctx, window) => {
        const pos = toScreen(window.x, window.y);
        ctx.strokeStyle = "#4169E1";
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - 7, pos.y - 25, 14, 50);
    };

    // Radyatör çizimi
    const drawRadiator = (ctx, radiator) => {
        const pos = toScreen(radiator.x, radiator.y);
        ctx.fillStyle = "#FF6347";
        ctx.fillRect(pos.x - 15, pos.y - 10, 30, 20);
    };

    // Mouse tıklama
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

        if (activeTool === "select" && walls && walls.length > 0) {
            let clickedWall = null;
            let clickedPoint = null;

            for (const wall of walls) {
                const p1 = toScreen(wall.x1, wall.y1);
                const p2 = toScreen(wall.x2, wall.y2);

                // Uç nokta kontrolü
                if (wall.id === selectedWallId) {
                    if (Math.hypot(mx - p1.x, my - p1.y) < 12) {
                        clickedPoint = "p1";
                        clickedWall = wall;
                        break;
                    }
                    if (Math.hypot(mx - p2.x, my - p2.y) < 12) {
                        clickedPoint = "p2";
                        clickedWall = wall;
                        break;
                    }
                }

                // Duvar çizgisi kontrolü
                const dist = distanceToLine(mx, my, p1.x, p1.y, p2.x, p2.y);
                if (dist < wall.thickness * scale / 2 + 5) {
                    clickedWall = wall;
                    break;
                }
            }

            if (clickedWall) {
                onWallSelect(clickedWall.id);
                setDraggedWall(clickedWall);
                setDraggedPoint(clickedPoint);
                setDragStart({ x: mx, y: my, wx: worldPos.x, wy: worldPos.y });
                setIsDragging(true);
            } else {
                onWallSelect(null);
            }
        }
    };

    // Mouse hareket
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        // Pan modu
        if (isPanning && dragStart) {
            setOffset({
                x: offset.x + (mx - dragStart.x),
                y: offset.y + (my - dragStart.y)
            });
            setDragStart({ x: mx, y: my });
            return;
        }

        // Duvar sürükleme
        if (isDragging && draggedWall && dragStart && walls) {
            const dx = worldPos.x - dragStart.wx;
            const dy = worldPos.y - dragStart.wy;

            const updatedWalls = walls.map((wall) => {
                if (wall.id !== draggedWall.id) return wall;

                let newWall = { ...wall };

                if (draggedPoint === "p1") {
                    newWall.x1 = draggedWall.x1 + dx;
                    newWall.y1 = draggedWall.y1 + dy;
                    updateAdjacentWalls(walls, newWall, "p1", dx, dy);
                } else if (draggedPoint === "p2") {
                    newWall.x2 = draggedWall.x2 + dx;
                    newWall.y2 = draggedWall.y2 + dy;
                    updateAdjacentWalls(walls, newWall, "p2", dx, dy);
                } else {
                    newWall.x1 = draggedWall.x1 + dx;
                    newWall.y1 = draggedWall.y1 + dy;
                    newWall.x2 = draggedWall.x2 + dx;
                    newWall.y2 = draggedWall.y2 + dy;
                }

                return newWall;
            });

            onWallsChange(updatedWalls);
            return;
        }

        // Hover efekti
        if (walls && walls.length > 0) {
            let hoveredWall = null;
            for (const wall of walls) {
                const p1 = toScreen(wall.x1, wall.y1);
                const p2 = toScreen(wall.x2, wall.y2);
                const dist = distanceToLine(mx, my, p1.x, p1.y, p2.x, p2.y);

                if (dist < wall.thickness * scale / 2 + 5) {
                    hoveredWall = wall.id;
                    break;
                }
            }
            setHoverWallId(hoveredWall);
        }
    };

    // Mouse bırakma
    const handleMouseUp = () => {
        if (isDragging && saveToHistory) {
            saveToHistory({ walls, doors, windows, radiators });
        }
        setIsDragging(false);
        setIsPanning(false);
        setDraggedWall(null);
        setDraggedPoint(null);
        setDragStart(null);
    };

    // Komşu duvarları güncelle
    const updateAdjacentWalls = (allWalls, movedWall, point, dx, dy) => {
        const targetX = point === "p1" ? movedWall.x1 : movedWall.x2;
        const targetY = point === "p1" ? movedWall.y1 : movedWall.y2;
        const tolerance = 0.01;

        allWalls.forEach((wall) => {
            if (wall.id === movedWall.id) return;

            if (Math.abs(wall.x1 - (targetX - dx)) < tolerance && Math.abs(wall.y1 - (targetY - dy)) < tolerance) {
                wall.x1 = targetX;
                wall.y1 = targetY;
            }

            if (Math.abs(wall.x2 - (targetX - dx)) < tolerance && Math.abs(wall.y2 - (targetY - dy)) < tolerance) {
                wall.x2 = targetX;
                wall.y2 = targetY;
            }
        });
    };

    // Noktadan çizgiye mesafe
    const distanceToLine = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    };

    // Mouse tekerleği (zoom)
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.max(10, Math.min(prev * delta, 200)));
    };

    return (
        <canvas
            ref={canvasRef}
            className="wall-editor-2d"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? "grabbing" : "default" }}
        />
    );
});

WallEditor2D.displayName = "WallEditor2D";

export default WallEditor2D;