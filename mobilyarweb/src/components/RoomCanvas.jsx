/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "./RoomCanvas.css";

const Canvas2D = forwardRef(({
    initialData,
    walls,
    onWallsChange,
    selectedWallId,
    onWallSelect,
    activeTool,
    saveToHistory
}, ref) => {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(50);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [draggedWall, setDraggedWall] = useState(null);
    const [dragMode, setDragMode] = useState(null); // 'move', 'resize', 'add'

    // --- DIŞARIYA AÇILAN FONKSİYONLAR ---
    useImperativeHandle(ref, () => ({
        zoom: (direction) => {
            const factor = direction === "in" ? 1.2 : 0.8;
            setScale(prev => Math.max(10, Math.min(prev * factor, 300)));
        },
        fitToScreen: () => {
            if (!initialData) return;
            const canvas = canvasRef.current;
            const padding = 100;
            const sX = (canvas.width - padding) / initialData.width;
            const sY = (canvas.height - padding) / initialData.depth;
            setScale(Math.min(sX, sY, 80));
            setOffset({ x: 0, y: 0 });
        }
    }));

    // Koordinat Dönüşümleri
    const toScreen = (x, y) => ({
        x: canvasRef.current.width / 2 + x * scale + offset.x,
        y: canvasRef.current.height / 2 - y * scale + offset.y
    });

    const toWorld = (sx, sy) => ({
        x: (sx - canvasRef.current.width / 2 - offset.x) / scale,
        y: (canvasRef.current.height / 2 - sy - offset.y) / scale
    });

    // --- ÇİZİM MOTORU ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        // 1. Arkaplan (Karesiz, pCon stili temiz beyaz/gri)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Oda İçi Gri Dolgu (Duvarlar birleşmişse)
        if (walls.length >= 3) {
            ctx.fillStyle = "#e8e8e8"; // Oda içi gri
            ctx.beginPath();
            walls.forEach((w, i) => {
                const p = toScreen(w.x1, w.y1);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
        }

        // 3. Duvarları Çiz
        walls.forEach(wall => {
            const p1 = toScreen(wall.x1, wall.y1);
            const p2 = toScreen(wall.x2, wall.y2);
            const isSelected = wall.id === selectedWallId;

            // Duvar Çizgisi
            ctx.strokeStyle = isSelected ? "#8b0c6f" : "#444444";
            ctx.lineWidth = wall.thickness * scale;
            ctx.lineCap = "square";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            if (isSelected) {
                drawWallControls(ctx, wall, p1, p2);
                drawWallMeasurements(ctx, wall, p1, p2);
            }
        });
    }, [walls, scale, offset, selectedWallId]);

    // Duvar Ölçülerini Yazma (İç ve Dış)
    const drawWallMeasurements = (ctx, wall, p1, p2) => {
        const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";

        // İçe bakan ölçü (Gri alanda)
        ctx.fillStyle = "#333";
        ctx.fillText(`${length.toFixed(2)}m`, midX, midY - 15);

        // Dışa bakan ölçü (Kalınlık dahil)
        ctx.fillStyle = "#888";
        ctx.fillText(`${(length + wall.thickness * 2).toFixed(2)}m`, midX, midY + 25);
    };

    // Duvar Üstü Simgeler (Resim 4'teki gibi)
    const drawWallControls = (ctx, wall, p1, p2) => {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Taşıma butonu (Orta)
        ctx.fillStyle = "#8b0c6f";
        ctx.beginPath(); ctx.arc(midX, midY, 10, 0, Math.PI * 2); ctx.fill();

        // Boyutlandırma noktaları (Uçlar)
        ctx.fillStyle = "#ff00ff"; // Pembe büyük nokta
        ctx.beginPath(); ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2); ctx.fill();

        // Yeni duvar ekleme (+)
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText("+", p2.x + 15, p2.y);
    };

    // --- MOUSE EVENTLERİ ---
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

        if (activeTool === "select") {
            // Duvar seçimi ve kontrol noktası tespiti
            let foundWall = null;
            for (const wall of walls) {
                const p1 = toScreen(wall.x1, wall.y1);
                const p2 = toScreen(wall.x2, wall.y2);

                // Pembe nokta (Resize) kontrolü
                if (Math.hypot(mx - p1.x, my - p1.y) < 15) {
                    onWallSelect(wall.id); setDraggedWall(wall); setDragMode("resize"); setDragStart({ point: "p1", worldPos }); return;
                }

                // Orta nokta (Move) kontrolü
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                if (Math.hypot(mx - midX, my - midY) < 15) {
                    onWallSelect(wall.id); setDraggedWall(wall); setDragMode("move"); setDragStart({ worldPos }); return;
                }

                // Duvar gövdesi seçimi
                const dist = distanceToLine(mx, my, p1.x, p1.y, p2.x, p2.y);
                if (dist < (wall.thickness * scale) / 2 + 10) foundWall = wall;
            }
            onWallSelect(foundWall ? foundWall.id : null);
        }
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPos = toWorld(mx, my);

        if (isPanning) {
            setOffset({ x: offset.x + (mx - dragStart.x), y: offset.y + (my - dragStart.y) });
            setDragStart({ x: mx, y: my });
            return;
        }

        if (draggedWall && dragMode) {
            const dx = worldPos.x - dragStart.worldPos.x;
            const dy = worldPos.y - dragStart.worldPos.y;

            const newWalls = walls.map(w => {
                if (w.id !== draggedWall.id) return w;

                if (dragMode === "move") {
                    // Sadece kısıtlı eksende taşıma (Yatay duvar sadece yukarı/aşağı)
                    if (w.y1 === w.y2) return { ...w, y1: w.y1 + dy, y2: w.y2 + dy }; // Yatay
                    if (w.x1 === w.x2) return { ...w, x1: w.x1 + dx, x2: w.x2 + dx }; // Dikey
                }

                if (dragMode === "resize") {
                    if (dragStart.point === "p1") return { ...w, x1: worldPos.x, y1: worldPos.y };
                    return { ...w, x2: worldPos.x, y2: worldPos.y };
                }
                return w;
            });

            onWallsChange(newWalls);
        }
    };

    const distanceToLine = (px, py, x1, y1, x2, y2) => {
        const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => { setDraggedWall(null); setDragMode(null); setIsPanning(false); }}
            onWheel={(e) => setScale(prev => Math.max(10, prev * (e.deltaY > 0 ? 0.9 : 1.1)))}
            style={{
                cursor: isPanning ? "grabbing" : activeTool === "pan" ? "grab" : "default",
                width: '100%',
                height: '100%',
                display: 'block'
            }}
        />
    );
});

Canvas2D.displayName = "Canvas2D";
export default Canvas2D;