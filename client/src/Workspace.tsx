import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useParams } from 'react-router-dom';
import CanvasArea from './components/Canvas/CanvasArea';
import SidebarArea from './components/Sidebar/SidebarArea';
import { ProjectProvider } from './context/ProjectContext';
import { UserProvider } from './context/UserContext';

const Workspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <div className="text-white text-center mt-20">Error: no se proporciono un ID de proyecto.</div>;
  }

  return (
    <UserProvider>
      <ProjectProvider projectId={projectId}>
        {/* ReactFlowProvider envuelve SidebarArea y CanvasArea porque ChapterPanel
            (dentro de SidebarArea) usa useReactFlow() para fitView/setCenter.
            Si se añade otro componente fuera del canvas que necesite ReactFlow,
            mantenerlo dentro de este provider. */}
        <ReactFlowProvider>
          <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
            <SidebarArea />
            <div className="flex-1 h-full relative">
              <CanvasArea />
            </div>
          </div>
        </ReactFlowProvider>
      </ProjectProvider>
    </UserProvider>
  );
};

export default Workspace;
