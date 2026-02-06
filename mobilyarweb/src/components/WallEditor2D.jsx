import { useEffect, useRef, useState } from "react";

export default function WallEditor2D({ width, depth, wall, onChange }) {
    const canvasRef = useRef(null);

    // Oda köşeleri (metre cinsinden)
    const [points, setPoints] = useState([
        { x: -width / 2, y: depth / 2 }, // sol üst
        { x: width / 2, y: depth / 2 }, // sağ üst
        { x: width / 2, y: -depth / 2 }, // sağ alt
        { x: -width / 2, y: -depth / 2 }, // sol alt
    ]);

    const [dragIndex, setDragIndex] = useState(null);
    const scale = 80; // 1 metre = 80px

    const toScreen = (x, y, canvas) => ({
        sx: canvas.width / 2 + x * scale,
        sy: canvas.height / 2 - y * scale,
    });

    const toWorld = (sx, sy, canvas) => ({
        x: (sx - canvas.width / 2) / scale,
        y: (canvas.height / 2 - sy) / scale,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const draw = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#f2f2f2";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Duvar çizgisi kalınlığı = gerçek duvar kalınlığı
            ctx.lineWidth = wall * scale;
            ctx.strokeStyle = "#777";

            ctx.beginPath();
            points.forEach((p, i) => {
                const s = toScreen(p.x, p.y, canvas);
                if (i === 0) ctx.moveTo(s.sx, s.sy);
                else ctx.lineTo(s.sx, s.sy);
            });

            // Kapalı şekil
            const s0 = toScreen(points[0].x, points[0].y, canvas);
            ctx.lineTo(s0.sx, s0.sy);
            ctx.stroke();

            // Köşe tutma noktaları
            points.forEach(p => {
                const s = toScreen(p.x, p.y, canvas);
                ctx.fillStyle = "rgba(139,12,111,0.5)";
                ctx.beginPath();
                ctx.arc(s.sx, s.sy, 10, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        draw();
    }, [points, wall]);

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let hit = null;

        points.forEach((p, i) => {
            const s = toScreen(p.x, p.y, canvas);
            const d = Math.hypot(mx - s.sx, my - s.sy);
            if (d < 15) hit = i;
        });

        if (hit !== null) setDragIndex(hit);
    };

    const handleMouseMove = (e) => {
        if (dragIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const w = toWorld(mx, my, canvas);

        setPoints(prev => {
            const next = [...prev];
            next[dragIndex] = { x: w.x, y: w.y };
            return next;
        });
    };

    const handleMouseUp = () => {
        setDragIndex(null);
        onChange?.(points);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", cursor: "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        />
    );
}
