/* eslint-disable no-unused-vars */
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import Walls from "./Walls";
import "./RoomScene.css";

export default function RoomScene({ initialData, walls, doors, windows, radiators }) {
    if (!initialData) {
        return (
            <div className="room-scene-placeholder">
                <h2>3D Görünüm</h2>
                <p>Oda verileri yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="room-scene">
            <Canvas
                camera={{ position: [8, 6, 8], fov: 50 }}
                style={{ background: "#f0f0f0" }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} />
                <pointLight position={[-10, 5, -10]} intensity={0.4} />

                {/* Zemin */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[initialData.width, initialData.depth]} />
                    <meshStandardMaterial color="#e6e6e6" />
                </mesh>

                {/* Grid */}
                <Grid
                    args={[initialData.width, initialData.depth]}
                    cellSize={1}
                    cellThickness={0.5}
                    cellColor="#999"
                    sectionSize={0}
                    fadeDistance={100}
                    fadeStrength={1}
                    position={[0, 0.01, 0]}
                />

                {/* Duvarlar */}
                <Walls
                    walls={walls}
                    height={initialData.wallHeight}
                    thickness={initialData.wallThickness}
                />

                {/* Kontroller */}
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={3}
                    maxDistance={30}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
}