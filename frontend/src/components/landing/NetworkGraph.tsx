import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Data generation                                                    */
/* ------------------------------------------------------------------ */

interface NodeData {
  base: [number, number, number];
  suspicious: boolean;
  speed: number;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
  amp: number;
}

const NODE_COUNT = 72;
const CONN_DIST = 2.4;

function makeNodes(): NodeData[] {
  const out: NodeData[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.5 + Math.random() * 2.6;
    out.push({
      base: [
        r * Math.sin(phi) * Math.cos(theta) * 1.4,
        r * Math.sin(phi) * Math.sin(theta) * 1.1,
        r * Math.cos(phi) * 0.45,
      ],
      suspicious: Math.random() < 0.26,
      speed: 0.1 + Math.random() * 0.2,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
      amp: 0.035 + Math.random() * 0.07,
    });
  }
  return out;
}

function makeConns(nodes: NodeData[]): [number, number][] {
  const conns: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const [ax, ay, az] = nodes[i].base;
      const [bx, by, bz] = nodes[j].base;
      const d = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
      if (d < CONN_DIST) conns.push([i, j]);
    }
  }
  return conns;
}

/* ------------------------------------------------------------------ */
/*  Colors — brighter, more vivid                                      */
/* ------------------------------------------------------------------ */
const COL_NORMAL = new THREE.Color("#4da6ff");
const COL_NORMAL_EMISSIVE = new THREE.Color("#2288ee");
const COL_SUSPICIOUS = new THREE.Color("#ff7040");
const COL_SUSPICIOUS_EMISSIVE = new THREE.Color("#ff4400");
const COL_LINE = "#2266aa";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NetworkGraph() {
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const globeRef = useRef<THREE.Mesh>(null!);
  const currentPos = useRef<Float32Array>(new Float32Array(NODE_COUNT * 3));

  const { nodes, conns, lineGeo } = useMemo(() => {
    const n = makeNodes();
    const c = makeConns(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(c.length * 6), 3),
    );
    return { nodes: n, conns: c, lineGeo: geo };
  }, []);

  /* animation loop */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cp = currentPos.current;

    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i];
      const x =
        nd.base[0] + Math.sin(t * nd.speed + nd.phaseX) * nd.amp;
      const y =
        nd.base[1] + Math.cos(t * nd.speed * 0.85 + nd.phaseY) * nd.amp;
      const z =
        nd.base[2] +
        Math.sin(t * nd.speed * 0.6 + nd.phaseZ) * nd.amp * 0.5;
      cp[i * 3] = x;
      cp[i * 3 + 1] = y;
      cp[i * 3 + 2] = z;
      nodeRefs.current[i]?.position.set(x, y, z);
      glowRefs.current[i]?.position.set(x, y, z);
    }

    /* update connection lines */
    const arr = lineGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < conns.length; i++) {
      const [a, b] = conns[i];
      arr[i * 6] = cp[a * 3];
      arr[i * 6 + 1] = cp[a * 3 + 1];
      arr[i * 6 + 2] = cp[a * 3 + 2];
      arr[i * 6 + 3] = cp[b * 3];
      arr[i * 6 + 4] = cp[b * 3 + 1];
      arr[i * 6 + 5] = cp[b * 3 + 2];
    }
    lineGeo.attributes.position.needsUpdate = true;

    /* globe rotation */
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.02;
      globeRef.current.rotation.x = 0.15 + Math.sin(t * 0.035) * 0.025;
    }
  });

  return (
    <group>
      {/* wireframe globe — subtle backdrop */}
      <mesh ref={globeRef} rotation={[0.15, 0, 0.08]}>
        <sphereGeometry args={[2.8, 28, 16]} />
        <meshBasicMaterial
          color="#0e3355"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* connection lines — brighter, sharper */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color={COL_LINE}
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* nodes + glow halos */}
      {nodes.map((nd, i) => {
        const col = nd.suspicious ? COL_SUSPICIOUS : COL_NORMAL;
        const emi = nd.suspicious
          ? COL_SUSPICIOUS_EMISSIVE
          : COL_NORMAL_EMISSIVE;
        const coreSize = nd.suspicious ? 0.06 : 0.042;
        const glowSize = nd.suspicious ? 0.22 : 0.13;
        return (
          <group key={i}>
            {/* solid bright core */}
            <mesh
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              position={nd.base}
            >
              <sphereGeometry args={[coreSize, 14, 14]} />
              <meshStandardMaterial
                color={col}
                emissive={emi}
                emissiveIntensity={nd.suspicious ? 3.0 : 1.5}
                metalness={0.2}
                roughness={0.3}
              />
            </mesh>
            {/* outer glow halo */}
            <mesh
              ref={(el) => {
                glowRefs.current[i] = el;
              }}
              position={nd.base}
            >
              <sphereGeometry args={[glowSize, 10, 10]} />
              <meshBasicMaterial
                color={col}
                transparent
                opacity={nd.suspicious ? 0.22 : 0.1}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
