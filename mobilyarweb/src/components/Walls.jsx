/* eslint-disable react/no-unknown-property */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export default function Walls({ walls, height, thickness, onWallSelect, selectedWallId, onWallsChange }) {
    const { camera } = useThree();
    const groupRef = useRef();
    const [hoveredWallId, setHoveredWallId] = useState(null);
    const [draggedWall, setDraggedWall] = useState(null);
    const [dragMode, setDragMode] = useState(null);
    const [dragStart, setDragStart] = useState(null);

    useFrame(() => {
        if (!groupRef.current) return;

        groupRef.current.children.forEach((group) => {
            const mesh = group.children.find(child => child.type === "Mesh" && child.geometry.type === "BoxGeometry");
            if (!mesh || !mesh.material) return;

            const wallPos = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
            const camPos = camera.position.clone();

            const wallDirection = new THREE.Vector3();
            mesh.getWorldDirection(wallDirection);
            const wallNormal = wallDirection.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();

            const cameraToWall = wallPos.clone().sub(camPos).normalize();
            const dot = cameraToWall.dot(wallNormal);
            const dist = camPos.distanceTo(wallPos);

            // DÜZELTME: Kamera bakıyorsa TAM şeffaf (0.05), değilse opak
            let targetOpacity = 1.0;
            if (dot > 0.25 && dist < 20) {
                targetOpacity = 0.05; // Neredeyse tamamen şeffaf
            }

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(mat => {
                if (mat) {
                    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.15);
                    mat.transparent = true;
                }
            });
        });
    });

    const updateWallsIn3D = (movedWall, dx, dy, mode, point) => {
        const tolerance = 0.1;
        const updatedWalls = walls.map(w => ({ ...w }));

        const movedIndex = updatedWalls.findIndex(w => w.id === movedWall.id);
        if (movedIndex === -1) return walls;

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

    const handleWallClick = (e, wallId) => {
        e.stopPropagation();
        if (onWallSelect) onWallSelect(wallId);
    };

    const handlePointerDown = (e, wall, controlType, point) => {
        e.stopPropagation();
        setDraggedWall(wall);
        setDragMode(controlType);
        setDragStart({ x: e.point.x, z: e.point.z, point });
    };

    const handlePointerMove = (e) => {
        if (!draggedWall || !dragStart || !onWallsChange) return;

        const dx = e.point.x - dragStart.x;
        const dy = -(e.point.z - dragStart.z);

        const newWalls = updateWallsIn3D(draggedWall, dx, dy, dragMode, dragStart.point);
        onWallsChange(newWalls);

        setDragStart({ x: e.point.x, z: e.point.z, point: dragStart.point });
    };

    const handlePointerUp = () => {
        setDraggedWall(null);
        setDragMode(null);
        setDragStart(null);
    };

    return (
        <group ref={groupRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            {walls.map((wall) => {
                const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                const isSelected = wall.id === selectedWallId;
                const isHovered = wall.id === hoveredWallId;
                const centerX = (wall.x1 + wall.x2) / 2;
                const centerZ = -(wall.y1 + wall.y2) / 2;
                const rotation = -Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

                return (
                    <group key={wall.id}>
                        {/* ANA DUVAR - şeffaflaşabilir */}
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
                        >
                            <boxGeometry args={[len, height, thickness || 0.24]} />
                            <meshStandardMaterial
                                color={wall.color || (isSelected ? "#8b0c6f" : isHovered ? "#a020a0" : "#999")}
                                roughness={0.7}
                            />
                        </mesh>

                        {/* SEÇİLİ DUVAR - SADECE ALT YÜZEY VE KENARLAR */}
                        {isSelected && (
                            <>
                                {/* ALT YÜZEY - Pembe (HER ZAMAN GÖRÜNÜR) */}
                                <mesh
                                    position={[centerX, 0.05, centerZ]}
                                    rotation={[-Math.PI / 2, 0, rotation]}
                                >
                                    <planeGeometry args={[len + 0.2, (thickness || 0.24) + 0.3]} />
                                    <meshBasicMaterial
                                        color="#ff00ff"
                                        transparent={false}
                                        opacity={1.0}
                                        side={THREE.DoubleSide}
                                        depthTest={false}
                                    />
                                </mesh>

                                {/* SİYAH KENAR ÇİZGİLERİ - Köşeler (HER ZAMAN GÖRÜNÜR) */}
                                <lineSegments position={[centerX, height / 2, centerZ]} rotation={[0, rotation, 0]}>
                                    <edgesGeometry args={[new THREE.BoxGeometry(len + 0.02, height + 0.02, (thickness || 0.24) + 0.02)]} />
                                    <lineBasicMaterial
                                        color="#000000"
                                        linewidth={3}
                                        depthTest={false}
                                    />
                                </lineSegments>

                                {/* KONTROL NOKTALARI */}
                                <mesh
                                    position={[wall.x1, 0.15, -wall.y1]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'resize', 'p1')}
                                >
                                    <sphereGeometry args={[0.12, 16, 16]} />
                                    <meshBasicMaterial color="#ff00ff" depthTest={false} />
                                </mesh>

                                <mesh
                                    position={[wall.x2, 0.15, -wall.y2]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'resize', 'p2')}
                                >
                                    <sphereGeometry args={[0.12, 16, 16]} />
                                    <meshBasicMaterial color="#ff00ff" depthTest={false} />
                                </mesh>

                                <mesh
                                    position={[centerX, 0.15, centerZ]}
                                    onPointerDown={(e) => handlePointerDown(e, wall, 'move', null)}
                                >
                                    <sphereGeometry args={[0.15, 16, 16]} />
                                    <meshBasicMaterial color="#8b0c6f" depthTest={false} />
                                </mesh>
                            </>
                        )}
                    </group>
                );
            })}
        </group>
    );
}