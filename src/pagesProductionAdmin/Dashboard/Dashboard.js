import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  RoundedBox,
  Text,
} from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const SCALE_NOTE = "1 đơn vị = 1 mét";

const COLORS = {
  bg: "#f4eadb",
  floor: "#f7efe2",
  road: "#e6d8bd",
  wall: "#efe1c8",
  dark: "#2f2b26",
  machine: "#95c7d8",
  table: "#f8c96d",
  area: "#c7e6b5",
  door: "#d98a42",
  playerBody: "#4da3ff",
  playerHead: "#ffd29d",
  playerHair: "#4a3328",
};

const statusColor = {
  running: "#7bd88f",
  warning: "#ffd166",
  error: "#ff8fa3",
  idle: "#95c7d8",
  done: "#8bd3ff",
};

const factoryObjects = [
  { type: "machine", name: "Máy in tự động số 7", x: -30, z: -20, w: 21.2, d: 3, status: "running" },
  { type: "machine", name: "Máy in tự động số 6", x: -30, z: -11, w: 21.2, d: 3.2, status: "warning" },
  { type: "machine", name: "Máy in tự động số 5", x: -29, z: -3, w: 12.4, d: 3, status: "idle" },
  { type: "machine", name: "Máy in tự động số 4", x: -29, z: 5, w: 12.4, d: 3, status: "running" },
  { type: "machine", name: "Máy in tự động số 3", x: -29, z: 13, w: 12.4, d: 3, status: "done" },
  { type: "machine", name: "Máy in tự động số 2", x: -29, z: 21, w: 12.4, d: 3, status: "running" },
  { type: "machine", name: "Máy in tự động số 1", x: -29, z: 29, w: 10.2, d: 2.8, status: "error" },
  { type: "machine", name: "Máy in tự động số 8", x: 5, z: -20, w: 21.5, d: 3, status: "running" },

  ...Array.from({ length: 9 }).map((_, i) => ({
    type: "table",
    name: `Bàn in số ${i + 1}`,
    x: 4 + i * 3.2,
    z: 5,
    w: 1.8,
    d: 39.2,
    status: "idle",
  })),

  { type: "table", name: "Bàn in 01 robots số 1", x: 37, z: -3, w: 1.6, d: 48, status: "running" },
  { type: "table", name: "Bàn in 02 robots số 1", x: 40, z: -3, w: 1.6, d: 48, status: "warning" },
  { type: "table", name: "Bàn in 03 robots số 2", x: 43, z: -3, w: 1.42, d: 44, status: "idle" },
  { type: "table", name: "Bàn in 04 robots số 2", x: 46, z: -3, w: 1.42, d: 44, status: "running" },

  ...Array.from({ length: 5 }).map((_, i) => ({
    type: "table",
    name: `Bàn in số ${10 + i}`,
    x: 30 + i * 3.4,
    z: 31,
    w: 1.8,
    d: 30,
    status: "idle",
  })),

  { type: "area", name: "Phòng điều hành sản xuất", x: -42, z: 40, w: 10, d: 7 },
  { type: "area", name: "Đại sảnh", x: -30, z: 40, w: 8, d: 7 },
  { type: "area", name: "Kho thành phẩm", x: -20, z: 40, w: 9, d: 7 },
  { type: "area", name: "P. chụp khung", x: -9, z: 40, w: 9, d: 7 },
  { type: "area", name: "Kho vật tư", x: 10, z: 40, w: 10, d: 7 },
  { type: "area", name: "Phòng pha màu", x: 25, z: 40, w: 18, d: 7 },
];

const doors = [
  { name: "Cửa cuốn số 1", x: 42, z: 44 },
  { name: "Cửa cuốn số 2", x: -49, z: -8 },
  { name: "Cửa cuốn số 3", x: 44, z: -29 },
  { name: "Cửa cuốn số 4", x: 49, z: 28 },
  { name: "Cửa cuốn số 5", x: 49, z: 36 },
  { name: "Cửa cuốn số 6", x: -49, z: 15 },
  { name: "Cửa cuốn số 7", x: 0, z: 44 },
];

function SoftMaterial({ color, roughness = 0.75 }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={0.02}
    />
  );
}

function MachineObject({ item, onSelect }) {
  const color = statusColor[item.status] || COLORS.machine;

  return (
    <group
      position={[item.x, 0, item.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <RoundedBox
        args={[item.w, 1.5, item.d]}
        radius={0.35}
        smoothness={6}
        position={[0, 0.75, 0]}
        castShadow
        receiveShadow
      >
        <SoftMaterial color={color} roughness={0.55} />
      </RoundedBox>

      <RoundedBox
        args={[item.w * 0.92, 0.18, item.d * 0.82]}
        radius={0.18}
        smoothness={5}
        position={[0, 1.62, 0]}
        castShadow
        receiveShadow
      >
        <SoftMaterial color="#fff7ed" />
      </RoundedBox>

      <RoundedBox
        args={[1.4, 0.8, 0.16]}
        radius={0.08}
        smoothness={4}
        position={[item.w / 2 - 1, 1.35, -item.d / 2 - 0.02]}
        castShadow
      >
        <SoftMaterial color="#2f3542" roughness={0.4} />
      </RoundedBox>

      <mesh position={[item.w / 2 - 1, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>

      <Text
        position={[0, 2.35, 0]}
        fontSize={0.9}
        color={COLORS.dark}
        anchorX="center"
        outlineWidth={0.025}
        outlineColor="white"
      >
        {item.name}
      </Text>
    </group>
  );
}

function TableObject({ item, onSelect }) {
  return (
    <group
      position={[item.x, 0, item.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <RoundedBox
        args={[item.w, 0.35, item.d]}
        radius={0.18}
        smoothness={5}
        position={[0, 0.55, 0]}
        castShadow
        receiveShadow
      >
        <SoftMaterial color={COLORS.table} />
      </RoundedBox>

      <RoundedBox
        args={[item.w * 0.82, 0.04, item.d * 0.95]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.76, 0]}
        receiveShadow
      >
        <SoftMaterial color="#fffaf0" />
      </RoundedBox>

      <Text
        position={[0, 1.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.75}
        color={COLORS.dark}
        outlineWidth={0.02}
        outlineColor="white"
      >
        {item.name}
      </Text>
    </group>
  );
}

function AreaObject({ item, onSelect }) {
  return (
    <group
      position={[item.x, 0, item.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <RoundedBox
        args={[item.w, 0.3, item.d]}
        radius={0.28}
        smoothness={6}
        position={[0, 0.16, 0]}
        castShadow
        receiveShadow
      >
        <SoftMaterial color={COLORS.area} />
      </RoundedBox>

      <RoundedBox
        args={[item.w, 1.4, 0.22]}
        radius={0.16}
        smoothness={5}
        position={[0, 0.82, -item.d / 2]}
        castShadow
        receiveShadow
      >
        <SoftMaterial color="#f6d7a7" />
      </RoundedBox>

      <Text
        position={[0, 1.65, 0]}
        fontSize={0.75}
        color={COLORS.dark}
        outlineWidth={0.025}
        outlineColor="white"
      >
        {item.name}
      </Text>
    </group>
  );
}

function FactoryObject({ item, onSelect }) {
  if (item.type === "machine") return <MachineObject item={item} onSelect={onSelect} />;
  if (item.type === "table") return <TableObject item={item} onSelect={onSelect} />;
  return <AreaObject item={item} onSelect={onSelect} />;
}

function Wall({ position, size }) {
  return (
    <RoundedBox
      args={size}
      radius={0.18}
      smoothness={5}
      position={position}
      castShadow
      receiveShadow
    >
      <SoftMaterial color={COLORS.wall} />
    </RoundedBox>
  );
}

function Door({ door }) {
  return (
    <group position={[door.x, 0, door.z]}>
      <RoundedBox args={[5, 2.4, 0.25]} radius={0.15} smoothness={5} position={[0, 1.2, 0]} castShadow>
        <SoftMaterial color={COLORS.door} />
      </RoundedBox>

      <RoundedBox args={[4.4, 1.7, 0.08]} radius={0.1} smoothness={4} position={[0, 1.2, -0.14]}>
        <SoftMaterial color="#f7c27d" />
      </RoundedBox>

      <Text
        position={[0, 2.8, 0]}
        fontSize={0.72}
        color={COLORS.dark}
        outlineWidth={0.025}
        outlineColor="white"
      >
        {door.name}
      </Text>
    </group>
  );
}

function CartoonPlayer({ playerRef }) {
  return (
    <group ref={playerRef} position={[0, 0, 50]}>
      <RoundedBox args={[0.9, 1.2, 0.55]} radius={0.35} smoothness={8} position={[0, 0.95, 0]} castShadow>
        <SoftMaterial color={COLORS.playerBody} />
      </RoundedBox>

      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <SoftMaterial color={COLORS.playerHead} />
      </mesh>

      <mesh position={[0, 2.12, -0.03]} castShadow>
        <sphereGeometry args={[0.44, 32, 32]} />
        <SoftMaterial color={COLORS.playerHair} />
      </mesh>

      <RoundedBox args={[0.25, 0.55, 0.25]} radius={0.1} smoothness={4} position={[-0.28, 0.18, 0]} castShadow>
        <SoftMaterial color="#333333" />
      </RoundedBox>

      <RoundedBox args={[0.25, 0.55, 0.25]} radius={0.1} smoothness={4} position={[0.28, 0.18, 0]} castShadow>
        <SoftMaterial color="#333333" />
      </RoundedBox>
    </group>
  );
}

function ThirdPersonCamera({ playerRef, keys, mouse }) {
  const { camera } = useThree();

  const direction = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const targetCameraPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const player = playerRef.current;
    if (!player) return;

    const yaw = mouse.current.yaw;
    const pitch = mouse.current.pitch;
    const distance = mouse.current.distance;

    targetCameraPos.set(
      player.position.x + Math.sin(yaw) * distance * Math.cos(pitch),
      player.position.y + 2.8 + Math.sin(pitch) * distance,
      player.position.z + Math.cos(yaw) * distance * Math.cos(pitch)
    );

    camera.position.lerp(targetCameraPos, 0.12);
    camera.lookAt(player.position.x, player.position.y + 1.45, player.position.z);

    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    cameraRight.crossVectors(cameraDirection, up).normalize();

    direction.set(0, 0, 0);

    if (keys.current.w) direction.add(cameraDirection);
    if (keys.current.s) direction.sub(cameraDirection);
    if (keys.current.a) direction.sub(cameraRight);
    if (keys.current.d) direction.add(cameraRight);

    if (direction.length() > 0) {
      direction.normalize().multiplyScalar(0.35);
      player.position.add(direction);
      player.rotation.y = Math.atan2(direction.x, direction.z);
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, -46, 46);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -27, 43);
  });

  return null;
}

function FactoryScene({ onSelect }) {
  const playerRef = useRef();

  const keys = useRef({ w: false, a: false, s: false, d: false });

  const mouse = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    yaw: Math.PI,
    pitch: 0.35,
    distance: 14,
  });

  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = true;
    };

    const up = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = false;
    };

    const mouseDown = (e) => {
      mouse.current.dragging = true;
      mouse.current.lastX = e.clientX;
      mouse.current.lastY = e.clientY;
    };

    const mouseUp = () => {
      mouse.current.dragging = false;
    };

    const mouseMove = (e) => {
      if (!mouse.current.dragging) return;

      const dx = e.clientX - mouse.current.lastX;
      const dy = e.clientY - mouse.current.lastY;

      mouse.current.lastX = e.clientX;
      mouse.current.lastY = e.clientY;

      mouse.current.yaw -= dx * 0.006;
      mouse.current.pitch += dy * 0.004;
      mouse.current.pitch = THREE.MathUtils.clamp(mouse.current.pitch, -0.1, 1.1);
    };

    const wheel = (e) => {
      mouse.current.distance += e.deltaY * 0.015;
      mouse.current.distance = THREE.MathUtils.clamp(mouse.current.distance, 5, 45);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("wheel", wheel, { passive: true });

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("wheel", wheel);
    };
  }, []);

  return (
    <>
      <color attach="background" args={[COLORS.bg]} />

      <ambientLight intensity={0.8} />

      <directionalLight
        castShadow
        position={[30, 45, 25]}
        intensity={2}
        shadow-mapSize={[2048, 2048]}
      />

      <Environment preset="city" />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 8]}>
        <planeGeometry args={[120, 95]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} />
      </mesh>

      <RoundedBox args={[92, 0.05, 5]} radius={0.35} smoothness={6} position={[0, 0.03, 32]} receiveShadow>
        <SoftMaterial color={COLORS.road} />
      </RoundedBox>

      <RoundedBox args={[5, 0.05, 60]} radius={0.35} smoothness={6} position={[-8, 0.04, 5]} receiveShadow>
        <SoftMaterial color={COLORS.road} />
      </RoundedBox>

      <Wall position={[0, 2, -30]} size={[100, 4, 0.5]} />
      <Wall position={[0, 2, 46]} size={[100, 4, 0.5]} />
      <Wall position={[-50, 2, 8]} size={[0.5, 4, 76]} />
      <Wall position={[50, 2, 8]} size={[0.5, 4, 76]} />

      {factoryObjects.map((item, index) => (
        <FactoryObject key={index} item={item} onSelect={onSelect} />
      ))}

      {doors.map((door) => (
        <Door key={door.name} door={door} />
      ))}

      <CartoonPlayer playerRef={playerRef} />
      <ThirdPersonCamera playerRef={playerRef} keys={keys} mouse={mouse} />

      <ContactShadows
        position={[0, 0.03, 8]}
        opacity={0.35}
        scale={95}
        blur={3}
        far={35}
      />

      <Text
        position={[0, 0.15, -34]}
        fontSize={3}
        color={COLORS.dark}
        outlineWidth={0.04}
        outlineColor="white"
      >
        THLA FACTORY
      </Text>
    </>
  );
}

export default function Dashboard() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Canvas
        shadows
        camera={{ position: [0, 8, 60], fov: 50 }}
        gl={{ antialias: true }}
      >
        <FactoryScene onSelect={setSelected} />
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          zIndex: 10,
          padding: "14px 18px",
          background: "rgba(255,255,255,0.9)",
          borderRadius: 20,
          boxShadow: "0 12px 30px rgba(0,0,0,.15)",
          fontWeight: 700,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontSize: 18 }}>THLA Factory 3D</div>
        <div style={{ fontSize: 13 }}>{SCALE_NOTE}</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          W A S D: di chuyển · Giữ chuột: xoay · Lăn chuột: zoom
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 24,
          color: "#2f2b26",
          fontSize: 42,
          fontWeight: 900,
          lineHeight: 0.9,
          fontFamily: "Arial Black, Arial",
          textShadow: "3px 3px 0 #ffffff",
        }}
      >
        THLA
        <br />
        FACTORY
      </div>

      {selected && (
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 24,
            zIndex: 20,
            width: 330,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 18px 40px rgba(0,0,0,.22)",
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute",
              right: 14,
              top: 12,
              border: "none",
              background: "#ff8fa3",
              color: "white",
              borderRadius: 12,
              width: 32,
              height: 32,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <h3 style={{ marginTop: 0, paddingRight: 36 }}>{selected.name}</h3>

          <p><b>Loại:</b> {selected.type}</p>

          {selected.status && <p><b>Trạng thái:</b> {selected.status}</p>}

          {selected.w && selected.d && (
            <p><b>Kích thước thật:</b> {selected.w}m x {selected.d}m</p>
          )}

          <p><b>Tỷ lệ:</b> {SCALE_NOTE}</p>
        </div>
      )}
    </div>
  );
}