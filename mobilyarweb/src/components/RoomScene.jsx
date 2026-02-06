import Walls from "./Walls";

export default function RoomScene({ shape, is2D }) {
    return (
        <group>
            <gridHelper args={[10, 10]} />
            <axesHelper args={[2]} />

            {/* Duvarları şekle göre çiz */}
            <Walls shape={shape} is2D={is2D} />
        </group>
    );
}
