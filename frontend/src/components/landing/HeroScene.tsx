import { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NetworkGraph } from "./NetworkGraph";
import { MagnifierScanner } from "./MagnifierScanner";

/* ------------------------------------------------------------------ */
/* Background star-field particles                                    */
/* ------------------------------------------------------------------ */
function BackgroundParticles() {
  const count = 300;

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 28;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
    }

    return p;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>

      <pointsMaterial
        size={0.022}
        color="#4488bb"
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Very subtle camera drift                                           */
/* ------------------------------------------------------------------ */
function CameraMotion() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();

    camera.position.x = Math.sin(t * 0.06) * 0.08;
    camera.position.y = Math.cos(t * 0.05) * 0.06;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Floating Labels                                                    */
/* ------------------------------------------------------------------ */
const LABELS = [
  { name: "Vendor A", risk: "Medium", pos: [0.8, 2.9, 0.2] },
  { name: "New Account 1254", risk: "High", pos: [-2.1, 2.1, 0.1] },
  { name: "New Beneficiary", risk: "High", pos: [3.7, 1.1, 0] },
  { name: "Payment Gateway", risk: "Medium", pos: [3.9, 2.5, 0] },
  { name: "Employee Y", risk: "Low", pos: [-0.7, -2.3, 0.1] },
  { name: "Offshore Account", risk: "High", pos: [0.5, -3.1, 0] },
  { name: "Unusual Location", risk: "High", pos: [-2.7, -0.5, 0.1] },
  { name: "Vendor B", risk: "Medium", pos: [3.9, -1.3, 0] },
];

const riskDot: Record<string, string> = {
  High: "#ff3d3d",
  Medium: "#ff8800",
  Low: "#44cc66",
};

function FloatingLabels() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y += Math.sin(t * 0.35 + i * 1.2) * 0.0002;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {LABELS.map((l, i) => (
        <Html
          key={i}
          center
          position={l.pos as [number, number, number]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[0, 0]}
        >
          <div
            style={{
              background: "rgba(6,12,24,0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "5px 10px 6px",
              whiteSpace: "nowrap",
              opacity: 0.94,
            }}
          >
            <div
              style={{
                color: "#e0e0e0",
                fontSize: 10.5,
                fontWeight: 500,
              }}
            >
              {l.name}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: riskDot[l.risk],
                }}
              />

              <span
                style={{
                  fontSize: 8.5,
                  color: riskDot[l.risk],
                  fontWeight: 600,
                }}
              >
                Risk: {l.risk}
              </span>
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene Content with Mouse Parallax                                  */
/* ------------------------------------------------------------------ */
function SceneContent() {
  const groupRef = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y +=
        (mouse.current.x * 0.08 - groupRef.current.rotation.y) * 0.03;

      groupRef.current.rotation.x +=
        (-mouse.current.y * 0.05 - groupRef.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <NetworkGraph />
      <FloatingLabels />
      <MagnifierScanner />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Main Hero Scene                                                    */
/* ------------------------------------------------------------------ */
export function HeroScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full" />;

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.18} />

      <directionalLight
        position={[6, 5, 6]}
        intensity={0.8}
        color="#ffffff"
      />

      <directionalLight
        position={[-5, 3, 4]}
        intensity={0.3}
        color="#4488ff"
      />

      <directionalLight
        position={[0, -3, -4]}
        intensity={0.15}
        color="#6688cc"
      />

      <pointLight
        position={[0.3, 0.2, 3]}
        intensity={2.0}
        color="#ff6600"
        distance={8}
        decay={2}
      />

      <pointLight
        position={[-2, -1, 2]}
        intensity={0.4}
        color="#3366cc"
        distance={6}
        decay={2}
      />

      <CameraMotion />
      <BackgroundParticles />
      <SceneContent />
    </Canvas>
  );
}