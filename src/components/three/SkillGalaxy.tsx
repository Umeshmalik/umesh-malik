import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { skills } from '../../data/resume';

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#00ff41',
  backend: '#1084d0',
  tools: '#ffb000',
  concepts: '#ff0080',
  ai: '#a855f7',
};

const CATEGORY_POSITIONS: Record<string, [number, number, number]> = {
  frontend: [-3, 1.5, 0],
  backend: [3, 1.5, 0],
  tools: [-3, -2, 0],
  concepts: [3, -2, 0],
  ai: [0, 3, -1],
};

function SkillOrb({
  name,
  category,
  proficiency,
  index,
}: {
  name: string;
  category: string;
  proficiency: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const base = CATEGORY_POSITIONS[category] || [0, 0, 0];
  const color = CATEGORY_COLORS[category] || '#ffffff';
  const size = 0.15 + (proficiency / 100) * 0.2;

  const position: [number, number, number] = useMemo(() => {
    const angle = (index * 1.2) + Math.random() * 0.5;
    const radius = 1 + Math.random() * 1.5;
    return [
      base[0] + Math.cos(angle) * radius,
      base[1] + Math.sin(angle) * radius,
      (Math.random() - 0.5) * 2,
    ];
  }, [base, index]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + index) * 0.1;
    const scale = hovered ? 1.5 : 1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      {hovered && (
        <Html position={[position[0], position[1] + size + 0.3, position[2]]} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.9)',
              border: `1px solid ${color}`,
              padding: '8px 12px',
              fontFamily: "'VT323', monospace",
              fontSize: '14px',
              color,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{name}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Proficiency: {proficiency}%
            </div>
            <div
              style={{
                width: '80px',
                height: '4px',
                background: '#333',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: `${proficiency}%`,
                  height: '100%',
                  background: color,
                }}
              />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function CategoryLabel({ category, position }: { category: string; position: [number, number, number] }) {
  const color = CATEGORY_COLORS[category] || '#ffffff';
  const labels: Record<string, string> = {
    frontend: 'FRONTEND NEBULA',
    backend: 'BACKEND CLUSTER',
    tools: 'TOOLS RING',
    concepts: 'CONCEPTS CORE',
    ai: 'AI SUPERNOVA',
  };

  return (
    <Text
      position={[position[0], position[1] + 2.5, position[2]]}
      fontSize={0.2}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2"
    >
      {labels[category] || category}
    </Text>
  );
}

function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function ConnectionLines() {
  const categories = Object.keys(CATEGORY_POSITIONS);
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const p1 = CATEGORY_POSITIONS[categories[i]];
      const p2 = CATEGORY_POSITIONS[categories[j]];
      points.push(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#333333" transparent opacity={0.3} />
    </lineSegments>
  );
}

export default function SkillGalaxy() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={0.5} />
        <StarField />
        <ConnectionLines />
        {Object.keys(CATEGORY_POSITIONS).map((cat) => (
          <CategoryLabel key={cat} category={cat} position={CATEGORY_POSITIONS[cat]} />
        ))}
        {skills.map((skill, i) => (
          <SkillOrb
            key={skill.name}
            name={skill.name}
            category={skill.category}
            proficiency={skill.proficiency}
            index={i}
          />
        ))}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={4}
          maxDistance={20}
        />
      </Canvas>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          fontFamily: "'VT323', monospace",
          fontSize: '14px',
          color: '#aaa',
        }}
      >
        <div style={{ marginBottom: '8px', fontSize: '12px', fontFamily: "'Press Start 2P', monospace" }}>
          SKILL GALAXY
        </div>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ textTransform: 'uppercase' }}>{cat}</span>
          </div>
        ))}
        <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.6 }}>
          Drag to rotate | Scroll to zoom | Hover for details
        </div>
      </div>
    </div>
  );
}
