import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const RIM_R = 1.35;

/* ================================================================== */
/*  Shared inline styles for the card content                         */
/* ================================================================== */

const cardContentBlock = (bright: boolean) => {
  const textCol = bright ? "#ffffff" : "#bbbbbb";
  const labelCol = bright ? "#999" : "#666";
  const accentCol = bright ? "#ff7700" : "#cc5500";
  const riskCol = bright ? "#ff4400" : "#bb3300";
  const headSize = bright ? 12 : 10;
  const amountSize = bright ? 20 : 15;
  const timeSize = bright ? 15 : 12;
  const riskSize = bright ? 15 : 12;
  const iconSize = bright ? 46 : 34;
  const glow = bright
    ? "0 0 14px rgba(255,100,0,0.35)"
    : "none";

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        userSelect: "none",
        textAlign: "center",
        filter: bright ? "contrast(1.1) brightness(1.08)" : "none",
      }}
    >
      {/* warning icon */}
      <div style={{ marginBottom: bright ? 6 : 4 }}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 42 42"
          fill="none"
        >
          <path
            d="M21 5L4 37h34L21 5z"
            stroke={accentCol}
            strokeWidth="2"
            fill={bright ? "rgba(255,100,0,0.12)" : "rgba(255,100,0,0.06)"}
          />
          <text
            x="21"
            y="31"
            textAnchor="middle"
            fill={accentCol}
            fontSize="17"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            !
          </text>
        </svg>
      </div>

      <p
        style={{
          margin: `0 0 ${bright ? 8 : 6}px`,
          color: accentCol,
          fontSize: headSize,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          textShadow: glow,
        }}
      >
        High Risk Transaction
      </p>

      <p
        style={{
          margin: 0,
          color: labelCol,
          fontSize: bright ? 10 : 8,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        Amount
      </p>
      <p
        style={{
          margin: `1px 0 ${bright ? 8 : 6}px`,
          color: textCol,
          fontSize: amountSize,
          fontWeight: 700,
          textShadow: bright ? "0 0 8px rgba(255,255,255,0.15)" : "none",
        }}
      >
        ₹ 4,32,850
      </p>

      <p
        style={{
          margin: 0,
          color: labelCol,
          fontSize: bright ? 10 : 8,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        Time
      </p>
      <p
        style={{
          margin: `1px 0 ${bright ? 10 : 6}px`,
          color: textCol,
          fontSize: timeSize,
          fontWeight: 500,
        }}
      >
        02:14 PM
      </p>

      <p
        style={{
          margin: 0,
          color: riskCol,
          fontSize: riskSize,
          fontWeight: 700,
          textShadow: bright ? "0 0 12px rgba(255,68,0,0.3)" : "none",
        }}
      >
        Risk Score:&ensp;
        <span style={{ fontSize: riskSize + 2 }}>92/100</span>
      </p>
    </div>
  );
};

/* ================================================================== */
/*  Tilted fraud card (behind lens)                                    */
/* ================================================================== */

export function FraudCard() {
  const ref = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = -0.05 + Math.sin(t * 0.12) * 0.03;
      ref.current.rotation.x = -0.14 + Math.sin(t * 0.08) * 0.004;
    }
  });

  return (
    <group ref={ref} position={[0.3, -0.05, 0.4]} rotation={[-0.14, -0.08, 0.02]}>
      <Html
        center
        transform
        distanceFactor={5.5}
        style={{ pointerEvents: "none" }}
        zIndexRange={[0, 0]}
      >
        <div
          style={{
            width: 225,
            background:
              "linear-gradient(150deg, rgba(8,14,28,0.92), rgba(12,18,32,0.88))",
            border: "1px solid rgba(255,100,0,0.18)",
            borderRadius: 16,
            padding: "20px 22px 22px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,80,0,0.06)",
          }}
        >
          {cardContentBlock(false)}
        </div>
      </Html>
    </group>
  );
}

/* ================================================================== */
/*  Magnifying glass + circular magnified lens                         */
/* ================================================================== */

export function MagnifierScanner() {
  const groupRef = useRef<THREE.Group>(null!);
  const rimRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      /* slow circular orbit over the card */
      groupRef.current.position.x = 0.25 + Math.cos(t * 0.38) * 0.22;
      groupRef.current.position.y = 0.12 + Math.sin(t * 0.38) * 0.15;
      groupRef.current.position.z = 2.0 + Math.sin(t * 0.08) * 0.05;
      groupRef.current.rotation.z = -0.35 + Math.sin(t * 0.35) * 0.025;
    }

    if (rimRef.current) {
      (rimRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 1.2) * 0.22;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.2 + Math.sin(t * 1.2) * 0.07;
    }
  });

  /* lens circle diameter in CSS px (matched to distanceFactor) */
  const lensPx = 215;

  return (
    <group ref={groupRef} rotation={[0, 0, -0.35]}>
      {/* ---- LAYER 1: Outer diffuse glow ---- */}
      <mesh ref={glowRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[RIM_R + 0.15, 0.05, 8, 96]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ---- LAYER 2: Outer chrome border ---- */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[RIM_R + 0.04, 0.085, 32, 96]} />
        <meshStandardMaterial
          color="#888888"
          emissive="#222222"
          emissiveIntensity={0.15}
          metalness={0.98}
          roughness={0.06}
        />
      </mesh>

      {/* ---- LAYER 3: Main copper rim ---- */}
      <mesh ref={rimRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[RIM_R, 0.1, 32, 96]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ff6600"
          emissiveIntensity={0.7}
          metalness={1}
          roughness={0.05}
        />
      </mesh>

      {/* ---- LAYER 4: Inner dark ring ---- */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[RIM_R - 0.08, 0.05, 24, 96]} />
        <meshStandardMaterial
          color="#1a1a1a"
          emissive="#ff3300"
          emissiveIntensity={0.06}
          metalness={0.9}
          roughness={0.18}
        />
      </mesh>

      {/* ---- LAYER 5: Inner accent glow ---- */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[RIM_R - 0.12, 0.018, 8, 96]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ---- GLASS LENS (translucent dark) ---- */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[RIM_R - 0.1, 96]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          transmission={1}
          thickness={2}
          ior={1.52}
          metalness={0}
          roughness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          reflectivity={1}
          envMapIntensity={1.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ---- HANDLE ---- */}
      <group position={[0, -RIM_R - 0.02, 0]}>
        {/* chrome collar */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.14, 0.11, 0.18, 24]} />
          <meshStandardMaterial color="#999" metalness={0.97} roughness={0.06} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 24]} />
          <meshStandardMaterial color="#666" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* glossy black shaft */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 1.8, 24]} />
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.08} emissive="#cccccc" emissiveIntensity={0.08} />
        </mesh>
        {/* grip rings */}
        {[-0.5, -0.36, -0.22, -0.08, 0.06, 0.2, 0.34, 0.48].map((y, i) => (
          <mesh key={i} position={[0, -1.5 + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.092, 0.006, 8, 24]} />
            <meshStandardMaterial color="#dddddd" metalness={0.88} roughness={0.25} />
          </mesh>
        ))}
        {/* end cap */}
        <mesh position={[0, -2.15, 0]}>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial color="#555" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>

      {/* ==============================================================
          MAGNIFIED CONTENT — circular lens showing enlarged card details
          ============================================================== */}
      <Html
        center
        transform
        distanceFactor={3.8}
        position={[0, 0, 0.06]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: lensPx,
            height: lensPx,
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            background:
              "radial-gradient(circle at 45% 40%, rgba(255,255,255,0.03) 0%, rgba(10,16,30,0.08) 100%)",
          }}
        >
          {/* magnified card content */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: lensPx * 0.78,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {cardContentBlock(true)}
          </div>

          {/* glass reflection highlight (top-left) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 30%, transparent 55%)",
              pointerEvents: "none",
            }}
          />

          {/* edge vignette for lens curvature */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "50%",
              boxShadow:
                "inset 0 0 35px rgba(0,0,0,0.7), inset 0 0 70px rgba(0,0,0,0.3), inset 0 0 4px rgba(255,100,0,0.08)",
              pointerEvents: "none",
            }}
          />
        </div>
      </Html>
    </group>
  );
}
