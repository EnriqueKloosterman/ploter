import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useParams } from 'react-router-dom';
import CanvasArea from './components/Canvas/CanvasArea';
import SidebarArea from './components/Sidebar/SidebarArea';
import { ProjectProvider } from './context/ProjectContext';

const Workspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <div className="text-white text-center mt-20">Error: No se proporcionó ID de Proyecto.</div>;
  }

  return (
    <ProjectProvider projectId={projectId}>
      <ReactFlowProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
          <SidebarArea />
          <div className="flex-1 h-full relative">
            <CanvasArea />
          </div>
        </div>
      </ReactFlowProvider>
    </ProjectProvider>
  );
};

export default Workspace;
