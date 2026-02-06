export default function Walls({ shape }) {

    const wallMaterial = (
        <meshStandardMaterial color="#999" />
    );

    const wall = (x, z, w = 4, d = 0.2) => (
        <mesh position={[x, 0.5, z]}>
            <boxGeometry args={[w, 1, d]} />
            {wallMaterial}
        </mesh>
    );

    if (shape === "rect") {
        return (
            <group>
                {wall(0, -2, 8)}
                {wall(0, 2, 8)}
                {wall(-4, 0, 0.2, 4)}
                {wall(4, 0, 0.2, 4)}
            </group>
        );
    }

    if (shape === "l") {
        return (
            <group>
                {wall(0, -2, 8)}
                {wall(-2, 1, 4)}
                {wall(-4, 0, 0.2, 4)}
                {wall(2, 2, 4)}
            </group>
        );
    }

    return null;
}
