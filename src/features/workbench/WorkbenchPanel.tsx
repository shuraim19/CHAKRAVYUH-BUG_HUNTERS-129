import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/projectStore';
import { ComponentNode } from './ComponentNode';
import { ComponentPalette } from './ComponentPalette';
import { PropertiesInspector } from './PropertiesInspector';
import { WorkbenchToolbar } from './WorkbenchToolbar';
import { Cpu, AlertCircle } from 'lucide-react';

const nodeTypes = {
  component: ComponentNode
};

const WorkbenchCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const {
    project,
    selectedComponentId,
    selectComponent,
    addComponent,
    updateComponentPosition,
    deleteComponent,
    isPaletteOpen,
    setPaletteOpen
  } = useProjectStore();

  // Convert authoritative store components to React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    return project.circuit.components.map(comp => ({
      id: comp.id,
      type: 'component',
      position: comp.position,
      selected: comp.id === selectedComponentId,
      data: {
        id: comp.id,
        type: comp.type,
        label: comp.label,
        properties: comp.properties
      }
    }));
  }, [project.circuit.components, selectedComponentId]);

  // Handle node drag stop and commit to authoritative store
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateComponentPosition(node.id, node.position);
    },
    [updateComponentPosition]
  );

  // Handle node click / selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectComponent(node.id);
    },
    [selectComponent]
  );

  // Deselect when clicking empty space
  const onPaneClick = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  // Handle Drag Over
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle Drop onto Canvas
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/protoforge-component');
      if (!type) return;

      const flowPos = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY
      });

      addComponent(type, flowPos);
    },
    [screenToFlowPosition, addComponent]
  );

  // Handle Add button from Palette (click-to-place)
  const handleAddFromPalette = useCallback(
    (type: string) => {
      const viewport = getViewport();
      // Place near visible canvas centre
      const width = reactFlowWrapper.current?.clientWidth || 600;
      const height = reactFlowWrapper.current?.clientHeight || 400;

      const centerX = (-viewport.x + width / 2) / viewport.zoom - 100;
      const centerY = (-viewport.y + height / 2) / viewport.zoom - 50;

      const compCount = project.circuit.components.length;
      const staggeredX = centerX + (compCount % 4) * 35;
      const staggeredY = centerY + (compCount % 4) * 30;

      addComponent(type, { x: staggeredX, y: staggeredY });
    },
    [getViewport, addComponent, project.circuit.components.length]
  );

  // Safe Keyboard Delete handler: only delete if focus is NOT inside an editor or input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        const tagName = active?.tagName.toLowerCase();
        const isEditingText =
          tagName === 'input' ||
          tagName === 'textarea' ||
          active?.closest('.monaco-editor') ||
          active?.getAttribute('contenteditable') === 'true';

        if (!isEditingText && selectedComponentId) {
          e.preventDefault();
          deleteComponent(selectedComponentId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, deleteComponent]);

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Workbench Floating Toolbar */}
      <WorkbenchToolbar />

      {/* Component Library Palette (Collapsible left drawer) */}
      <ComponentPalette
        isOpen={isPaletteOpen}
        onToggleOpen={() => setPaletteOpen(!isPaletteOpen)}
        onAddComponent={handleAddFromPalette}
      />

      {/* Properties Inspector (Collapsible right drawer) */}
      <PropertiesInspector />

      {/* React Flow Infinite Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        minZoom={0.2}
        maxZoom={2.5}
        defaultViewport={{ x: 120, y: 80, zoom: 0.95 }}
        nodesDraggable={true}
        nodesConnectable={false} // Connections disabled in Phase 2
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#1e293b"
        />
      </ReactFlow>

      {/* Notice Banner at Canvas Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '20px',
          padding: '4px 14px',
          fontSize: '11px',
          color: '#22d3ee',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          zIndex: 10
        }}
      >
        <AlertCircle size={12} color="#06b6d4" />
        <span>Component placement is active. Electrical wiring arrives in Phase 3.</span>
      </div>

      {/* Guidance Watermark when workbench is empty */}
      {project.circuit.components.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--pf-text-dim)',
            pointerEvents: 'none',
            maxWidth: '360px',
            zIndex: 5
          }}
        >
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(13, 19, 31, 0.8)',
            border: '1px solid var(--pf-border-color)',
            marginBottom: '10px'
          }}>
            <Cpu size={28} color="#06b6d4" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
            Workbench is Empty
          </p>
          <p style={{ fontSize: '11px', lineHeight: 1.5 }}>
            Open the Component Library on the left to drag components onto the canvas or click "Add".
            Start with an Arduino Uno, LDR, resistors, and LED for the street light project.
          </p>
        </div>
      )}
    </div>
  );
};

export const WorkbenchPanel: React.FC = () => {
  return (
    <div className="workbench-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlowProvider>
        <WorkbenchCanvas />
      </ReactFlowProvider>
    </div>
  );
};
