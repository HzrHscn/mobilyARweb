/* eslint-disable no-unused-vars */
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useRef, useImperativeHandle, forwardRef } from "react";
import Walls from "./Walls";
import "./RoomScene.css";

const RoomScene = forwardRef(({ initialData, walls, doors, windows, radiators, selectedWallId, onWallSelect, onWallsChange }, ref) => {
    const controlsRef = useRef();
    const cameraRef = useRef();

    useImperativeHandle(ref, () => ({
        zoom: (direction) => {
            if (cameraRef.current && controlsRef.current) {
                const camera = cameraRef.current;
                const controls = controlsRef.current;
                const target = controls.target.clone();
                const position = camera.position.clone();
                const direction_vec = position.sub(target).normalize();

                const step = direction === "in" ? -2 : 2;
                const newPosition = camera.position.clone().add(direction_vec.multiplyScalar(step));

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

                const centerX = 0;
                const centerZ = 0;
                const centerY = initialData.wallHeight / 2;

                const maxDim = Math.max(initialData.width, initialData.depth);
                const distance = maxDim * 1.5;

                camera.position.set(distance, distance * 0.8, distance);
                controls.target.set(centerX, centerY, centerZ);
                controls.update();
            }
        }
    }));

    if (!initialData) return null;

    return (
        <div className="room-scene">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera
                    ref={cameraRef}
                    makeDefault
                    position={[10, 8, 10]}
                    fov={45}
                />

                <ambientLight intensity={0.7} />
                <directionalLight
                    position={[10, 10, 10]}
                    intensity={1.0}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <pointLight position={[-10, 10, -10]} intensity={0.5} />

                <Environment preset="city" />

                <Suspense fallback={null}>
                    {/* Zemin */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.01, 0]}
                        receiveShadow
                        onClick={() => onWallSelect && onWallSelect(null)}
                    >
                        <planeGeometry args={[initialData.width * 3, initialData.depth * 3]} />
                        <meshStandardMaterial color="#f0f0f0" />
                    </mesh>

                    {/* Duvarlar */}
                    <Walls
                        walls={walls}
                        height={initialData.wallHeight}
                        thickness={initialData.wallThickness}
                        selectedWallId={selectedWallId}
                        onWallSelect={onWallSelect}
                        onWallsChange={onWallsChange}
                    />

                    {/* Gölgeler */}
                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2}
                        far={4.5}
                    />
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={2}
                    maxDistance={40}
                    maxPolarAngle={Math.PI / 2.1}
                    target={[0, initialData.wallHeight / 2, 0]}
                />

                {/* Grid helper */}
                <gridHelper args={[initialData.width * 2, 20, '#cccccc', '#eeeeee']} position={[0, 0, 0]} />
            </Canvas>
        </div>
    );
});

RoomScene.displayName = "RoomScene";
export default RoomScene;