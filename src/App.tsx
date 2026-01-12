import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Sphere, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * The "Liquid" Sphere Component
 */
const AnimatedBlob = ({ baseColor }: { baseColor: string }) => {
  // We use the ! assertion because we know the ref will be assigned by the time useFrame runs
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const playSound = () => {
    const audioCtx = new window.AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Create a "sci-fi" drop sound effect
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // Rotate the blob gently
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;

      // Animate scale based on click state
      const targetScale = active ? 1.5 : 1;
      // We create a temporary Vector3 for the target to avoid memory leaks in the loop
      const targetVector = new THREE.Vector3(targetScale, targetScale, targetScale);
      meshRef.current.scale.lerp(targetVector, 0.1);
    }
  });

  return (
    <Sphere
      ref={meshRef}
      args={[1, 64, 64]}
      onClick={() => {
        setActive(!active);
        playSound();
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <MeshDistortMaterial
        color={hovered ? 'white' : baseColor}
        attach="material"
        distort={active ? 0.9 : 0.4}
        speed={active ? 4 : 1.5}
        roughness={0.2}
        metalness={0.9}
      />
    </Sphere>
  );
};

/**
 * Types for the Particle component
 */
interface ParticleProps {
  factor: number;
  speed: number;
  xFactor: number;
  yFactor: number;
  zFactor: number;
}

const Particle = ({ factor, speed, xFactor, yFactor, zFactor }: ParticleProps) => {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Update position based on math
    ref.current.position.x = Math.cos(t * speed + xFactor) * (factor / 10);
    ref.current.position.y = Math.sin(t * speed + yFactor) * (factor / 10);
    ref.current.position.z = Math.cos(t * speed + zFactor) * (factor / 10);
    
    // Rotate the particle
    ref.current.rotation.z += 0.01;
    ref.current.rotation.x += 0.01;
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="teal" transparent opacity={0.6} />
    </mesh>
  );
};

/**
 * Background Particles Manager
 */
const FloatingParticles = ({ count = 50 }: { count?: number }) => {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  return (
    <>
      {particles.map((particle, i) => (
        <Particle key={i} {...particle} />
      ))}
    </>
  );
};

/**
 * UI Overlay Component
 */
interface UIProps {
  isPlaying: boolean;
  onToggleAudio: () => void;
  color: string;
  onChangeColor: (color: string) => void;
}

const UI = ({ isPlaying, onToggleAudio, color, onChangeColor }: UIProps) => {

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          pointerEvents: 'none',
          color: '#eee',
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(4px)',
          padding: '15px',
          borderRadius: '12px',
          fontFamily: 'system-ui, sans-serif',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Controls</h3>
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <li><strong>Hover</strong> to change reflection</li>
          <li><strong>Click</strong> to distort shape</li>
          <li><strong>Drag</strong> to rotate view</li>
        </ul>

        <div style={{ marginTop: '10px', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="color-picker" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Color</label>
          <input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => onChangeColor(e.target.value)}
            style={{
              cursor: 'pointer',
              border: 'none',
              height: '24px',
              width: '40px',
              padding: 0,
              background: 'none'
            }}
          />
        </div>
      </div>

      <button
        onClick={onToggleAudio}
        style={{
          position: 'absolute',
          bottom: 30,
          left: 30,
          zIndex: 20,
          pointerEvents: 'auto',
          background: isPlaying ? '#ff0055' : '#4400ff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        }}
      >
        {isPlaying ? 'STOP SOUND' : 'PLAY SOUND'}
      </button>
    </>
  );
};

/**
 * Main Scene Component
 */
export default function LiquidMetalScene() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blobColor, setBlobColor] = useState('#888888');

  const toggleAudio = () => {
    // 1. If context exists, toggle suspend/resume
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
        setIsPlaying(false);
      } else {
        audioContextRef.current.resume();
        setIsPlaying(true);
      }
      return;
    }

    // 2. If no context, create it (First start)
    const ctx = new window.AudioContext();
    audioContextRef.current = ctx;

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15; // Subtle volume
    masterGain.connect(ctx.destination);

    // Carrier: The "singing" tone
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 440; // A4 (Ethereal pitch)

    // Modulator: Creates the slow, weird pitch drift
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = 0.15; // Very slow drift

    // Modulator Gain: How far the pitch bends
    const modGain = ctx.createGain();
    modGain.gain.value = 30; // +/- 30Hz drift

    // Delay: Adds the "space" echo
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.6;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;

    // Connections
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // FM Synthesis

    carrier.connect(masterGain);
    carrier.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);

    // Bass Layer: Deep drone
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 55; // Deep sub-bass
    
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.2; // Lower base volume

    // LFO: Creates the rhythmic heartbeat pulse
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.6; // 36 BPM (Slow deep breath)
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2; // Pulse depth

    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);

    bass.connect(bassGain);
    bassGain.connect(masterGain);
    
    bass.start();
    lfo.start();

    carrier.start();
    modulator.start();
    setIsPlaying(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111', position: 'relative' }}>
      <UI 
        isPlaying={isPlaying} 
        onToggleAudio={toggleAudio} 
        color={blobColor} 
        onChangeColor={setBlobColor} 
      />
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="red" />
        <Environment preset="warehouse" />

        <AnimatedBlob baseColor={blobColor} />
        <FloatingParticles count={30} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <OrbitControls enableZoom={false} />

        <EffectComposer>
          <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} intensity={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
