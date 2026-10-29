import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getComponentDefinition } from '../../domain/components/registry';
import { Cpu, Zap } from 'lucide-react';

export interface ComponentNodeData {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

export const ComponentNode: React.FC<NodeProps> = memo(({ id: _nodeId, data, selected }) => {
  const nodeData = data as unknown as ComponentNodeData;
  const def = getComponentDefinition(nodeData.type);

  if (!def) {
    return (
      <div style={{
        padding: '10px 14px',
        background: '#1e1b2e',
        border: '1px solid #f43f5e',
        borderRadius: '6px',
        color: '#f43f5e',
        fontSize: '12px'
      }}>
        Unknown Component ({nodeData.type})
      </div>
    );
  }

  // Visual Renderer according to component type
  const renderVisual = () => {
    switch (nodeData.type) {
      case 'arduino-uno':
        return <ArduinoUnoVisual label={nodeData.label} />;
      case 'esp32':
        return <Esp32Visual label={nodeData.label} />;
      case 'resistor':
        return <ResistorVisual label={nodeData.label} properties={nodeData.properties} />;
      case 'led':
        return <LedVisual label={nodeData.label} properties={nodeData.properties} />;
      case 'ldr':
        return <LdrVisual label={nodeData.label} properties={nodeData.properties} />;
      default:
        return (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <Cpu size={24} color="#06b6d4" />
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{nodeData.label}</div>
          </div>
        );
    }
  };

  return (
    <div
      className={`protoforge-component-node ${selected ? 'selected' : ''}`}
      style={{
        border: selected ? '2px solid #22d3ee' : '1px solid #1e293b',
        boxShadow: selected ? '0 0 16px rgba(6, 182, 212, 0.4)' : '0 4px 14px rgba(0,0,0,0.5)',
        borderRadius: '8px',
        background: '#0d131f',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'grab'
      }}
    >
      {renderVisual()}
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';

// ---------------- 1. Arduino Uno Visual Representation ----------------
const ArduinoUnoVisual: React.FC<{ label: string }> = ({ label }) => {
  const topPins = [
    { id: 'pin-aref', label: 'AREF' },
    { id: 'pin-gnd-3', label: 'GND' },
    { id: 'pin-d13', label: '13' },
    { id: 'pin-d12', label: '12' },
    { id: 'pin-d11', label: '~11' },
    { id: 'pin-d10', label: '~10' },
    { id: 'pin-d9', label: '~9' },
    { id: 'pin-d8', label: '8' },
    { id: 'pin-d7', label: '7' },
    { id: 'pin-d6', label: '~6' },
    { id: 'pin-d5', label: '~5' },
    { id: 'pin-d4', label: '4' },
    { id: 'pin-d3', label: '~3' },
    { id: 'pin-d2', label: '2' },
    { id: 'pin-d1', label: 'TX' },
    { id: 'pin-d0', label: 'RX' }
  ];

  const bottomPowerPins = [
    { id: 'pin-reset', label: 'RST' },
    { id: 'pin-3v3', label: '3V3' },
    { id: 'pin-5v', label: '5V' },
    { id: 'pin-gnd-1', label: 'GND' },
    { id: 'pin-gnd-2', label: 'GND' },
    { id: 'pin-vin', label: 'VIN' }
  ];

  const bottomAnalogPins = [
    { id: 'pin-a0', label: 'A0' },
    { id: 'pin-a1', label: 'A1' },
    { id: 'pin-a2', label: 'A2' },
    { id: 'pin-a3', label: 'A3' },
    { id: 'pin-a4', label: 'A4' },
    { id: 'pin-a5', label: 'A5' }
  ];

  return (
    <div style={{
      width: '380px',
      background: 'linear-gradient(145deg, #083b66 0%, #062b4a 100%)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      border: '2px solid #005c8a'
    }}>
      {/* Top Digital Header Pins */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {topPins.map(pin => (
          <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <Handle
              type="source"
              position={Position.Top}
              id={pin.id}
              isConnectable={false}
              style={{
                width: '10px',
                height: '10px',
                background: '#cbd5e1',
                border: '2px solid #0f172a',
                top: '-8px'
              }}
              title={`${pin.label} (Wiring disabled in Phase 2)`}
            />
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#93c5fd', marginTop: '2px' }}>
              {pin.label}
            </span>
          </div>
        ))}
      </div>

      {/* Board Body Illustration */}
      <div style={{
        background: '#041f36',
        borderRadius: '6px',
        padding: '10px 14px',
        margin: '6px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Left: USB & Power Jacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: '28px', height: '18px', background: '#94a3b8', borderRadius: '2px', border: '1px solid #64748b' }} title="USB Type-B Port" />
          <div style={{ width: '20px', height: '16px', background: '#1e293b', borderRadius: '2px', border: '1px solid #475569' }} title="DC Barrel Jack" />
        </div>

        {/* Center: Board Branding & MCU */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#38bdf8' }}>
            ARDUINO UNO
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>
            Arduino Uno — simplified pin view
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: '6px',
            padding: '3px 12px',
            background: '#020d18',
            border: '1px solid #1e3a5f',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: '#38bdf8'
          }}>
            ATmega328P • 16MHz • 5V
          </div>
        </div>

        {/* Right: Label Badge */}
        <div style={{
          padding: '4px 8px',
          background: 'rgba(6, 182, 212, 0.2)',
          border: '1px solid #06b6d4',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#22d3ee'
        }}>
          {label}
        </div>
      </div>

      {/* Bottom Power & Analog Header Pins */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {/* Power Group */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {bottomPowerPins.map(pin => (
            <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#f59e0b', marginBottom: '2px' }}>
                {pin.label}
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={pin.id}
                isConnectable={false}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#f59e0b',
                  border: '2px solid #0f172a',
                  bottom: '-8px'
                }}
                title={`${pin.label} (Power/GND)`}
              />
            </div>
          ))}
        </div>

        {/* Analog Group */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {bottomAnalogPins.map(pin => (
            <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#34d399', marginBottom: '2px' }}>
                {pin.label}
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={pin.id}
                isConnectable={false}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#34d399',
                  border: '2px solid #0f172a',
                  bottom: '-8px'
                }}
                title={`${pin.label} (Analog In)`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- 2. ESP32 DevKit Visual Representation ----------------
const Esp32Visual: React.FC<{ label: string }> = ({ label }) => {
  const pins = [
    { id: 'pin-3v3', label: '3V3', color: '#f59e0b' },
    { id: 'pin-gnd', label: 'GND', color: '#f59e0b' },
    { id: 'pin-gpio18', label: 'G18', color: '#38bdf8' },
    { id: 'pin-gpio19', label: 'G19', color: '#38bdf8' },
    { id: 'pin-gpio21', label: 'G21', color: '#38bdf8' },
    { id: 'pin-gpio22', label: 'G22', color: '#38bdf8' },
    { id: 'pin-gpio23', label: 'G23', color: '#38bdf8' },
    { id: 'pin-gpio34', label: 'G34 (IN)', color: '#fb7185' }
  ];

  return (
    <div style={{
      width: '320px',
      background: 'linear-gradient(145deg, #18202c 0%, #0f141d 100%)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#ffffff',
      border: '2px solid #334155',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>ESP32 DEVKIT</div>
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>ESP32 DevKit-style — simplified pin view</div>
        </div>
        <div style={{
          padding: '2px 6px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '4px',
          fontSize: '9px',
          color: '#fbbf24',
          fontWeight: 600
        }}>
          Visual Only
        </div>
        <div style={{
          padding: '3px 8px',
          background: 'rgba(6, 182, 212, 0.2)',
          border: '1px solid #06b6d4',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#22d3ee'
        }}>
          {label}
        </div>
      </div>

      {/* RF Shield Illustration */}
      <div style={{
        background: '#334155',
        borderRadius: '4px',
        padding: '8px',
        margin: '6px 0',
        textAlign: 'center',
        border: '1px solid #475569',
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        color: '#cbd5e1'
      }}>
        ESP-WROOM-32 • Wi-Fi &amp; BLE • Dual Core 240MHz
      </div>

      {/* Exposed Subset Pins */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        {pins.map(pin => (
          <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: pin.color, marginBottom: '3px' }}>
              {pin.label}
            </span>
            <Handle
              type="source"
              position={Position.Bottom}
              id={pin.id}
              isConnectable={false}
              style={{
                width: '10px',
                height: '10px',
                background: pin.color,
                border: '2px solid #0f172a',
                bottom: '-8px'
              }}
              title={`${pin.label} (Wiring arrives in Phase 3)`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- 3. Resistor Visual Representation ----------------
const ResistorVisual: React.FC<{ label: string; properties: Record<string, unknown> }> = ({ label, properties }) => {
  const val = properties.resistance as number || 220;
  const unit = properties.unit === 'kohm' ? 'kΩ' : 'Ω';
  const displayVal = val >= 1000 && properties.unit !== 'kohm' ? `${val / 1000} kΩ` : `${val} ${unit}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      background: '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '170px'
    }}>
      {/* Left Terminal Handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="pin-1"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#94a3b8',
          border: '2px solid #0f172a',
          left: '-5px'
        }}
        title="Terminal 1"
      />

      {/* Axial Wire Lead */}
      <div style={{ width: '16px', height: '2px', background: '#94a3b8' }} />

      {/* Resistor Body */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '64px',
        height: '24px',
        background: '#d4b28c',
        borderRadius: '5px',
        padding: '0 4px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        border: '1px solid #b8946e'
      }}>
        {/* Color Bands */}
        <div style={{ width: '4px', height: '100%', background: '#dc2626' }} />
        <div style={{ width: '4px', height: '100%', background: '#dc2626' }} />
        <div style={{ width: '4px', height: '100%', background: '#78350f' }} />
        <div style={{ width: '4px', height: '100%', background: '#d97706' }} />
      </div>

      {/* Right Wire Lead */}
      <div style={{ width: '16px', height: '2px', background: '#94a3b8' }} />

      {/* Right Terminal Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="pin-2"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#94a3b8',
          border: '2px solid #0f172a',
          right: '-5px'
        }}
        title="Terminal 2"
      />

      {/* Value Label */}
      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{displayVal}</span>
      </div>
    </div>
  );
};

// ---------------- 4. LED Visual Representation ----------------
const LedVisual: React.FC<{ label: string; properties: Record<string, unknown> }> = ({ label, properties }) => {
  const color = (properties.color as string) || 'red';

  const colorMap: Record<string, { body: string; border: string; glow: string }> = {
    red: { body: '#ef4444', border: '#b91c1c', glow: 'rgba(239, 68, 68, 0.3)' },
    green: { body: '#22c55e', border: '#15803d', glow: 'rgba(34, 197, 94, 0.3)' },
    blue: { body: '#3b82f6', border: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.3)' },
    yellow: { body: '#eab308', border: '#a16207', glow: 'rgba(234, 179, 8, 0.3)' }
  };

  const theme = colorMap[color] || colorMap.red;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      background: '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '160px'
    }}>
      {/* Anode Terminal (A/+) Handle on Left */}
      <Handle
        type="source"
        position={Position.Left}
        id="anode"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#ef4444',
          border: '2px solid #0f172a',
          left: '-5px'
        }}
        title="Anode (A / +)"
      />

      {/* Anode Lead */}
      <div style={{ width: '12px', height: '2px', background: '#94a3b8' }} />

      {/* 5mm LED Dome */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50% 50% 2px 2px',
        background: theme.body,
        border: `2px solid ${theme.border}`,
        boxShadow: `0 0 10px ${theme.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: 0.85
      }}>
        {/* Internal reflector wire */}
        <div style={{ width: '8px', height: '10px', borderLeft: '1px solid #ffffff', opacity: 0.5 }} />
      </div>

      {/* Cathode Lead */}
      <div style={{ width: '12px', height: '2px', background: '#94a3b8' }} />

      {/* Cathode Terminal (K/-) Handle on Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="cathode"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#38bdf8',
          border: '2px solid #0f172a',
          right: '-5px'
        }}
        title="Cathode (K / -)"
      />

      {/* Label and Info */}
      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'capitalize' }}>{color} LED</span>
        <span style={{ fontSize: '9px', color: '#64748b' }}>A(+) / K(-)</span>
      </div>
    </div>
  );
};

// ---------------- 5. LDR Visual Representation ----------------
const LdrVisual: React.FC<{ label: string; properties: Record<string, unknown> }> = ({ label, properties }) => {
  const darkR = properties.darkResistance ? `${Number(properties.darkResistance) / 1000}k` : '100k';
  const brightR = properties.brightResistance ? `${Number(properties.brightResistance) / 1000}k` : '1k';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      background: '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '170px'
    }}>
      {/* Terminal 1 Handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="pin-1"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#94a3b8',
          border: '2px solid #0f172a',
          left: '-5px'
        }}
        title="LDR Terminal 1"
      />

      {/* Left Lead */}
      <div style={{ width: '14px', height: '2px', background: '#94a3b8' }} />

      {/* Disc Ceramic Sensor Head */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#fed7aa',
        border: '2px solid #ea580c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 8px rgba(234, 88, 12, 0.25)'
      }}>
        {/* Serpentine CdS Track Track Pattern */}
        <Zap size={16} color="#c2410c" />
      </div>

      {/* Right Lead */}
      <div style={{ width: '14px', height: '2px', background: '#94a3b8' }} />

      {/* Terminal 2 Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="pin-2"
        isConnectable={false}
        style={{
          width: '10px',
          height: '10px',
          background: '#94a3b8',
          border: '2px solid #0f172a',
          right: '-5px'
        }}
        title="LDR Terminal 2"
      />

      {/* Label and Info */}
      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: '10px', color: '#ea580c' }}>Photoresistor</span>
        <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          {darkR} / {brightR}Ω
        </span>
      </div>
    </div>
  );
};
