import React, { useState } from 'react';
import {
  filterComponents
} from '../../domain/components/registry';
import { ComponentCategory } from '../../domain/components/types';
import {
  Search,
  X,
  Plus,
  Cpu,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const CATEGORIES: Array<'All' | ComponentCategory> = [
  'All',
  'Boards',
  'Passive components',
  'Sensors',
  'Outputs',
  'Displays',
  'Power and interconnects'
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent,
  isOpen,
  onToggleOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ComponentCategory>('All');

  const filtered = filterComponents(
    searchQuery,
    selectedCategory === 'All' ? null : selectedCategory
  );

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/protoforge-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      className={`workbench-palette ${isOpen ? 'open' : 'collapsed'}`}
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        bottom: '10px',
        width: isOpen ? '270px' : '40px',
        background: 'rgba(13, 19, 31, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--pf-border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease-in-out'
      }}
      aria-label="Component Library Palette"
    >
      {/* Header */}
      <div style={{
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        borderBottom: '1px solid var(--pf-border-subtle)',
        flexShrink: 0
      }}>
        {isOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="#06b6d4" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>
              Component Library
            </span>
          </div>
        ) : (
          <Layers size={16} color="#06b6d4" style={{ margin: 'auto' }} />
        )}

        <button
          className="icon-btn"
          onClick={onToggleOpen}
          title={isOpen ? 'Collapse palette' : 'Expand palette'}
          aria-label={isOpen ? 'Collapse palette' : 'Expand palette'}
        >
          {isOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Content when open */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Search Box */}
          <div style={{ padding: '8px 10px', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--pf-bg-panel-alt)',
              border: '1px solid var(--pf-border-subtle)',
              borderRadius: '5px',
              padding: '4px 8px'
            }}>
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  color: '#ffffff',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  className="icon-btn"
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '2px' }}
                  title="Clear search"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Badges */}
          <div style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            padding: '2px 10px 8px 10px',
            flexShrink: 0
          }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: active ? 'var(--pf-bg-active)' : 'var(--pf-bg-panel)',
                    color: active ? 'var(--pf-cyan-light)' : 'var(--pf-text-secondary)',
                    border: `1px solid ${active ? 'var(--pf-cyan-dark)' : 'var(--pf-border-subtle)'}`
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Component List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 8px 12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 12px',
                color: 'var(--pf-text-dim)',
                fontSize: '12px'
              }}>
                <Info size={20} style={{ margin: '0 auto 6px auto', opacity: 0.5 }} />
                <p>No matching components found for "{searchQuery}".</p>
                <button
                  className="toolbar-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  style={{ margin: '8px auto 0 auto', fontSize: '11px' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map(comp => (
                <div
                  key={comp.type}
                  draggable={comp.isPlaceable}
                  onDragStart={e => comp.isPlaceable && handleDragStart(e, comp.type)}
                  style={{
                    background: 'var(--pf-bg-panel-alt)',
                    border: '1px solid var(--pf-border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: comp.isPlaceable ? 'grab' : 'default',
                    opacity: comp.isPlaceable ? 1 : 0.75,
                    transition: 'border-color 0.15s, transform 0.1s'
                  }}
                  className="palette-card"
                >
                  {/* Top: Name & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={13} color={comp.isPlaceable ? '#06b6d4' : '#64748b'} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                        {comp.name}
                      </span>
                    </div>

                    {comp.isPlaceable ? (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#22d3ee',
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '4px',
                        padding: '1px 5px'
                      }}>
                        Visual Only
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '4px',
                        padding: '1px 5px'
                      }}>
                        Catalog only
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--pf-text-secondary)',
                    lineHeight: 1.35,
                    margin: '2px 0 4px 0'
                  }}>
                    {comp.description}
                  </p>

                  {/* Action row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {comp.pins.length > 0 ? `${comp.pins.length} pins` : 'Visual model'}
                    </span>

                    {comp.isPlaceable ? (
                      <button
                        className="toolbar-btn primary"
                        onClick={() => onAddComponent(comp.type)}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        title="Click to place on workbench (or drag onto canvas)"
                      >
                        <Plus size={11} />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="tooltip-wrap">
                        <button
                          disabled
                          className="toolbar-btn"
                          style={{ padding: '3px 8px', fontSize: '10px', opacity: 0.4 }}
                        >
                          <span>Add</span>
                        </button>
                        <span className="tooltip-text">
                          Catalog only — discovery mode; placement arrives in future expansion.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
