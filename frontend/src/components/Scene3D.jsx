import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingParticles({ mouse }) {
  const pointsRef = useRef(null);
  const sphereRef = useRef(null);
  const smallSphereRef = useRef(null);

  const { positions, colors } = useMemo(() => {
    const count = 220;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color("#22d3ee");
    const c2 = new THREE.Color("#6366f1");

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = 4 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.cos(phi) * 0.6;
      pos[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const mix = Math.random();
      const c = c1.clone().lerp(c2, mix);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.035;
      pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.08 + (mouse.current.y || 0) * 0.2;
    }

    if (sphereRef.current) {
      sphereRef.current.position.x = THREE.MathUtils.lerp(
        sphereRef.current.position.x,
        (mouse.current.x || 0) * 1.8,
        0.05
      );
      sphereRef.current.position.y = THREE.MathUtils.lerp(
        sphereRef.current.position.y,
        (mouse.current.y || 0) * 1.2,
        0.05
      );
      sphereRef.current.rotation.y += 0.004;
      sphereRef.current.rotation.x += 0.002;
    }

    if (smallSphereRef.current) {
      smallSphereRef.current.position.x = Math.sin(t * 0.7) * 1.8 - (mouse.current.x || 0) * 0.8;
      smallSphereRef.current.position.y = Math.cos(t * 0.9) * 0.8 - (mouse.current.y || 0) * 0.4;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.045} vertexColors transparent opacity={0.8} depthWrite={false} />
      </points>

      <mesh ref={sphereRef} position={[0, 0, -0.5]}>
        <icosahedronGeometry args={[1.25, 4]} />
        <meshStandardMaterial color="#818cf8" emissive="#4338ca" emissiveIntensity={1.2} metalness={0.05} roughness={0.2} transparent opacity={0.28} />
      </mesh>

      <mesh ref={smallSphereRef} position={[-1.5, 1, 1.2]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={1.4} metalness={0.1} roughness={0.25} transparent opacity={0.42} />
      </mesh>
    </>
  );
}

function Scene3D({ mouse }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 55 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 6]} intensity={1.4} color="#60a5fa" />
        <pointLight position={[-5, -3, 3]} intensity={1.2} color="#22d3ee" />
        <FloatingParticles mouse={mouse} />
      </Canvas>
    </div>
  );
}

export default memo(Scene3D);

