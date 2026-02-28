/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import "./WallEditor2D.css";

const projectPointOnWall = (px, py, wall) => {
    const dx = wall.x2 - wall.x1, dy = wall.y2 - wall.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return { x: wall.x1, y: wall.y1, t: 0, dist: Math.hypot(px - wall.x1, py - wall.y1) };
    let t = ((px - wall.x1) * dx + (py - wall.y1) * dy) / lenSq;
    t = Math.max(0.08, Math.min(0.92, t));
    const cx = wall.x1 + t * dx, cy = wall.y1 + t * dy;
    return { x: cx, y: cy, t, dist: Math.hypot(px - cx, py - cy) };
};

const findNearestWall = (wx, wy, walls, maxDist = 1.5) => {
    let best = null, bestDist = maxDist;
    for (const wall of walls) {
        const proj = projectPointOnWall(wx, wy, wall);
        if (proj.dist < bestDist) { best = { wall, ...proj }; bestDist = proj.dist; }
    }
    return best;
};

const wallAngle = (wall) => Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

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

    useEffect(() => {
        if (pendingElementType) {
            const widthMap = { door: 0.9, window: 1.2, radiator: 0.8 };
            setPlacingElement({ type: pendingElementType, width: widthMap[pendingElementType] || 0.9 });
            setSelectedElementId(null);
        } else {
            setPlacingElement(null);
            setSnapPreview(null);
        }
    }, [pendingElementType]);

    const rotateSelectedElement = useCallback((deg) => {
        const rad = (deg * Math.PI) / 180;
        if (selectedElementId?.startsWith('door-')) onDoorsChange(doors.map(d => d.id === selectedElementId ? { ...d, rotation: (d.rotation || 0) + rad } : d));
        else if (selectedElementId?.startsWith('window-')) onWindowsChange(windows.map(w => w.id === selectedElementId ? { ...w, rotation: (w.rotation || 0) + rad } : w));
        else if (selectedElementId?.startsWith('radiator-')) onRadiatorsChange(radiators.map(r => r.id === selectedElementId ? { ...r, rotation: (r.rotation || 0) + rad } : r));
    }, [selectedElementId, doors, windows, radiators, onDoorsChange, onWindowsChange, onRadiatorsChange]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
            if (e.key === 'Escape') { setPlacingElement(null); setSnapPreview(null); setNewWallStart(null); if (onPendingElementPlaced) onPendingElementPlaced(); }
            if (e.key === 'Delete' && selectedElementId) {
                if (selectedElementId.startsWith('door-')) onDoorsChange(doors.filter(d => d.id !== selectedElementId));
                else if (selectedElementId.startsWith('window-')) onWindowsChange(windows.filter(w => w.id !== selectedElementId));
                else if (selectedElementId.startsWith('radiator-')) onRadiatorsChange(radiators.filter(r => r.id !== selectedElementId));
                setSelectedElementId(null);
            }
            if ((e.key === 'r' || e.key === 'R') && selectedElementId && !e.ctrlKey) rotateSelectedElement(90);
        };
        const handleKeyUp = (e) => { if (e.key === 'Shift') setIsShiftPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [selectedElementId, doors, windows, radiators, placingElement, rotateSelectedElement]);

    const toScreen = useCallback((x, y) => ({
        x: canvasRef.current.width / 2 + x * scale + offset.x,
        y: canvasRef.current.height / 2 - y * scale + offset.y
    }), [scale, offset]);

    const toWorld = useCallback((sx, sy) => ({
        x: (sx - canvasRef.current.width / 2 - offset.x) / scale,
        y: (canvasRef.current.height / 2 - sy - offset.y) / scale
    }), [scale, offset]);

    const snapToNearbyPoint = (x, y, tolerance = 0.3) => {
        for (const wall of walls) {
            if (Math.hypot(wall.x1 - x, wall.y1 - y) < tolerance) return { x: wall.x1, y: wall.y1, snapped: true };
            if (Math.hypot(wall.x2 - x, wall.y2 - y) < tolerance) return { x: wall.x2, y: wall.y2, snapped: true };
        }
        return { x, y, snapped: false };
    };

    const snapToGrid = (worldPos) => {
        if (!isShiftPressed || !newWallStart) return worldPos;
        const dx = Math.abs(worldPos.x - newWallStart.x), dy = Math.abs(worldPos.y - newWallStart.y);
        return dx > dy ? { x: worldPos.x, y: newWallStart.y } : { x: newWallStart.x, y: worldPos.y };
    };

    const updateWallsStructure = (currentWalls, movedWall, dx, dy, mode, point) => {
        const tolerance = 0.1;
        const updatedWalls = currentWalls.map(w => ({ ...w }));
        const movedIndex = updatedWalls.findIndex(w => w.id === movedWall.id);
        if (movedIndex === -1) return currentWalls;
        const wall = updatedWalls[movedIndex];
        const oldX1 = wall.x1, oldY1 = wall.y1, oldX2 = wall.x2, oldY2 = wall.y2;
        if (mode === 'move') {
            const isHor = Math.abs(wall.y1 - wall.y2) < 0.01;
            if (isHor) { wall.y1 += dy; wall.y2 += dy; } else { wall.x1 += dx; wall.x2 += dx; }
        } else if (mode === 'resize') {
            if (point === 'p1') { wall.x1 += dx; wall.y1 += dy; } else { wall.x2 += dx; wall.y2 += dy; }
        }
        updatedWalls.forEach((w, idx) => {
            if (idx === movedIndex) return;
            if (Math.abs(w.x1 - oldX1) < tolerance && Math.abs(w.y1 - oldY1) < tolerance) { w.x1 = wall.x1; w.y1 = wall.y1; }
            if (Math.abs(w.x1 - oldX2) < tolerance && Math.abs(w.y1 - oldY2) < tolerance) { w.x1 = wall.x2; w.y1 = wall.y2; }
            if (Math.abs(w.x2 - oldX1) < tolerance && Math.abs(w.y2 - oldY1) < tolerance) { w.x2 = wall.x1; w.y2 = wall.y1; }
            if (Math.abs(w.x2 - oldX2) < tolerance && Math.abs(w.y2 - oldY2) < tolerance) { w.x2 = wall.x2; w.y2 = wall.y2; }
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
        let dx = 0, dy = 0, targetPoint = 'p2';
        if (isHorizontal) {
            if (direction === 'right') { dx = wall.x2 >= wall.x1 ? diff : -diff; targetPoint = wall.x2 >= wall.x1 ? 'p2' : 'p1'; }
            else { dx = wall.x2 >= wall.x1 ? -diff : diff; targetPoint = wall.x2 >= wall.x1 ? 'p1' : 'p2'; }
        } else {
            if (direction === 'up') { dy = wall.y2 >= wall.y1 ? diff : -diff; targetPoint = wall.y2 >= wall.y1 ? 'p2' : 'p1'; }
            else { dy = wall.y2 >= wall.y1 ? -diff : diff; targetPoint = wall.y2 >= wall.y1 ? 'p1' : 'p2'; }
        }
        onWallsChange(updateWallsStructure(walls, wall, dx, dy, 'resize', targetPoint));
        setEditingDim(null); setDimInputValue("");
    };

    const getConnectedWalls = (wall) => {
        const t = 0.1;
        return walls.filter(w => w.id !== wall.id && (
            Math.hypot(w.x1 - wall.x1, w.y1 - wall.y1) < t || Math.hypot(w.x1 - wall.x2, w.y1 - wall.y2) < t ||
            Math.hypot(w.x2 - wall.x1, w.y2 - wall.y1) < t || Math.hypot(w.x2 - wall.x2, w.y2 - wall.y2) < t
        ));
    };

    const distanceToWallLine = (px, py, wall) => {
        const p1 = toScreen(wall.x1, wall.y1), p2 = toScreen(wall.x2, wall.y2);
        const A = px - p1.x, B = py - p1.y, C = p2.x - p1.x, D = p2.y - p1.y;
        const dot = A * C + B * D, lenSq = C * C + D * D;
        const param = lenSq !== 0 ? Math.max(0, Math.min(1, dot / lenSq)) : 0;
        const xx = p1.x + param * C, yy = p1.y + param * D;
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    };

    const getOrderedWallPoints = () => {
        if (walls.length < 3) return [];
        const points = [], tolerance = 0.1;
        let cw = walls[0];
        points.push({ x: cw.x1, y: cw.y1 });
        let cp = { x: cw.x2, y: cw.y2 };
        points.push(cp);
        const used = new Set([cw.id]);
        while (used.size < walls.length) {
            let found = false;
            for (const wall of walls) {
                if (used.has(wall.id)) continue;
                if (Math.hypot(wall.x1 - cp.x, wall.y1 - cp.y) < tolerance) { cp = { x: wall.x2, y: wall.y2 }; points.push(cp); used.add(wall.id); found = true; break; }
                else if (Math.hypot(wall.x2 - cp.x, wall.y2 - cp.y) < tolerance) { cp = { x: wall.x1, y: wall.y1 }; points.push(cp); used.add(wall.id); found = true; break; }
            }
            if (!found) break;
        }
        return points;
    };

    const getFloorCenter = () => {
        const pts = getOrderedWallPoints();
        if (!pts.length) { if (!walls.length) return { x: 0, y: 0 }; return { x: walls.reduce((s, w) => s + w.x1 + w.x2, 0) / (walls.length * 2), y: walls.reduce((s, w) => s + w.y1 + w.y2, 0) / (walls.length * 2) }; }
        return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
    };

    // 2D Kapı çizimi - mimari plan gösterimi
    const drawDoor2D = (ctx, door, isSelected) => {
        const p = toScreen(door.x, door.y);
        const w = (door.width || 0.9) * scale;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(door.rotation || 0);

        // Duvar boşluğu temizleme (beyaz kesme etkisi)
        ctx.fillStyle = floorColor || "#d4b896";
        ctx.fillRect(-2, -wall_thick_px(door) / 2, w + 4, wall_thick_px(door));

        // Kapı çerçeve çizgisi
        ctx.strokeStyle = isSelected ? "#8b0c6f" : "#222";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(w, -2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(w, 2); ctx.stroke();

        // Kapı kanadı yay (açık kapı gösterimi)
        ctx.strokeStyle = isSelected ? "#8b0c6f" : "#444";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI / 2); ctx.stroke();
        ctx.setLineDash([]);

        // Kapı kanadı
        ctx.strokeStyle = isSelected ? "#8b0c6f" : "#222";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, w); ctx.stroke();

        if (isSelected) {
            ctx.fillStyle = "#8b0c6f";
            ctx.beginPath(); ctx.arc(w / 2, -14, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
            ctx.fillText("↻", w / 2, -11);
        }
        ctx.restore();
    };

    const wall_thick_px = (el) => {
        if (!el.wallId) return 12;
        const w = walls.find(w => w.id === el.wallId);
        return w ? w.thickness * scale + 4 : 16;
    };

    // 2D Pencere çizimi
    const drawWindow2D = (ctx, win, isSelected) => {
        const p = toScreen(win.x, win.y);
        const w = (win.width || 1.2) * scale;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(win.rotation || 0);

        // Duvar boşluğu
        ctx.fillStyle = floorColor || "#d4b896";
        ctx.fillRect(-w / 2 - 2, -wall_thick_px(win) / 2, w + 4, wall_thick_px(win));

        // Pencere cam (açık mavi)
        ctx.fillStyle = "rgba(135, 206, 235, 0.4)";
        ctx.fillRect(-w / 2, -5, w, 10);

        // Pencere çerçeve çizgileri
        ctx.strokeStyle = isSelected ? "#8b0c6f" : "#1a5f9e";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(-w / 2, -5); ctx.lineTo(w / 2, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-w / 2, 5); ctx.lineTo(w / 2, 5); ctx.stroke();
        // Yan çizgiler
        ctx.beginPath(); ctx.moveTo(-w / 2, -5); ctx.lineTo(-w / 2, 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w / 2, -5); ctx.lineTo(w / 2, 5); ctx.stroke();
        // Orta çizgi
        ctx.strokeStyle = isSelected ? "#cc44cc" : "#5599cc";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();

        if (isSelected) {
            ctx.fillStyle = "#8b0c6f";
            ctx.beginPath(); ctx.arc(0, -16, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
            ctx.fillText("↻", 0, -13);
        }
        ctx.restore();
    };

    // 2D Radyatör çizimi
    const drawRadiator2D = (ctx, rad, isSelected) => {
        const p = toScreen(rad.x, rad.y);
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
        ctx.strokeStyle = isSelected ? "#cc44cc" : "#bb5500";
        ctx.lineWidth = 0.8;
        for (let i = 1; i < slices; i++) {
            const sx = -w / 2 + (w / slices) * i;
            ctx.beginPath(); ctx.moveTo(sx, -h / 2); ctx.lineTo(sx, h / 2); ctx.stroke();
        }

        if (isSelected) {
            ctx.fillStyle = "#8b0c6f";
            ctx.beginPath(); ctx.arc(0, -h / 2 - 10, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 9px Arial"; ctx.textAlign = "center";
            ctx.fillText("↻", 0, -h / 2 - 7);
        }
        ctx.restore();
    };

    // ── Ana çizim döngüsü
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.fillStyle = "#f0ece4";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const orderedPoints = getOrderedWallPoints();
        if (orderedPoints.length >= 3) {
            ctx.fillStyle = floorColor || "#d4b896";
            ctx.beginPath();
            orderedPoints.forEach((pt, i) => { const p = toScreen(pt.x, pt.y); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.closePath(); ctx.fill();

            const center = getFloorCenter();
            const cp = toScreen(center.x, center.y);
            ctx.fillStyle = "rgba(139, 12, 111, 0.35)";
            ctx.beginPath(); ctx.arc(cp.x, cp.y, 7, 0, Math.PI * 2); ctx.fill();
        }

        // ── Duvarlar
        walls.forEach(wall => {
            const p1 = toScreen(wall.x1, wall.y1), p2 = toScreen(wall.x2, wall.y2);
            const isSel = wall.id === selectedWallId;
            ctx.strokeStyle = wall.color || (isSel ? "#8b0c6f" : "#555");
            ctx.lineWidth = wall.thickness * scale;
            ctx.lineCap = "square";
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

            if (isSel) {
                const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const twPx = wall.thickness * scale / 2, tOff = 30;

                ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
                // Dış ölçü
                const ox = midX - Math.sin(angle) * (twPx + tOff + 8), oy = midY + Math.cos(angle) * (twPx + tOff + 8);
                ctx.fillStyle = "#555"; ctx.fillText(`${(len + wall.thickness * 2).toFixed(2)}m`, ox, oy);
                // İç ölçü
                const ix = midX + Math.sin(angle) * (twPx + tOff), iy = midY - Math.cos(angle) * (twPx + tOff);
                ctx.fillStyle = "#111"; ctx.fillText(`${len.toFixed(2)}m`, ix, iy);

                getConnectedWalls(wall).forEach(w => {
                    const wp1 = toScreen(w.x1, w.y1), wp2 = toScreen(w.x2, w.y2);
                    ctx.fillStyle = "#999"; ctx.font = "11px Arial";
                    ctx.fillText(`${Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2)}m`, (wp1.x + wp2.x) / 2, (wp1.y + wp2.y) / 2 - 13);
                });

                // Kontrol noktaları
                [p1, p2].forEach(p => {
                    ctx.fillStyle = "#ff00ff"; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.stroke();
                });
                ctx.fillStyle = "#8b0c6f"; ctx.beginPath(); ctx.arc(midX, midY, 9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center"; ctx.fillText("↔", midX, midY + 4);

                // + butonu
                ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(p2.x + 22, p2.y, 9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.fillText("+", p2.x + 22, p2.y + 5);
            }
        });

        // Mimari elemanlar
        doors.forEach(door => drawDoor2D(ctx, door, door.id === selectedElementId));
        windows.forEach(win => drawWindow2D(ctx, win, win.id === selectedElementId));
        radiators.forEach(rad => drawRadiator2D(ctx, rad, rad.id === selectedElementId));

        // Ölçümler
        measurements.forEach(m => {
            const p1 = toScreen(m.x1, m.y1), p2 = toScreen(m.x2, m.y2);
            const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
            ctx.strokeStyle = "#0066cc"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect((p1.x + p2.x) / 2 - 22, (p1.y + p2.y) / 2 - 20, 44, 14);
            ctx.fillStyle = "#0066cc"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
            ctx.fillText(`${len.toFixed(2)}m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        });

        // Yeni duvar önizleme
        if (newWallStart && mousePos) {
            const p1 = toScreen(newWallStart.x, newWallStart.y);
            const snappedPos = snapToGrid(mousePos);
            const p2 = toScreen(snappedPos.x, snappedPos.y);
            const len = Math.hypot(snappedPos.x - newWallStart.x, snappedPos.y - newWallStart.y);
            ctx.strokeStyle = "#8b0c6f"; ctx.lineWidth = (initialData?.wallThickness || 0.24) * scale;
            ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "#8b0c6f"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
            ctx.fillText(`${len.toFixed(2)} m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        }

        // Placement önizleme
        if (placingElement && mousePos) {
            if (snapPreview) {
                const sp = toScreen(snapPreview.x, snapPreview.y);
                ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(snapPreview.rotation || 0); ctx.globalAlpha = 0.7;
                const w = placingElement.width * scale;
                if (placingElement.type === 'door') {
                    ctx.strokeStyle = "#8b0c6f"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.stroke();
                    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI / 2); ctx.stroke(); ctx.setLineDash([]);
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, w); ctx.stroke();
                } else if (placingElement.type === 'window') {
                    ctx.strokeStyle = "#1a5f9e"; ctx.lineWidth = 3;
                    ctx.fillStyle = "rgba(135,206,235,0.5)"; ctx.fillRect(-w / 2, -5, w, 10);
                    ctx.strokeRect(-w / 2, -5, w, 10);
                } else if (placingElement.type === 'radiator') {
                    ctx.strokeStyle = "#993300"; ctx.lineWidth = 2;
                    ctx.fillStyle = "rgba(245,200,180,0.7)"; ctx.fillRect(-w / 2, -6, w, 12);
                    ctx.strokeRect(-w / 2, -6, w, 12);
                }
                ctx.globalAlpha = 1; ctx.restore();
                ctx.strokeStyle = "#00cc44"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2); ctx.stroke();
            } else {
                // Yakın duvar yok - tıklama için yönlendirme
                const mp = toScreen(mousePos.x, mousePos.y);
                ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(mp.x - 80, mp.y - 32, 160, 22);
                ctx.fillStyle = "#8b0c6f"; ctx.font = "12px Arial"; ctx.textAlign = "center";
                ctx.fillText("Duvara yaklaşın →", mp.x, mp.y - 18);
            }
        }

        // Ölçü aracı önizleme
        if (activeTool === 'measure' && measureStart && mousePos) {
            const p1 = toScreen(measureStart.x, measureStart.y), p2 = toScreen(mousePos.x, mousePos.y);
            ctx.strokeStyle = "#0066cc"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "#0066cc"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
            ctx.fillText(`${Math.hypot(mousePos.x - measureStart.x, mousePos.y - measureStart.y).toFixed(2)}m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        }

        if (mousePos && newWallStart) {
            const sn = snapToNearbyPoint(mousePos.x, mousePos.y);
            if (sn.snapped) { const sp = toScreen(sn.x, sn.y); ctx.strokeStyle = "#00cc44"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2); ctx.stroke(); }
        }
    }, [walls, scale, offset, selectedWallId, newWallStart, mousePos, isShiftPressed,
        activeTool, measureStart, doors, windows, radiators, selectedElementId,
        measurements, floorColor, placingElement, snapPreview]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (activeTool === "pan" || e.button === 1) { setIsPanning(true); setDragStart({ x: mx, y: my }); return; }

        if (activeTool === 'measure') {
            if (!measureStart) setMeasureStart(worldPos);
            else { onMeasurementsChange([...measurements, { id: `measure-${Date.now()}`, x1: measureStart.x, y1: measureStart.y, x2: worldPos.x, y2: worldPos.y }]); setMeasureStart(null); }
            return;
        }

        // Placement modu
        if (placingElement) {
            if (snapPreview) {
                const newEl = { id: `${placingElement.type}-${Date.now()}`, x: snapPreview.x, y: snapPreview.y, rotation: snapPreview.rotation || 0, wallId: snapPreview.wallId, width: placingElement.type === 'door' ? 0.9 : placingElement.type === 'window' ? 1.2 : 0.8 };
                if (placingElement.type === 'door') onDoorsChange([...doors, newEl]);
                else if (placingElement.type === 'window') onWindowsChange([...windows, newEl]);
                else if (placingElement.type === 'radiator') onRadiatorsChange([...radiators, newEl]);
                setPlacingElement(null); setSnapPreview(null);
                if (onPendingElementPlaced) onPendingElementPlaced();
            }
            return;
        }

        // Eleman sürükleme
        for (const door of doors) { const p = toScreen(door.x, door.y); if (Math.hypot(mx - p.x, my - p.y) < 28) { setDraggedElement({ type: 'door', data: door }); setSelectedElementId(door.id); setDragStart({ worldPos }); return; } }
        for (const win of windows) { const p = toScreen(win.x, win.y); if (Math.hypot(mx - p.x, my - p.y) < 28) { setDraggedElement({ type: 'window', data: win }); setSelectedElementId(win.id); setDragStart({ worldPos }); return; } }
        for (const rad of radiators) { const p = toScreen(rad.x, rad.y); if (Math.hypot(mx - p.x, my - p.y) < 28) { setDraggedElement({ type: 'radiator', data: rad }); setSelectedElementId(rad.id); setDragStart({ worldPos }); return; } }

        // Zemin sürükleme
        const fc = getFloorCenter();
        const fcp = toScreen(fc.x, fc.y);
        if (Math.hypot(mx - fcp.x, my - fcp.y) < 14) { setIsDraggingFloor(true); setDragStart({ worldPos }); return; }

        if (newWallStart) {
            const snapped = snapToGrid(worldPos);
            const fs = snapToNearbyPoint(snapped.x, snapped.y);
            onWallsChange([...walls, { id: `wall-${Date.now()}`, x1: newWallStart.x, y1: newWallStart.y, x2: fs.x, y2: fs.y, thickness: initialData?.wallThickness || 0.24 }]);
            onWallSelect(`wall-${Date.now() - 1}`);
            setNewWallStart(null); setMousePos(null); return;
        }

        for (const wall of walls) {
            const p1 = toScreen(wall.x1, wall.y1), p2 = toScreen(wall.x2, wall.y2);
            const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const twPx = wall.thickness * scale / 2, tOff = 30;

            if (wall.id === selectedWallId) {
                if (Math.hypot(mx - (p2.x + 22), my - p2.y) < 12) { const s = snapToNearbyPoint(wall.x2, wall.y2); setNewWallStart(s); setMousePos(worldPos); return; }
                if (Math.hypot(mx - p1.x, my - p1.y) < 16) { setDraggedWall(wall); setDragMode("resize"); setDraggedPoint("p1"); setDragStart({ worldPos }); return; }
                if (Math.hypot(mx - p2.x, my - p2.y) < 16) { setDraggedWall(wall); setDragMode("resize"); setDraggedPoint("p2"); setDragStart({ worldPos }); return; }
                if (Math.hypot(mx - midX, my - midY) < 18) { setDraggedWall(wall); setDragMode("move"); setDragStart({ worldPos }); return; }
                const ix = midX + Math.sin(angle) * (twPx + tOff), iy = midY - Math.cos(angle) * (twPx + tOff);
                const farCtrl = Math.hypot(mx - p1.x, my - p1.y) > 20 && Math.hypot(mx - p2.x, my - p2.y) > 20 && Math.hypot(mx - midX, my - midY) > 22;
                if (farCtrl && Math.hypot(mx - ix, my - iy) < 30) {
                    const isHorizontal = Math.abs(wall.y1 - wall.y2) < 0.01;
                    setEditingDim({ wallId: wall.id, isHorizontal, currentLength: Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1).toFixed(2) });
                    setDimInputValue(Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1).toFixed(2)); return;
                }
            }

            const dist = distanceToWallLine(mx, my, wall);
            if (selectedWallId) {
                const sw = walls.find(w => w.id === selectedWallId);
                if (sw) { const sp1 = toScreen(sw.x1, sw.y1), sp2 = toScreen(sw.x2, sw.y2); if (Math.hypot(mx - sp1.x, my - sp1.y) < 18 || Math.hypot(mx - sp2.x, my - sp2.y) < 18) continue; }
            }
            if (dist < wall.thickness * scale / 2 + 5) { onWallSelect(wall.id); setSelectedElementId(null); return; }
        }
        onWallSelect(null); setSelectedElementId(null);
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (newWallStart || activeTool === 'measure') setMousePos(worldPos);

        if (placingElement) {
            setMousePos(worldPos);
            const nearest = findNearestWall(worldPos.x, worldPos.y, walls);
            if (nearest && nearest.dist < 1.2) setSnapPreview({ x: nearest.x, y: nearest.y, rotation: wallAngle(nearest.wall), wallId: nearest.wall.id });
            else setSnapPreview(null);
            return;
        }

        if (isPanning) { setOffset(o => ({ x: o.x + (mx - dragStart.x), y: o.y + (my - dragStart.y) })); setDragStart({ x: mx, y: my }); return; }

        if (isDraggingFloor) {
            const dx = worldPos.x - dragStart.worldPos.x, dy = worldPos.y - dragStart.worldPos.y;
            onWallsChange(walls.map(w => ({ ...w, x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy })));
            setDragStart({ worldPos }); return;
        }

        if (draggedElement) {
            const { type, data } = draggedElement;
            const nearest = findNearestWall(worldPos.x, worldPos.y, walls);
            let nx = worldPos.x, ny = worldPos.y, nrot = data.rotation || 0;
            if (nearest && nearest.dist < 1.5) { nx = nearest.x; ny = nearest.y; nrot = wallAngle(nearest.wall); }
            if (type === 'door') onDoorsChange(doors.map(d => d.id === data.id ? { ...d, x: nx, y: ny, rotation: nrot, wallId: nearest?.wall.id || d.wallId } : d));
            else if (type === 'window') onWindowsChange(windows.map(w => w.id === data.id ? { ...w, x: nx, y: ny, rotation: nrot, wallId: nearest?.wall.id || w.wallId } : w));
            else if (type === 'radiator') onRadiatorsChange(radiators.map(r => r.id === data.id ? { ...r, x: nx, y: ny, rotation: nrot, wallId: nearest?.wall.id || r.wallId } : r));
            return;
        }

        if (draggedWall) {
            const dx = worldPos.x - dragStart.worldPos.x, dy = worldPos.y - dragStart.worldPos.y;
            onWallsChange(updateWallsStructure(walls, draggedWall, dx, dy, dragMode, draggedPoint));
            setDragStart({ ...dragStart, worldPos });
        }
    };

    const handleMouseUp = () => { setDraggedWall(null); setDragMode(null); setIsPanning(false); setDraggedElement(null); setIsDraggingFloor(false); };

    const getCursor = () => {
        if (isPanning) return "grabbing";
        if (placingElement) return snapPreview ? "crosshair" : "cell";
        if (newWallStart || activeTool === 'measure') return "crosshair";
        return "default";
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                onWheel={(e) => setScale(s => Math.max(5, s * (e.deltaY > 0 ? 0.9 : 1.1)))}
                style={{ width: '100%', height: '100%', cursor: getCursor() }} />

            {placingElement && (
                <div className="placement-banner">
                    <span className="placement-icon">{placingElement.type === 'door' ? '🚪' : placingElement.type === 'window' ? '🪟' : '🔥'}</span>
                    <span>Yerleştirmek için duvara tıklayın</span>
                    <kbd>ESC</kbd><span>iptal</span>
                </div>
            )}

            {selectedElementId && (
                <div className="element-toolbar">
                    <span className="el-toolbar-label">Döndür:</span>
                    <button className="el-tool-btn" onClick={() => rotateSelectedElement(-45)}>↺ 45°</button>
                    <button className="el-tool-btn" onClick={() => rotateSelectedElement(45)}>↻ 45°</button>
                    <button className="el-tool-btn accent" onClick={() => rotateSelectedElement(90)}>↻ 90°</button>
                    <div className="el-toolbar-divider"></div>
                    <button className="el-tool-btn danger" onClick={() => {
                        if (selectedElementId.startsWith('door-')) onDoorsChange(doors.filter(d => d.id !== selectedElementId));
                        else if (selectedElementId.startsWith('window-')) onWindowsChange(windows.filter(w => w.id !== selectedElementId));
                        else if (selectedElementId.startsWith('radiator-')) onRadiatorsChange(radiators.filter(r => r.id !== selectedElementId));
                        setSelectedElementId(null);
                    }}>🗑 Sil</button>
                </div>
            )}

            {editingDim && (
                <div className="dimension-popup">
                    <div className="dimension-popup-header">
                        <h3>Duvar Uzunluğu</h3>
                        <button className="dimension-popup-close" onClick={() => { setEditingDim(null); setDimInputValue(""); }}>✕</button>
                    </div>
                    <div className="dimension-popup-content">
                        <label>Yeni uzunluk (metre)</label>
                        <input type="number" step="0.01" value={dimInputValue} onChange={(e) => setDimInputValue(e.target.value)}
                            className="dimension-input" autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleDimSubmit(editingDim.isHorizontal ? 'right' : 'up'); }} />
                        <div className="dimension-direction">
                            <label>Yön:</label>
                            <div className="dimension-buttons">
                                {editingDim.isHorizontal
                                    ? <><button className="dimension-btn" onClick={() => handleDimSubmit('right')}>→ Sağa</button><button className="dimension-btn" onClick={() => handleDimSubmit('left')}>← Sola</button></>
                                    : <><button className="dimension-btn" onClick={() => handleDimSubmit('up')}>↑ Yukarı</button><button className="dimension-btn" onClick={() => handleDimSubmit('down')}>↓ Aşağı</button></>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isShiftPressed && newWallStart && <div className="shift-indicator">SHIFT: 90° Snap Aktif</div>}
        </div>
    );
});

export default WallEditor2D;