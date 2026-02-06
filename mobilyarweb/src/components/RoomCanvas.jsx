import WallEditor2D from "./WallEditor2D";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function RoomCanvas({ mode, width, depth, wall }) {

    if (mode === "2D") {
        return (
            <WallEditor2D
                width={width}
                depth={depth}
                wall={wall}
                onChange={(walls) => {
                    console.log("Yeni duvar konumları:", walls);
                }}
            />
        );
    }

    return (
        <Canvas camera={{ position: [0, 6, 8] }}>
            <ambientLight intensity={0.8} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#e6e6e6" />
            </mesh>

            <OrbitControls />
        </Canvas>
    );
}
