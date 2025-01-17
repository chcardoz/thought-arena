import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: {
    name: string;
  };
}

function CustomNode({ data }: CustomNodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex">
        <div className="ml-2">
          <div className="text-gray-500">{data.name}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-10 !bg-red-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-10 !bg-red-800"
      />
    </div>
  );
}

export default memo(CustomNode);
