'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, X } from 'lucide-react';
import * as d3 from 'd3';
import { useAudioRecording } from '@/app/hooks/useAudioRecording';
import useSWR from 'swr';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  text: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

const fetcher = async (url: string, body: any, options: RequestInit = {}) => {
  const { headers = {}, ...restOptions } = options;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...restOptions,
  });

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
};

export default function Home() {
  const [isPressed, setIsPressed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef({ nodes, links });
  useEffect(() => {
    stateRef.current = { nodes, links };
  }, [nodes, links]);

  const { data: transcription, mutate: mutateTranscription } = useSWR(
    currentAudioBlob ? ['/api/transcribe', currentAudioBlob] : null,
    ([url, blob]) => {
      const formData = new FormData();
      formData.append('audio', blob);
      return fetcher(url, formData);
    },
    { 
      onSuccess: () => setIsLoading(false),
      onError: (err) => setError(err.message),
      revalidateOnFocus: false, // Prevent revalidation on window focus
      revalidateOnReconnect: false // Prevent revalidation on reconnect
    }
  );

  const { data: transformedData } = useSWR(
    transcription ? ['/api/transform', transcription] : null, // Remove nodes and links from key
    ([url, transcriptionData]) =>
      fetcher(url, {
        transcription: transcriptionData,
        nodes: stateRef.current.nodes,
        links: stateRef.current.links
      }),
    {
      onSuccess: () => setIsLoading(false),
      onError: (err) => setError(err.message),
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  useEffect(() => {
    if (!transformedData) return;
    const newNodes = transformedData.nodes;
    const newLinks = transformedData.links;

    const nodeIds = new Set(newNodes.map((node: Node) => node.id));
    const filteredLinks = newLinks.filter(
      (link: Link) =>
        nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    );

    setNodes(newNodes);
    setLinks(filteredLinks);
  }, [transformedData]);

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

    simulationRef.current = d3
      .forceSimulation<Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>()
          .id((d) => d.id)
          .links(links)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(canvas.width / 2, canvas.height / 2))
      .on('tick', () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        links.forEach((link) => {
          const source = link.source as Node;
          const target = link.target as Node;
          context.beginPath();
          context.moveTo(source.x ?? 0, source.y ?? 0);
          context.lineTo(target.x ?? 0, target.y ?? 0);
          context.strokeStyle = '#ccc';
          context.stroke();
        });

        nodes.forEach((node) => {
          const haloRadius = 50;
          const gradient = context.createRadialGradient(
            node.x ?? 0,
            node.y ?? 0,
            0,
            node.x ?? 0,
            node.y ?? 0,
            haloRadius
          );
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');

          context.beginPath();
          context.arc(node.x ?? 0, node.y ?? 0, haloRadius, 0, 2 * Math.PI);
          context.fillStyle = gradient;
          context.fill();

          const maxWidth = 90;
          const lineHeight = 18;
          const words = node.text.split(' ');
          let line = '';
          const lines: string[] = [];

          words.forEach((word) => {
            const testLine = line + word + ' ';
            if (context.measureText(testLine).width > maxWidth && line) {
              lines.push(line);
              line = word + ' ';
            } else {
              line = testLine;
            }
          });
          lines.push(line);

          context.font = '16px Arial';
          context.fillStyle = 'black';
          context.textAlign = 'center';
          context.textBaseline = 'middle';

          lines.forEach((line, index) => {
            context.fillText(
              line,
              node.x ?? 0,
              (node.y ?? 0) -
                (lines.length / 2) * lineHeight +
                index * lineHeight
            );
          });
        });
      });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      simulationRef.current?.stop();
    };
  }, [nodes, links]);

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
      <h1 className="fixed left-[calc(50%-9rem)] top-6 text-3xl font-bold text-gray-800 drop-shadow-2xl">
        THOUGHT ARENA
      </h1>
      <div className="w-full h-full bg-gray-100 p-5">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            Loading...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <X className="mx-auto text-red-500" size={48} />
              <p className="mt-4 text-lg text-red-500">{error}</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white rounded-lg shadow-lg"
        />
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
          <Mic className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}
