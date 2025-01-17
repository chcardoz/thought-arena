'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  reconnectEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useCallback } from 'react';
import CustomNode from './custom-node';
import { useAudioRecording } from '../hooks/useAudioRecording';
import useSWR from 'swr';
import { fetcher } from '../utils';
import { LoadingOverlay } from './overlays/loadingoverlay';
import { ErrorOverlay } from './overlays/erroroverlay';

const initNodes = [
  {
    id: '1',
    type: 'custom',
    data: { name: 'Yerba Buena' },
    position: { x: 0, y: 50 },
  },
  {
    id: '2',
    type: 'custom',
    data: { name: 'Tyler Weary' },
    position: { x: -200, y: 200 },
  },
  {
    id: '3',
    type: 'custom',
    data: { name: 'Kristi Price' },
    position: { x: 200, y: 200 },
  },
];

const initEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#760014',
    },
    style: {
      strokeWidth: 2,
      stroke: '#EF233C',
    },
    animated: true,
    label: 'boss of',
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#760014',
    },
    style: {
      strokeWidth: 2,
      stroke: '#EF233C',
    },
    animated: true,
    label: 'friends with',
  },
];

const nodeTypes = {
  custom: CustomNode,
};

export default function MainContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef({ nodes, edges });
  useEffect(() => {
    stateRef.current = { nodes, edges };
    console.log(stateRef.current);
  }, [nodes, edges]);

  const onReconnect = useCallback(
    (oldEdge, newConnection) =>
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  const toggleRecording = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      setCurrentAudioBlob(audioBlob);
      setIsTranscribing(true);
    } else {
      startRecording();
    }
  };

  const { data: transcription } = useSWR(
    currentAudioBlob ? ['/api/transcribe', currentAudioBlob] : null,
    ([url, blob]) => {
      const formData = new FormData();
      formData.append('audio', blob);
      return fetcher(url, formData);
    },
    {
      onSuccess: () => {
        setIsTranscribing(false);
        setIsTransforming(true);
      },
      onError: (err) => {
        setError(err.message);
        setIsTranscribing(false);
      },
      revalidateOnFocus: false, // Prevent revalidation on window focus
      revalidateOnReconnect: false, // Prevent revalidation on reconnect
    },
  );

  const { data: transformedData } = useSWR(
    transcription ? ['/api/transform', transcription] : null,
    ([url, transcriptionData]) =>
      fetcher(url, {
        transcription: transcriptionData,
        nodes: stateRef.current.nodes,
        links: stateRef.current.edges,
      }),
    {
      onSuccess: () => setIsTransforming(false),
      onError: (err) => {
        setError(err.message);
        setIsTransforming(false);
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  useEffect(() => {
    if (transformedData) {
      const { nodes: updatedNodes, links: updatedLinks } = transformedData;

      if (Array.isArray(updatedNodes) && Array.isArray(updatedLinks)) {
        setNodes(updatedNodes);
        setEdges(updatedLinks);
      } else {
        console.error('Invalid transformed data structure', transformedData);
      }
    }
  }, [transformedData, setNodes, setEdges]);

  useEffect(() => {
    console.log(transcription);
  }, [transcription]);

  const getLoadingMessage = () => {
    if (isTranscribing) return 'Converting your voice into text...';
    if (isTransforming) return 'Creating the logic graph...';
    return '';
  };

  return (
    <div className="flex flex-col flex-grow bg-muted p-5 h-full">
      <div className="flex-grow bg-card rounded-lg border shadow-lg relative h-[calc(100vh-10rem)] p-2">
        <div className="h-full w-full">
          {(isTranscribing || isTransforming) && (
            <LoadingOverlay message={getLoadingMessage()} />
          )}
          {error && <ErrorOverlay message={error} />}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onReconnect={onReconnect}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="top-right"
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
      <div
        className={`fixed bottom-14 right-12 rounded-full p-7 hover:scale-125 transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-muted-foreground hover:bg-muted-foreground'
        }`}
        onClick={toggleRecording}
      >
        {isRecording ? <Mic size={32} /> : <MicOff size={32} />}
      </div>
    </div>
  );
}
