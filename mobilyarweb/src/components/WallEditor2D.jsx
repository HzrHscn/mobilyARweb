/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "./WallEditor2D.css";

const WallEditor2D = forwardRef(({
    initialData, walls, onWallsChange, selectedWallId, onWallSelect, activeTool, saveToHistory,
    doors, windows, radiators, texts, shapes, measurements,
    onDoorsChange, onWindowsChange, onRadiatorsChange, onTextsChange, onShapesChange, onMeasurementsChange,
    floorColor, onFloorColorChange,
    pendingElementType, onPendingElementPlaced
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
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [measureStart, setMeasureStart] = useState(null);
    const [draggedElement, setDraggedElement] = useState(null);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [isDraggingFloor, setIsDraggingFloor] = useState(false);
    const [placingElement, setPlacingElement] = useState(null);
    const [snapPreview, setSnapPreview] = useState(null);

    useImperativeHandle(ref, () => ({
        zoom: (dir) => setScale(s => Math.max(5, Math.min(s * (dir === "in" ? 1.2 : 0.8), 300))),
        fitToScreen: () => {
            if (!initialData || !canvasRef.current) return;
            const pad = 150;
            setScale(Math.min((canvasRef.current.width - pad) / initialData.width, (canvasRef.current.height - pad) / initialData.depth, 70));
            setOffset({ x: 0, y: 0 });
        }
    }));

    // pendingElementType gelince placement moduna gir
    useEffect(() => {
        if (pendingElementType) {
            const wMap = { door: 0.9, window: 1.2, radiator: 0.8 };
            setPlacingElement({ type: pendingElementType, width: wMap[pendingElementType] || 0.9 });
            setSelectedElementId(null);
            setNewWallStart(null);
        } else {
            setPlacingElement(null);
            setSnapPreview(null);
        }
    }, [pendingElementType]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
            if (e.key === 'Escape') {
                setPlacingElement(null); setSnapPreview(null); setNewWallStart(null);
                if (onPendingElementPlaced) onPendingElementPlaced();
            }
            if (e.key === 'Delete' && selectedElementId) {
                if (selectedElementId.startsWith('door-')) {
                    onDoorsChange(doors.filter(d => d.id !== selectedElementId));
                } else if (selectedElementId.startsWith('window-')) {
                    onWindowsChange(windows.filter(w => w.id !== selectedElementId));
                } else if (selectedElementId.startsWith('radiator-')) {
                    onRadiatorsChange(radiators.filter(r => r.id !== selectedElementId));
                }
                setSelectedElementId(null);
            }
            if ((e.key === 'r' || e.key === 'R') && selectedElementId && !e.ctrlKey) {
                const deg90 = Math.PI / 2;
                if (selectedElementId.startsWith('door-'))
                    onDoorsChange(doors.map(d => d.id === selectedElementId ? { ...d, rotation: (d.rotation || 0) + deg90 } : d));
                else if (selectedElementId.startsWith('window-'))
                    onWindowsChange(windows.map(w => w.id === selectedElementId ? { ...w, rotation: (w.rotation || 0) + deg90 } : w));
                else if (selectedElementId.startsWith('radiator-'))
                    onRadiatorsChange(radiators.map(r => r.id === selectedElementId ? { ...r, rotation: (r.rotation || 0) + deg90 } : r));
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedElementId, doors, windows, radiators, placingElement, onPendingElementPlaced]);

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
            if (Math.hypot(wall.x1 - x, wall.y1 - y) < tolerance) return { x: wall.x1, y: wall.y1, snapped: true };
            if (Math.hypot(wall.x2 - x, wall.y2 - y) < tolerance) return { x: wall.x2, y: wall.y2, snapped: true };
        }
        return { x, y, snapped: false };
    };

    const snapToGrid = (worldPos) => {
        if (!isShiftPressed) return worldPos;
        if (!newWallStart) return worldPos;

        const dx = Math.abs(worldPos.x - newWallStart.x);
        const dy = Math.abs(worldPos.y - newWallStart.y);

        if (dx > dy) {
            return { x: worldPos.x, y: newWallStart.y };
        } else {
            return { x: newWallStart.x, y: worldPos.y };
        }
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

    // DÜZELTME: Her duvar için doğru yön hesaplama
    const handleDimSubmit = (direction) => {
        const newValue = parseFloat(dimInputValue);
        if (isNaN(newValue) || !editingDim) return;

        const wall = walls.find(w => w.id === editingDim.wallId);
        if (!wall) return;

        const currentLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        const diff = newValue - currentLen;

        const isHorizontal = Math.abs(wall.y1 - wall.y2) < 0.01;

        let dx = 0, dy = 0;
        let targetPoint = 'p2';

        if (isHorizontal) {
            // Yatay duvar: x ekseninde uzama
            // direction: 'right' → sağa (x2 artar), 'left' → sola (x1 azalır)
            if (direction === 'right') {
                // x2 > x1 ise sağ yön p2'yi iter; x2 < x1 ise p1'i iter
                if (wall.x2 >= wall.x1) {
                    dx = diff; targetPoint = 'p2';
                } else {
                    dx = -diff; targetPoint = 'p1';
                }
            } else { // 'left'
                if (wall.x2 >= wall.x1) {
                    dx = diff; targetPoint = 'p1';
                    // p1'i sola kaydır (x azalır)
                    dx = -diff; targetPoint = 'p1';
                } else {
                    dx = diff; targetPoint = 'p2';
                }
            }
        } else {
            // Dikey duvar: y ekseninde uzama
            // direction: 'up' → yukarı (y2 artar), 'down' → aşağı (y1 azalır)
            if (direction === 'up') {
                if (wall.y2 >= wall.y1) {
                    dy = diff; targetPoint = 'p2';
                } else {
                    dy = -diff; targetPoint = 'p1';
                }
            } else { // 'down'
                if (wall.y2 >= wall.y1) {
                    dy = -diff; targetPoint = 'p1';
                } else {
                    dy = diff; targetPoint = 'p2';
                }
            }
        }

        const newWalls = updateWallsStructure(walls, wall, dx, dy, 'resize', targetPoint);
        onWallsChange(newWalls);
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

    const getOrderedWallPoints = () => {
        if (walls.length < 3) return [];

        const points = [];
        const tolerance = 0.1;

        let currentWall = walls[0];
        let currentPoint = { x: currentWall.x1, y: currentWall.y1 };
        points.push(currentPoint);

        const usedWalls = new Set([currentWall.id]);

        currentPoint = { x: currentWall.x2, y: currentWall.y2 };
        points.push(currentPoint);

        while (usedWalls.size < walls.length) {
            let found = false;

            for (const wall of walls) {
                if (usedWalls.has(wall.id)) continue;

                const dist1 = Math.hypot(wall.x1 - currentPoint.x, wall.y1 - currentPoint.y);
                const dist2 = Math.hypot(wall.x2 - currentPoint.x, wall.y2 - currentPoint.y);

                if (dist1 < tolerance) {
                    currentPoint = { x: wall.x2, y: wall.y2 };
                    points.push(currentPoint);
                    usedWalls.add(wall.id);
                    found = true;
                    break;
                } else if (dist2 < tolerance) {
                    currentPoint = { x: wall.x1, y: wall.y1 };
                    points.push(currentPoint);
                    usedWalls.add(wall.id);
                    found = true;
                    break;
                }
            }

            if (!found) break;
        }

        return points;
    };

    // Zemin merkezini hesapla
    const getFloorCenter = () => {
        if (walls.length === 0) return { x: 0, y: 0 };
        const points = getOrderedWallPoints();
        if (points.length === 0) return { x: 0, y: 0 };

        let sumX = 0, sumY = 0;
        points.forEach(p => {
            sumX += p.x;
            sumY += p.y;
        });

        return {
            x: sumX / points.length,
            y: sumY / points.length
        };
    };

    // Nokta polygon içinde mi?
    const isPointInPolygon = (px, py, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > py) !== (yj > py))
                && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.fillStyle = "#f0ece4";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gri alan (zemin) - artık renkli olabilir
        const orderedPoints = getOrderedWallPoints();
        if (orderedPoints.length >= 3) {
            ctx.fillStyle = floorColor || "#d4b896";
            ctx.beginPath();
            orderedPoints.forEach((point, i) => {
                const p = toScreen(point.x, point.y);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();

            // Zemin merkezi kontrol noktası (sürüklemek için)
            const center = getFloorCenter();
            const cp = toScreen(center.x, center.y);
            ctx.fillStyle = "rgba(139, 12, 111, 0.5)";
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Duvarlar - renklenebilir
        walls.forEach(wall => {
            const p1 = toScreen(wall.x1, wall.y1);
            const p2 = toScreen(wall.x2, wall.y2);
            const isSel = wall.id === selectedWallId;

            ctx.strokeStyle = wall.color || (isSel ? "#8b0c6f" : "#444");
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

                // DÜZELTME: Ölçü pozisyonları - İÇ taraf kısa (net), DIŞ taraf uzun (kalınlık dahil)
                // YENİ:
                const wallThicknessPx = wall.thickness * scale / 2;
                const textOffset = 28; // mesafeyi artır

                ctx.font = "bold 13px Arial"; // yazı büyüdü
                ctx.textAlign = "center";

                // İÇ ölçü: duvarın net uzunluğu (örn: 6.00m)
                const innerOffsetX = midX + Math.sin(angle) * (wallThicknessPx + textOffset);
                const innerOffsetY = midY - Math.cos(angle) * (wallThicknessPx + textOffset);
                ctx.fillStyle = "#000";
                ctx.fillText(`${len.toFixed(2)}m`, innerOffsetX, innerOffsetY);

                // DIŞ ölçü: kalınlık dahil toplam (örn: 6.48m)
                const outerOffsetX = midX - Math.sin(angle) * (wallThicknessPx + textOffset + 10);
                const outerOffsetY = midY + Math.cos(angle) * (wallThicknessPx + textOffset + 10);
                ctx.fillStyle = "#777";
                ctx.fillText(`${(len + wall.thickness * 2).toFixed(2)}m`, outerOffsetX, outerOffsetY);

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

        // ── Kapılar: mimari plan çizimi (yay + kanat)
        doors.forEach(door => {
            const p = toScreen(door.x, door.y);
            const isSelected = door.id === selectedElementId;
            const w = (door.width || 0.9) * scale;
            // Duvar kalınlığı hesapla
            const dw = door.wallId ? (walls.find(wl => wl.id === door.wallId)?.thickness || 0.24) : 0.24;
            const th = dw * scale;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(door.rotation || 0);

            // Duvar açıklığını zemin rengiyle temizle
            ctx.fillStyle = floorColor || "#d4b896";
            ctx.fillRect(-2, -th / 2, w + 4, th);

            // Kapı çerçeve çizgileri
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#333";
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, -th / 2 + 1); ctx.lineTo(w, -th / 2 + 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, th / 2 - 1); ctx.lineTo(w, th / 2 - 1); ctx.stroke();

            // Kapı kanadı yay (açık kapı mimari gösterimi)
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#555";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI / 2); ctx.stroke();
            ctx.setLineDash([]);

            // Kapı kanadı çizgisi
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#333";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, w); ctx.stroke();

            // Seçim halkası
            if (isSelected) {
                ctx.strokeStyle = "#8b0c6f";
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(-4, -th / 2 - 4, w + 8, th + 8);
                ctx.setLineDash([]);
                // Döndür butonu
                ctx.fillStyle = "#8b0c6f";
                ctx.beginPath(); ctx.arc(w / 2, -th / 2 - 12, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
                ctx.fillText("↻", w / 2, -th / 2 - 9);
            }
            ctx.restore();
        });

        // ── Pencereler: mimari plan çizimi (3 çizgi + cam)
        windows.forEach(win => {
            const p = toScreen(win.x, win.y);
            const isSelected = win.id === selectedElementId;
            const w = (win.width || 1.2) * scale;
            const dw = win.wallId ? (walls.find(wl => wl.id === win.wallId)?.thickness || 0.24) : 0.24;
            const th = dw * scale;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(win.rotation || 0);

            // Pencere alanı zemin rengi
            ctx.fillStyle = floorColor || "#d4b896";
            ctx.fillRect(-w / 2 - 2, -th / 2, w + 4, th);

            // Cam dolgusu
            ctx.fillStyle = "rgba(135,206,235,0.35)";
            ctx.fillRect(-w / 2, -th / 2 + 1, w, th - 2);

            // Çerçeve çizgileri
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#1a6aaa";
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.beginPath(); ctx.moveTo(-w / 2, -th / 2); ctx.lineTo(w / 2, -th / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-w / 2, th / 2); ctx.lineTo(w / 2, th / 2); ctx.stroke();

            // Orta cam çizgisi
            ctx.strokeStyle = isSelected ? "#cc44ff" : "#5599cc";
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();

            // Yan çerçeveler
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#1a6aaa";
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-w / 2, -th / 2); ctx.lineTo(-w / 2, th / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w / 2, -th / 2); ctx.lineTo(w / 2, th / 2); ctx.stroke();

            if (isSelected) {
                ctx.fillStyle = "#8b0c6f";
                ctx.beginPath(); ctx.arc(0, -th / 2 - 12, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
                ctx.fillText("↻", 0, -th / 2 - 9);
            }
            ctx.restore();
        });

        // ── Radyatörler: dilimli dikdörtgen
        radiators.forEach(rad => {
            const p = toScreen(rad.x, rad.y);
            const isSelected = rad.id === selectedElementId;
            const w = (rad.width || 0.8) * scale;
            const h = 0.12 * scale;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(rad.rotation || 0);

            ctx.fillStyle = isSelected ? "#ffe8e0" : "#f5ddd0";
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#993300";
            ctx.lineWidth = 1.5;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);

            const slices = Math.max(2, Math.floor((rad.width || 0.8) / 0.06));
            ctx.strokeStyle = isSelected ? "#cc44ff" : "#bb5500";
            ctx.lineWidth = 0.8;
            for (let i = 1; i < slices; i++) {
                const sx = -w / 2 + (w / slices) * i;
                ctx.beginPath(); ctx.moveTo(sx, -h / 2); ctx.lineTo(sx, h / 2); ctx.stroke();
            }
            if (isSelected) {
                ctx.fillStyle = "#8b0c6f";
                ctx.beginPath(); ctx.arc(0, -h / 2 - 12, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
                ctx.fillText("↻", 0, -h / 2 - 9);
            }
            ctx.restore();
        });

        // Ölçüler
        measurements.forEach(measure => {
            const p1 = toScreen(measure.x1, measure.y1);
            const p2 = toScreen(measure.x2, measure.y2);
            const len = Math.hypot(measure.x2 - measure.x1, measure.y2 - measure.y1);

            ctx.strokeStyle = "#0066cc";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#0066cc";
            ctx.font = "bold 11px Arial";
            ctx.fillText(`${len.toFixed(2)} m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        });

        // Yeni duvar preview
        if (newWallStart && mousePos) {
            const p1 = toScreen(newWallStart.x, newWallStart.y);
            const snappedPos = snapToGrid(mousePos);
            const p2 = toScreen(snappedPos.x, snappedPos.y);
            const len = Math.hypot(snappedPos.x - newWallStart.x, snappedPos.y - newWallStart.y);

            ctx.strokeStyle = "#8b0c6f";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#000";
            ctx.font = "bold 12px Arial";
            ctx.fillText(`${len.toFixed(2)} m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);

            if (isShiftPressed) {
                ctx.fillStyle = "#00ff00";
                ctx.font = "bold 10px Arial";
                ctx.fillText("SHIFT: 90°", (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 15);
            }
        }

        // Ölçü aracı preview
        if (activeTool === 'measure' && measureStart && mousePos) {
            const p1 = toScreen(measureStart.x, measureStart.y);
            const p2 = toScreen(mousePos.x, mousePos.y);
            const len = Math.hypot(mousePos.x - measureStart.x, mousePos.y - measureStart.y);

            ctx.strokeStyle = "#0066cc";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#0066cc";
            ctx.fillText(`${len.toFixed(2)} m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        }

        // Snap göstergeleri
        if (mousePos && newWallStart) {
            const snapResult = snapToNearbyPoint(mousePos.x, mousePos.y);
            if (snapResult.snapped) {
                const sp = toScreen(snapResult.x, snapResult.y);
                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Placement önizlemesi
        if (placingElement && mousePos) {
            if (snapPreview) {
                const sp = toScreen(snapPreview.x, snapPreview.y);
                const w = placingElement.width * scale;
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.rotate(snapPreview.rotation || 0);
                ctx.globalAlpha = 0.65;
                if (placingElement.type === 'door') {
                    ctx.strokeStyle = "#8b0c6f"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.stroke();
                    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI / 2); ctx.stroke(); ctx.setLineDash([]);
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, w); ctx.stroke();
                } else if (placingElement.type === 'window') {
                    ctx.fillStyle = "rgba(135,206,235,0.4)"; ctx.fillRect(-w / 2, -6, w, 12);
                    ctx.strokeStyle = "#1a6aaa"; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -6, w, 12);
                } else if (placingElement.type === 'radiator') {
                    ctx.fillStyle = "rgba(245,200,180,0.7)"; ctx.fillRect(-w / 2, -5, w, 10);
                    ctx.strokeStyle = "#993300"; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -5, w, 10);
                }
                ctx.globalAlpha = 1; ctx.restore();
                ctx.strokeStyle = "#00cc44"; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2); ctx.stroke();
            } else {
                const mp = toScreen(mousePos.x, mousePos.y);
                ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.fillRect(mp.x - 80, mp.y - 28, 160, 20);
                ctx.fillStyle = "#8b0c6f"; ctx.font = "12px Arial"; ctx.textAlign = "center";
                ctx.fillText("Duvara yaklaşın →", mp.x, mp.y - 14);
            }
        }
    }, [walls, scale, offset, selectedWallId, newWallStart, mousePos, isShiftPressed, activeTool, measureStart, doors, windows, radiators, selectedElementId, measurements, floorColor, placingElement, snapPreview]);

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

        // Placement modu: duvara eleman yerleştir
        if (placingElement) {
            if (snapPreview) {
                const newEl = {
                    id: `${placingElement.type}-${Date.now()}`,
                    x: snapPreview.x,
                    y: snapPreview.y,
                    rotation: snapPreview.rotation || 0,
                    wallId: snapPreview.wallId,
                    width: placingElement.type === 'door' ? 0.9 : placingElement.type === 'window' ? 1.2 : 0.8
                };
                if (placingElement.type === 'door') onDoorsChange([...doors, newEl]);
                else if (placingElement.type === 'window') onWindowsChange([...windows, newEl]);
                else if (placingElement.type === 'radiator') onRadiatorsChange([...radiators, newEl]);
                setPlacingElement(null); setSnapPreview(null);
                if (onPendingElementPlaced) onPendingElementPlaced();
            }
            return;
        }

        // Ölçü aracı
        if (activeTool === 'measure') {
            if (!measureStart) {
                setMeasureStart(worldPos);
            } else {
                const newMeasure = {
                    id: `measure-${Date.now()}`,
                    x1: measureStart.x,
                    y1: measureStart.y,
                    x2: worldPos.x,
                    y2: worldPos.y
                };
                if (onMeasurementsChange) {
                    onMeasurementsChange([...measurements, newMeasure]);
                }
                setMeasureStart(null);
            }
            return;
        }

        // Eleman sürükleme kontrolü
        for (const door of doors) {
            const p = toScreen(door.x, door.y);
            if (Math.hypot(mx - p.x, my - p.y) < 30) {
                setDraggedElement({ type: 'door', data: door });
                setSelectedElementId(door.id);
                setDragStart({ worldPos });
                return;
            }
        }

        for (const window of windows) {
            const p = toScreen(window.x, window.y);
            if (Math.hypot(mx - p.x, my - p.y) < 30) {
                setDraggedElement({ type: 'window', data: window });
                setSelectedElementId(window.id);
                setDragStart({ worldPos });
                return;
            }
        }

        for (const radiator of radiators) {
            const p = toScreen(radiator.x, radiator.y);
            if (Math.hypot(mx - p.x, my - p.y) < 30) {
                setDraggedElement({ type: 'radiator', data: radiator });
                setSelectedElementId(radiator.id);
                setDragStart({ worldPos });
                return;
            }
        }

        // Zemin sürükleme
        const floorCenter = getFloorCenter();
        const fcp = toScreen(floorCenter.x, floorCenter.y);
        if (Math.hypot(mx - fcp.x, my - fcp.y) < 15) {
            setIsDraggingFloor(true);
            setDragStart({ worldPos });
            return;
        }

        if (newWallStart) {
            const snappedPos = snapToGrid(worldPos);
            const finalSnap = snapToNearbyPoint(snappedPos.x, snappedPos.y);

            const newWall = {
                id: `wall-${Date.now()}`,
                x1: newWallStart.x,
                y1: newWallStart.y,
                x2: finalSnap.x,
                y2: finalSnap.y,
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
            const wallThicknessPx = wall.thickness * scale / 2;
            const textOffset = 28;

            if (wall.id === selectedWallId) {
                const innerOffsetX = midX + Math.sin(angle) * (wallThicknessPx + textOffset);
                const innerOffsetY = midY - Math.cos(angle) * (wallThicknessPx + textOffset);

                if (Math.hypot(mx - innerOffsetX, my - innerOffsetY) < 40) {
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
            if (selectedWallId) {
                const selWall = walls.find(w => w.id === selectedWallId);
                if (selWall) {
                    const sp1 = toScreen(selWall.x1, selWall.y1);
                    const sp2 = toScreen(selWall.x2, selWall.y2);
                    if (Math.hypot(mx - sp1.x, my - sp1.y) < 20 || Math.hypot(mx - sp2.x, my - sp2.y) < 20) {
                        continue; // köşe noktasına tıklandıysa duvar değiştirme
                    }
                }
            }
            if (distToWall < wallThicknessInPixels / 2 + 5) {
                onWallSelect(wall.id);
                setSelectedElementId(null);
                return;
            }
        }
        onWallSelect(null);
        setSelectedElementId(null);
    };

    // Duvara en yakın noktayı bul (placement snap için)
    const findNearestWallSnap = (wx, wy, maxDist = 1.5) => {
        let best = null, bestDist = maxDist;
        for (const wall of walls) {
            const dx = wall.x2 - wall.x1, dy = wall.y2 - wall.y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq < 0.001) continue;
            let t = ((wx - wall.x1) * dx + (wy - wall.y1) * dy) / lenSq;
            t = Math.max(0.05, Math.min(0.95, t));
            const cx = wall.x1 + t * dx, cy = wall.y1 + t * dy;
            const dist = Math.hypot(wx - cx, wy - cy);
            if (dist < bestDist) { best = { x: cx, y: cy, t, wallId: wall.id, rotation: Math.atan2(dy, dx) }; bestDist = dist; }
        }
        return best;
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (newWallStart || activeTool === 'measure') {
            setMousePos({ x: worldPos.x, y: worldPos.y, screenX: mx, screenY: my });
        }

        // Placement modu: snap preview güncelle
        if (placingElement) {
            setMousePos({ x: worldPos.x, y: worldPos.y });
            const snap = findNearestWallSnap(worldPos.x, worldPos.y);
            setSnapPreview(snap || null);
            return;
        }

        if (isPanning) {
            setOffset(o => ({ x: o.x + (mx - dragStart.x), y: o.y + (my - dragStart.y) }));
            setDragStart({ x: mx, y: my });
            return;
        }

        // Zemin sürükleme
        if (isDraggingFloor) {
            const dx = worldPos.x - dragStart.worldPos.x;
            const dy = worldPos.y - dragStart.worldPos.y;

            const newWalls = walls.map(w => ({
                ...w,
                x1: w.x1 + dx,
                y1: w.y1 + dy,
                x2: w.x2 + dx,
                y2: w.y2 + dy
            }));

            onWallsChange(newWalls);
            setDragStart({ worldPos });
            return;
        }

        // Eleman sürükleme - duvara snap ile
        if (draggedElement) {
            const { type, data } = draggedElement;
            const snap = findNearestWallSnap(worldPos.x, worldPos.y);
            const nx = snap ? snap.x : worldPos.x;
            const ny = snap ? snap.y : worldPos.y;
            const nr = snap ? snap.rotation : (data.rotation || 0);
            const nwId = snap ? snap.wallId : data.wallId;

            if (type === 'door') {
                onDoorsChange(doors.map(d => d.id === data.id ? { ...d, x: nx, y: ny, rotation: nr, wallId: nwId } : d));
            } else if (type === 'window') {
                onWindowsChange(windows.map(w => w.id === data.id ? { ...w, x: nx, y: ny, rotation: nr, wallId: nwId } : w));
            } else if (type === 'radiator') {
                onRadiatorsChange(radiators.map(r => r.id === data.id ? { ...r, x: nx, y: ny, rotation: nr, wallId: nwId } : r));
            }
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
        setDraggedElement(null);
        setIsDraggingFloor(false);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={(e) => setScale(s => Math.max(5, s * (e.deltaY > 0 ? 0.9 : 1.1)))}
                style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : placingElement ? (snapPreview ? 'crosshair' : 'cell') : newWallStart ? 'crosshair' : activeTool === 'measure' ? 'crosshair' : 'default' }}
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
                                {editingDim.isHorizontal ? (
                                    <>
                                        <button className="dimension-btn" onClick={() => handleDimSubmit('right')}>→ Sağa</button>
                                        <button className="dimension-btn" onClick={() => handleDimSubmit('left')}>← Sola</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="dimension-btn" onClick={() => handleDimSubmit('up')}>↑ Yukarı</button>
                                        <button className="dimension-btn" onClick={() => handleDimSubmit('down')}>↓ Aşağı</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isShiftPressed && newWallStart && (
                <div className="shift-indicator">SHIFT: 90° Snap Aktif</div>
            )}

            {placingElement && (
                <div className="placement-banner">
                    <span className="placement-icon">{placingElement.type === 'door' ? '🚪' : placingElement.type === 'window' ? '🪟' : '🔥'}</span>
                    <span>{snapPreview ? 'Duvara tıklayın' : 'Duvara yaklaşın...'}</span>
                    <kbd>ESC</kbd><span>iptal</span>
                </div>
            )}

            {selectedElementId && (
                <div className="element-toolbar">
                    <span className="el-toolbar-label">Döndür:</span>
                    <button className="el-tool-btn" onClick={() => {
                        const r = -Math.PI / 4;
                        if (selectedElementId.startsWith('door-')) onDoorsChange(doors.map(d => d.id === selectedElementId ? { ...d, rotation: (d.rotation || 0) + r } : d));
                        else if (selectedElementId.startsWith('window-')) onWindowsChange(windows.map(w => w.id === selectedElementId ? { ...w, rotation: (w.rotation || 0) + r } : w));
                        else if (selectedElementId.startsWith('radiator-')) onRadiatorsChange(radiators.map(r2 => r2.id === selectedElementId ? { ...r2, rotation: (r2.rotation || 0) + r } : r2));
                    }}>↺ 45°</button>
                    <button className="el-tool-btn accent" onClick={() => {
                        const r = Math.PI / 2;
                        if (selectedElementId.startsWith('door-')) onDoorsChange(doors.map(d => d.id === selectedElementId ? { ...d, rotation: (d.rotation || 0) + r } : d));
                        else if (selectedElementId.startsWith('window-')) onWindowsChange(windows.map(w => w.id === selectedElementId ? { ...w, rotation: (w.rotation || 0) + r } : w));
                        else if (selectedElementId.startsWith('radiator-')) onRadiatorsChange(radiators.map(r2 => r2.id === selectedElementId ? { ...r2, rotation: (r2.rotation || 0) + r } : r2));
                    }}>↻ 90°</button>
                    <div className="el-toolbar-divider"></div>
                    <button className="el-tool-btn danger" onClick={() => {
                        if (selectedElementId.startsWith('door-')) onDoorsChange(doors.filter(d => d.id !== selectedElementId));
                        else if (selectedElementId.startsWith('window-')) onWindowsChange(windows.filter(w => w.id !== selectedElementId));
                        else if (selectedElementId.startsWith('radiator-')) onRadiatorsChange(radiators.filter(r => r.id !== selectedElementId));
                        setSelectedElementId(null);
                    }}>🗑 Sil</button>
                </div>
            )}
        </div>
    );
});

export default WallEditor2D;