/* eslint-disable react/no-unknown-property */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useCallback } from "react";
import * as THREE from "three";

// 3D Kapı bileşeni
function Door3DShape({ door, wallHeight }) {
    const width = door.width || 0.9;
    const doorHeight = wallHeight * 0.9;
    return (
        <group position={[door.x, 0, -door.y]} rotation={[0, door.rotation || 0, 0]}>
            {/* Kapı çerçevesi */}
            <mesh position={[0, doorHeight / 2, 0]}>
                <boxGeometry args={[width + 0.1, doorHeight + 0.08, 0.06]} />
                <meshStandardMaterial color="#5a3d1a" roughness={0.7} />
            </mesh>
            {/* Kapı gövdesi */}
            <mesh position={[0, doorHeight / 2, 0.01]}>
                <boxGeometry args={[width - 0.04, doorHeight - 0.04, 0.05]} />
                <meshStandardMaterial color="#8B6914" roughness={0.5} />
            </mesh>
            {/* Panel detayları */}
            <mesh position={[0, doorHeight * 0.65, 0.04]}>
                <boxGeometry args={[width * 0.7, doorHeight * 0.3, 0.01]} />
                <meshStandardMaterial color="#7a5c10" roughness={0.6} />
            </mesh>
            <mesh position={[0, doorHeight * 0.25, 0.04]}>
                <boxGeometry args={[width * 0.7, doorHeight * 0.35, 0.01]} />
                <meshStandardMaterial color="#7a5c10" roughness={0.6} />
            </mesh>
            {/* Kapı kolu */}
            <mesh position={[width * 0.35, doorHeight * 0.48, 0.06]}>
                <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
                <meshStandardMaterial color="#c8a000" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[width * 0.35, doorHeight * 0.48, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
                <meshStandardMaterial color="#c8a000" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

// 3D Pencere bileşeni
function Window3DShape({ window: win, wallHeight }) {
    const width = win.width || 1.2;
    const winHeight = Math.min(1.2, wallHeight * 0.5);
    const sillHeight = wallHeight * 0.35;
    return (
        <group position={[win.x, 0, -win.y]} rotation={[0, win.rotation || 0, 0]}>
            {/* Dış çerçeve */}
            <mesh position={[0, sillHeight + winHeight / 2, 0]}>
                <boxGeometry args={[width + 0.1, winHeight + 0.1, 0.1]} />
                <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
            </mesh>
            {/* Cam */}
            <mesh position={[0, sillHeight + winHeight / 2, 0.01]}>
                <boxGeometry args={[width - 0.06, winHeight - 0.06, 0.04]} />
                <meshStandardMaterial color="#b8d8f0" transparent opacity={0.35} roughness={0} metalness={0.05} />
            </mesh>
            {/* Dikey çerçeve çubuğu */}
            <mesh position={[0, sillHeight + winHeight / 2, 0.04]}>
                <boxGeometry args={[0.04, winHeight, 0.06]} />
                <meshStandardMaterial color="#d0d0d0" roughness={0.3} />
            </mesh>
            {/* Yatay çerçeve çubuğu */}
            <mesh position={[0, sillHeight + winHeight / 2, 0.04]}>
                <boxGeometry args={[width, 0.04, 0.06]} />
                <meshStandardMaterial color="#d0d0d0" roughness={0.3} />
            </mesh>
            {/* Alt pervaz */}
            <mesh position={[0, sillHeight - 0.04, 0.06]}>
                <boxGeometry args={[width + 0.16, 0.08, 0.14]} />
                <meshStandardMaterial color="#d8d8d8" roughness={0.5} />
            </mesh>
        </group>
    );
}

export default function Walls({ walls, height, thickness, onWallSelect, selectedWallId, onWallsChange, doors, windows }) {
    const { camera } = useThree();
    const groupRef = useRef();
    const [hoveredWallId, setHoveredWallId] = useState(null);
    // Drag state'i ref'te tut - re-render'ı önle, daha smooth hareket
    const dragStateRef = useRef({ dragging: false, wall: null, mode: null, startX: 0, startZ: 0, point: null });

    useFrame(() => {
        if (!groupRef.current) return;

        groupRef.current.children.forEach((group) => {
            const mesh = group.children.find(child => child.isMesh && child.geometry?.type === "BoxGeometry");
            if (!mesh || !mesh.material) return;

            const wallPos = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
            const camPos = camera.position.clone();

            // Duvarın world space normal vektörünü hesapla
            const worldQuat = new THREE.Quaternion();
            mesh.getWorldQuaternion(worldQuat);
            const localNormal = new THREE.Vector3(0, 0, 1);
            const worldNormal = localNormal.applyQuaternion(worldQuat);

            const camToWall = wallPos.clone().sub(camPos);
            const dist = camToWall.length();
            camToWall.normalize();

            const dot = camToWall.dot(worldNormal);

            // Her iki yönden de şeffaf yap (kamera duvarın gerisindeyse)
            let targetOpacity = 1.0;
            if (Math.abs(dot) > 0.3 && dist < 22) {
                targetOpacity = 0.08;
            }

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(mat => {
                if (mat) {
                    mat.opacity = THREE.MathUtils.lerp(mat.opacity || 1, targetOpacity, 0.1);
                    mat.transparent = true;
                    mat.needsUpdate = true;
                }
            });
        });
    });

    // 3D duvar güncelleme - matematiksel olarak düzeltildi
    const updateWallsIn3D = useCallback((movedWall, dx, dz, mode, point) => {
        const tolerance = 0.15;
        const updatedWalls = walls.map(w => ({ ...w }));

        const movedIndex = updatedWalls.findIndex(w => w.id === movedWall.id);
        if (movedIndex === -1) return walls;

        const wall = updatedWalls[movedIndex];
        const oldX1 = wall.x1, oldY1 = wall.y1;
        const oldX2 = wall.x2, oldY2 = wall.y2;

        // ÖNEMLİ: 3D'de Z ekseni = 2D'de -Y ekseni
        const worldDY = -dz;

        if (mode === 'move') {
            const isHor = Math.abs(wall.y1 - wall.y2) < 0.05;
            if (isHor) {
                // Yatay duvar: sadece Y ekseninde hareket (3D'de Z)
                wall.y1 += worldDY;
                wall.y2 += worldDY;
            } else {
                // Dikey duvar: sadece X ekseninde hareket
                wall.x1 += dx;
                wall.x2 += dx;
            }
        } else if (mode === 'resize') {
            if (point === 'p1') {
                wall.x1 += dx;
                wall.y1 += worldDY;
            } else {
                wall.x2 += dx;
                wall.y2 += worldDY;
            }
        }

        // Bağlı duvarları güncelle
        updatedWalls.forEach((w, idx) => {
            if (idx === movedIndex) return;
            if (Math.abs(w.x1 - oldX1) < tolerance && Math.abs(w.y1 - oldY1) < tolerance) {
                w.x1 = wall.x1; w.y1 = wall.y1;
            }
            if (Math.abs(w.x1 - oldX2) < tolerance && Math.abs(w.y1 - oldY2) < tolerance) {
                w.x1 = wall.x2; w.y1 = wall.y2;
            }
            if (Math.abs(w.x2 - oldX1) < tolerance && Math.abs(w.y2 - oldY1) < tolerance) {
                w.x2 = wall.x1; w.y2 = wall.y1;
            }
            if (Math.abs(w.x2 - oldX2) < tolerance && Math.abs(w.y2 - oldY2) < tolerance) {
                w.x2 = wall.x2; w.y2 = wall.y2;
            }
        });

        return updatedWalls;
    }, [walls]);

    const handleWallClick = (e, wallId) => {
        e.stopPropagation();
        if (onWallSelect) onWallSelect(wallId);
    };

    const handlePointerDown = (e, wall, controlType, point) => {
        e.stopPropagation();
        dragStateRef.current = {
            dragging: true,
            wall: { ...wall },
            mode: controlType,
            startX: e.point.x,
            startZ: e.point.z,
            point
        };
    };

    const handlePointerMove = (e) => {
        const ds = dragStateRef.current;
        if (!ds.dragging || !onWallsChange) return;
        e.stopPropagation();

        const dx = e.point.x - ds.startX;
        const dz = e.point.z - ds.startZ;

        // Çok küçük hareketleri filtrele (titreme önleme)
        if (Math.abs(dx) < 0.003 && Math.abs(dz) < 0.003) return;

        const newWalls = updateWallsIn3D(ds.wall, dx, dz, ds.mode, ds.point);
        onWallsChange(newWalls);

        // Delta hesabı için başlangıç noktasını güncelle
        dragStateRef.current.startX = e.point.x;
        dragStateRef.current.startZ = e.point.z;
        // Güncel duvar state'ini güncelle (sonraki harekette doğru bağlantı için)
        const updatedWall = newWalls.find(w => w.id === ds.wall.id);
        if (updatedWall) dragStateRef.current.wall = { ...updatedWall };
    };

    const handlePointerUp = () => {
        dragStateRef.current = { dragging: false, wall: null, mode: null, startX: 0, startZ: 0, point: null };
    };

    return (
        <group ref={groupRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            {walls.map((wall) => {
                const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                if (len < 0.01) return null;
                const isSelected = wall.id === selectedWallId;
                const isHovered = wall.id === hoveredWallId;
                const centerX = (wall.x1 + wall.x2) / 2;
                const centerZ = -(wall.y1 + wall.y2) / 2;
                const rotation = -Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
                const wallThick = thickness || 0.24;

                return (
                    <group key={wall.id}>
                        {/* ANA DUVAR MESH */}
                        <mesh
                            position={[centerX, height / 2, centerZ]}
                            rotation={[0, rotation, 0]}
                            onClick={(e) => handleWallClick(e, wall.id)}
                            onPointerOver={(e) => {
                                e.stopPropagation();
                                setHoveredWallId(wall.id);
                                document.body.style.cursor = 'pointer';
                            }}
                            onPointerOut={() => {
                                setHoveredWallId(null);
                                document.body.style.cursor = 'default';
                            }}
                            castShadow
                            receiveShadow
                        >
                            <boxGeometry args={[len, height, wallThick]} />
                            <meshStandardMaterial
                                color={wall.color || (isHovered ? "#aaaaaa" : "#c0bdb8")}
                                roughness={0.65}
                                transparent
                                opacity={1}
                            />
                        </mesh>

                        {/* SEÇİLİ DUVAR: sadece alt şerit + kenar çizgisi + kontrol noktaları */}
                        {isSelected && (
                            <>
                                {/* Alt yüzey vurgu şeridi */}
                                <mesh
                                    position={[centerX, 0.015, centerZ]}
                                    rotation={[-Math.PI / 2, 0, rotation]}
                                >
                                    <planeGeometry args={[len + 0.05, wallThick + 0.15]} />
                                    <meshBasicMaterial
                                        color="#cc00cc"
                                        side={THREE.DoubleSide}
                                        depthTest={false}
                                        transparent
                                        opacity={0.9}
                                    />
                                </mesh>

                                {/* Kenar çizgileri */}
                                <lineSegments
                                    position={[centerX, height / 2, centerZ]}
                                    rotation={[0, rotation, 0]}
                                >
                                    <edgesGeometry args={[new THREE.BoxGeometry(len + 0.01, height + 0.01, wallThick + 0.01)]} />
                                    <lineBasicMaterial color="#8b0c6f" linewidth={2} depthTest={false} />
                                </lineSegments>

                                {/* P1 uç noktası - resize */}
                                <mesh
                                    position={[wall.x1, 0.2, -wall.y1]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'resize', 'p1')}
                                    onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
                                    onPointerOut={() => { document.body.style.cursor = 'default'; }}
                                >
                                    <sphereGeometry args={[0.14, 16, 16]} />
                                    <meshBasicMaterial color="#ff00ff" depthTest={false} />
                                </mesh>

                                {/* P2 uç noktası - resize */}
                                <mesh
                                    position={[wall.x2, 0.2, -wall.y2]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'resize', 'p2')}
                                    onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
                                    onPointerOut={() => { document.body.style.cursor = 'default'; }}
                                >
                                    <sphereGeometry args={[0.14, 16, 16]} />
                                    <meshBasicMaterial color="#ff00ff" depthTest={false} />
                                </mesh>

                                {/* Orta nokta - move */}
                                <mesh
                                    position={[centerX, 0.2, centerZ]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'move', null)}
                                    onPointerOver={() => { document.body.style.cursor = 'move'; }}
                                    onPointerOut={() => { document.body.style.cursor = 'default'; }}
                                >
                                    <sphereGeometry args={[0.18, 16, 16]} />
                                    <meshBasicMaterial color="#8b0c6f" depthTest={false} />
                                </mesh>
                            </>
                        )}
                    </group>
                );
            })}

            {/* KAPILAR 3D */}
            {doors && doors.map(door => (
                <Door3DShape key={door.id} door={door} wallHeight={height} />
            ))}

            {/* PENCERELER 3D */}
            {windows && windows.map(win => (
                <Window3DShape key={win.id} window={win} wallHeight={height} />
            ))}
        </group>
    );
}