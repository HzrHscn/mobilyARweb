/* eslint-disable no-unused-vars */
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useRef, useImperativeHandle, forwardRef } from "react";
import Walls from "./Walls";
import "./RoomScene.css";

const RoomScene = forwardRef(({ initialData, walls, doors, windows, radiators, selectedWallId, onWallSelect, onWallsChange, floorColor }, ref) => {
    const controlsRef = useRef();
    const cameraRef = useRef();

    useImperativeHandle(ref, () => ({
        zoom: (direction) => {
            if (cameraRef.current && controlsRef.current) {
                const camera = cameraRef.current;
                const controls = controlsRef.current;
                const target = controls.target.clone();
                const position = camera.position.clone();
                const dir = position.clone().sub(target).normalize();
                const step = direction === "in" ? -2 : 2;
                const newPosition = camera.position.clone().add(dir.multiplyScalar(step));
                const distance = newPosition.distanceTo(target);
                if (distance > 2 && distance < 40) {
                    camera.position.copy(newPosition);
                    controls.update();
                }
            }
        },
        fitToScreen: () => {
            if (controlsRef.current && cameraRef.current && initialData) {
                const camera = cameraRef.current;
                const controls = controlsRef.current;
                const maxDim = Math.max(initialData.width, initialData.depth);
                const distance = maxDim * 1.5;
                camera.position.set(distance, distance * 0.8, distance);
                controls.target.set(0, initialData.wallHeight / 2, 0);
                controls.update();
            }
        }
    }));

    if (!initialData) return null;

    // Duvarlardan gerçek zemin sınırını hesapla
    const floorCenterX = walls.length > 0 ? walls.reduce((s, w) => s + w.x1 + w.x2, 0) / (walls.length * 2) : 0;
    const floorCenterZ = walls.length > 0 ? -walls.reduce((s, w) => s + w.y1 + w.y2, 0) / (walls.length * 2) : 0;

    return (
        <div className="room-scene">
            <Canvas shadows gl={{ antialias: true, alpha: false }} style={{ background: '#ddd8d0' }}>
                <PerspectiveCamera
                    ref={cameraRef}
                    makeDefault
                    position={[10, 8, 10]}
                    fov={45}
                />

                <ambientLight intensity={0.8} />
                <directionalLight
                    position={[10, 15, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={0.5}
                    shadow-camera-far={50}
                    shadow-camera-left={-20}
                    shadow-camera-right={20}
                    shadow-camera-top={20}
                    shadow-camera-bottom={-20}
                />
                <pointLight position={[-8, 8, -8]} intensity={0.4} />

                <Environment preset="apartment" />

                <Suspense fallback={null}>
                    {/* ZEMIN OBJESİ - gerçek oda boyutunda, renkli */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[floorCenterX, 0, floorCenterZ]}
                        receiveShadow
                        onClick={() => onWallSelect && onWallSelect(null)}
                    >
                        <planeGeometry args={[initialData.width, initialData.depth]} />
                        <meshStandardMaterial
                            color={floorColor || "#c8a86e"}
                            roughness={0.8}
                            metalness={0.05}
                        />
                    </mesh>

                    {/* Dış zemin (oda dışı, gri) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
                        <planeGeometry args={[initialData.width * 4, initialData.depth * 4]} />
                        <meshStandardMaterial color="#bebbb5" roughness={0.9} />
                    </mesh>

                    {/* Duvarlar + kapı + pencere */}
                    <Walls
                        walls={walls}
                        height={initialData.wallHeight}
                        thickness={initialData.wallThickness}
                        selectedWallId={selectedWallId}
                        onWallSelect={onWallSelect}
                        onWallsChange={onWallsChange}
                        doors={doors || []}
                        windows={windows || []}
                    />

                    <ContactShadows
                        position={[0, 0.01, 0]}
                        opacity={0.35}
                        scale={20}
                        blur={2.5}
                        far={4}
                    />
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={2}
                    maxDistance={40}
                    maxPolarAngle={Math.PI / 2.05}
                    target={[0, initialData.wallHeight / 2, 0]}
                />

                <gridHelper args={[initialData.width * 3, 30, '#bbbbbb', '#dddddd']} position={[0, 0.001, 0]} />
            </Canvas>
        </div>
    );
});

RoomScene.displayName = "RoomScene";
export default RoomScene;