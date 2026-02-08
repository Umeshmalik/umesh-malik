import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function FloatingShape({ position, color, shape, speed }: {
  position: [number, number, number];
  color: string;
  shape: 'icosahedron' | 'torus' | 'box' | 'octahedron' | 'dodecahedron';
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useRef(position);
  const timeOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed + timeOffset.current;
    meshRef.current.rotation.x = t * 0.3;
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.position.y = initialPos.current[1] + Math.sin(t) * 0.3;
    meshRef.current.position.x = initialPos.current[0] + Math.cos(t * 0.7) * 0.15;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case 'icosahedron': return <icosahedronGeometry args={[0.4, 0]} />;
      case 'torus': return <torusGeometry args={[0.3, 0.12, 8, 12]} />;
      case 'box': return <boxGeometry args={[0.45, 0.45, 0.45]} />;
      case 'octahedron': return <octahedronGeometry args={[0.35, 0]} />;
      case 'dodecahedron': return <dodecahedronGeometry args={[0.35, 0]} />;
    }
  }, [shape]);

  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ff41"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

const shapes: Array<{
  position: [number, number, number];
  color: string;
  shape: 'icosahedron' | 'torus' | 'box' | 'octahedron' | 'dodecahedron';
  speed: number;
}> = [
  { position: [-3, 1.5, -2], color: '#00ff41', shape: 'icosahedron', speed: 0.4 },
  { position: [3.5, -1, -3], color: '#1084d0', shape: 'torus', speed: 0.3 },
  { position: [-2, -1.5, -1], color: '#ffb000', shape: 'box', speed: 0.5 },
  { position: [2, 2, -4], color: '#ff0080', shape: 'octahedron', speed: 0.35 },
  { position: [0, 0, -5], color: '#00aaaa', shape: 'dodecahedron', speed: 0.25 },
  { position: [-4, 0, -3], color: '#aaaaff', shape: 'icosahedron', speed: 0.45 },
  { position: [4, 1, -2], color: '#ff6600', shape: 'torus', speed: 0.55 },
];

export default function FloatingShapes() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <Particles />
        {shapes.map((shape, i) => (
          <FloatingShape key={i} {...shape} />
        ))}
      </Canvas>
    </div>
  );
}
