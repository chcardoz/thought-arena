"use client"

import { useState, useEffect, useRef } from "react";
import { Mic } from 'lucide-react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  radius: number;
}

export default function Home() {
  const [isPressed, setIsPressed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d')!;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize simulation
    simulationRef.current = d3.forceSimulation<Node>()
      .force('collision', d3.forceCollide<Node>().radius(d => d.radius))
      .force('charge', d3.forceManyBody<Node>().strength(5))
      .on('tick', () => {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw nodes
        nodesRef.current.forEach(node => {
          context.beginPath();
          context.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, 2 * Math.PI);
          context.fillStyle = 'rgba(59, 130, 246, 0.5)'; // blue-500 with opacity
          context.fill();
        });
      });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      simulationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsPressed(true);
      setPressStartTime(Date.now());
    };

    const handleMouseUp = () => {
      setIsPressed(false);
      if (pressStartTime && canvasRef.current) {
        const pressDuration = Date.now() - pressStartTime;
        const radius = Math.min(Math.max(pressDuration / 50, 10), 50); // Convert duration to radius (min 10, max 50)
        
        const rect = canvasRef.current.getBoundingClientRect();
        const newNode = {
          x: position.x - rect.left,
          y: position.y - rect.top,
          radius: radius
        };
        
        nodesRef.current = [...nodesRef.current, newNode];
        simulationRef.current?.nodes(nodesRef.current);
        simulationRef.current?.alpha(1).restart();
      }
      setPressStartTime(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, pressStartTime]);

  return (
    <div className="relative w-full h-screen overflow-hidden cursor-none">
      {/* Canvas Container */}
      <div className="w-full h-full bg-white border border-gray-200 shadow-lg">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      {/* Floating Microphone that follows cursor */}
      <div 
        className="fixed pointer-events-none"
        style={{ 
          left: position.x - 24,
          top: position.y - 24,
        }}
      >
        <div
          className={`p-4 rounded-full bg-blue-500 transition-all duration-200 ${
            isPressed ? 'bg-blue-700 scale-125' : 'bg-blue-500 scale-100'
          }`}
        >
          <Mic 
            className="text-white" 
            size={24}
          />
        </div>
      </div>
    </div>
  );
}
