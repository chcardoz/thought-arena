"use client"

import { useState, useEffect, useRef } from "react";
import { Mic } from 'lucide-react';
import * as d3 from 'd3';
import { useAudioRecording } from "@/app/hooks/useAudioRecording";
import useSWR,{mutate} from 'swr'

interface Node extends d3.SimulationNodeDatum {
  radius: number;
  text?: string;
}

const fetcher = async (url:string,blob:Blob) => {
  const formData = new FormData();
  formData.append('audio',blob)
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export default function Home() {
  const [isPressed, setIsPressed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const [currentAudioBlob,setCurrentAudioBlob] = useState<Blob|null>(null)

  const {data: transcription} = useSWR(
    currentAudioBlob ? ['/api/transcribe',currentAudioBlob] : null,
    ([url, blob]) => fetcher(url,blob),
  )

  useEffect(() => {
    if (transcription && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newNode = {
        x: position.x - rect.left,
        y: position.y - rect.top,
        radius: 50,
        text: transcription.text
      }

      nodesRef.current = [...nodesRef.current, newNode];
      simulationRef.current?.nodes(nodesRef.current);
      simulationRef.current?.alpha(1).restart();
      setCurrentAudioBlob(null);
    }
  },[transcription,position])

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d')!;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    simulationRef.current = d3.forceSimulation<Node>()
      .force('collision', d3.forceCollide<Node>().radius(d => d.radius))
      .force('charge', d3.forceManyBody<Node>().strength(5))
      .on('tick', () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        nodesRef.current.forEach(node => {
          context.beginPath();
          context.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, 2 * Math.PI);
          context.fillStyle = 'rgba(59, 130, 246, 0.5)';
          context.fill();
          
          if (node.text) {
            context.font = '14px Arial';
            context.fillStyle = 'black';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(node.text, node.x ?? 0, node.y ?? 0);
          }
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

    const handleMouseDown = async () => {
      setIsPressed(true);
      await startRecording();
    };

    const handleMouseUp = async () => {
      setIsPressed(false);
      const audioBlob = await stopRecording();
      setCurrentAudioBlob(audioBlob);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [startRecording, stopRecording]);

  return (
    <div className="relative w-full h-screen overflow-hidden cursor-none">
      <h1 className="fixed left-[calc(50%-9rem)] top-6 text-3xl font-bold text-gray-800 drop-shadow-2xl">THOUGHT ARENA</h1>
      <div className="w-full h-full bg-gray-100 p-5">
        <canvas ref={canvasRef} className="w-full h-full bg-white rounded-lg shadow-lg" />
      </div>
      
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
