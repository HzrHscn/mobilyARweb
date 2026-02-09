export default function Walls({ walls, height, thickness }) {
    if (!walls || walls.length === 0) {
        return null;
    }

    return (
        <group>
            {walls.map((wall) => {
                // Duvar uzunluğu ve merkez pozisyonu hesapla
                const length = Math.sqrt(
                    Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2)
                );

                const centerX = (wall.x1 + wall.x2) / 2;
                const centerZ = (wall.y1 + wall.y2) / 2;

                // Rotasyon açısı
                const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

                return (
                    <mesh
                        key={wall.id}
                        position={[centerX, height / 2, -centerZ]}
                        rotation={[0, -angle, 0]}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry args={[length, height, thickness || 0.24]} />
                        <meshStandardMaterial color="#999999" />
                    </mesh>
                );
            })}
        </group>
    );
}