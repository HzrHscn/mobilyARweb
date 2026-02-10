/* eslint-disable react/no-unknown-property */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export default function Walls({ walls, height, thickness, onWallSelect, selectedWallId }) {
    const { camera } = useThree();
    const groupRef = useRef();
    const [hoveredWallId, setHoveredWallId] = useState(null);

    useFrame(() => {
        if (!groupRef.current) return;

        groupRef.current.children.forEach((group) => {
            // Sadece ana duvar mesh'ini bul (ilk çocuk genelde ana mesh'tir)
            const mesh = group.children.find(child => child.type === "Mesh" && !child.userData.isFloor);

            if (!mesh || !mesh.material) return;

            const wallPos = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
            const camPos = camera.position.clone();

            // Duvarın normal vektörünü hesapla (basitçe merkeze göre)
            const wallDirection = new THREE.Vector3();
            mesh.getWorldDirection(wallDirection);
            const wallNormal = wallDirection.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();

            const cameraToWall = wallPos.clone().sub(camPos).normalize();
            const dot = cameraToWall.dot(wallNormal);
            const dist = camPos.distanceTo(wallPos);

            // Saydamlık Mantığı (Hata Kontrollü)
            let targetOpacity = 1.0;
            if (Math.abs(dot) > 0.4 && dist < 12) {
                targetOpacity = 0.2;
            }

            // Materyal dizi mi yoksa tekil mi kontrol et
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(mat => {
                if (mat) {
                    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
                    mat.transparent = true;
                }
            });
        });
    });

    const handleWallClick = (e, wallId) => {
        e.stopPropagation();
        if (onWallSelect) onWallSelect(wallId);
    };

    return (
        <group ref={groupRef}>
            {walls.map((wall) => {
                const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                const isSelected = wall.id === selectedWallId;
                const isHovered = wall.id === hoveredWallId;
                const centerX = (wall.x1 + wall.x2) / 2;
                const centerZ = -(wall.y1 + wall.y2) / 2;
                const rotation = -Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

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
                        >
                            <boxGeometry args={[len, height, thickness || 0.24]} />
                            <meshStandardMaterial
                                color={isSelected ? "#8b0c6f" : isHovered ? "#a020a0" : "#999"}
                                roughness={0.7}
                            />
                        </mesh>

                        {/* SEÇİLİ DUVAR VURGUSU */}
                        {isSelected && (
                            <group position={[centerX, height / 2, centerZ]} rotation={[0, rotation, 0]}>
                                <lineSegments>
                                    <edgesGeometry args={[new THREE.BoxGeometry(len + 0.01, height + 0.01, (thickness || 0.24) + 0.01)]} />
                                    <lineBasicMaterial color="#ff00ff" linewidth={2} />
                                </lineSegments>
                            </group>
                        )}
                    </group>
                );
            })}
        </group>
    );
}