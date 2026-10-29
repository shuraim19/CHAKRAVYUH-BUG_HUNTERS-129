import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getComponentDefinition } from '../../domain/components/registry';
import { Cpu, Zap, Activity } from 'lucide-react';
import { StreetLightTelemetry } from '../../domain/simulation';

export interface ComponentNodeData {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  simulationStatus?: 'idle' | 'running' | 'fault' | 'stopped';
  simulationTelemetry?: StreetLightTelemetry | null;
  [key: string]: unknown;
}

/**
 * Bidirectional dual-handle allowing drag-to-connect and drop-to-connect in either direction.
 */
const PinHandle: React.FC<{
  id: string;
  position: Position;
  label: string;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}> = ({ id, position, label, color = '#cbd5e1', style = {}, title }) => {
  return (
    <>
      <Handle
        type="target"
        position={position}
        id={`${id}__tgt`}
        isConnectable={true}
        style={{
          width: '12px',
          height: '12px',
          background: color,
          border: '2px solid #0f172a',
          borderRadius: '50%',
          zIndex: 10,
          cursor: 'crosshair',
          ...style
        }}
        title={title || `${label} terminal (Click or drag to connect)`}
      />
      <Handle
        type="source"
        position={position}
        id={id}
        isConnectable={true}
        style={{
          width: '12px',
          height: '12px',
          background: color,
          border: '2px solid #0f172a',
          borderRadius: '50%',
          zIndex: 11,
          cursor: 'crosshair',
          ...style
        }}
        title={title || `${label} terminal (Click or drag to connect)`}
      />
    </>
  );
};

export const ComponentNode: React.FC<NodeProps> = memo(({ data, selected }) => {
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

  const isRunning = nodeData.simulationStatus === 'running';
  const telemetry = isRunning ? nodeData.simulationTelemetry : null;

  const renderVisual = () => {
    switch (nodeData.type) {
      case 'arduino-uno':
        return <ArduinoUnoVisual label={nodeData.label} telemetry={telemetry} />;
      case 'esp32':
        return <Esp32Visual label={nodeData.label} />;
      case 'resistor':
        return <ResistorVisual label={nodeData.label} properties={nodeData.properties} />;
      case 'led':
        return (
          <LedVisual
            label={nodeData.label}
            properties={nodeData.properties}
            isSimulating={isRunning}
            telemetry={telemetry}
          />
        );
      case 'ldr':
        return (
          <LdrVisual
            label={nodeData.label}
            properties={nodeData.properties}
            isSimulating={isRunning}
            telemetry={telemetry}
          />
        );
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
const ArduinoUnoVisual: React.FC<{ label: string; telemetry?: StreetLightTelemetry | null }> = ({
  label,
  telemetry
}) => {
  const isD9Active = telemetry && telemetry.d9Voltage > 0;

  const topPins = [
    { id: 'pin-aref', label: 'AREF', color: '#94a3b8' },
    { id: 'pin-gnd-3', label: 'GND', color: '#f59e0b' },
    { id: 'pin-d13', label: '13', color: '#38bdf8' },
    { id: 'pin-d12', label: '12', color: '#38bdf8' },
    { id: 'pin-d11', label: '~11', color: '#38bdf8' },
    { id: 'pin-d10', label: '~10', color: '#38bdf8' },
    {
      id: 'pin-d9',
      label: telemetry ? (isD9Active ? '~9 [5V]' : '~9 [0V]') : '~9',
      color: isD9Active ? '#10b981' : '#22d3ee'
    },
    { id: 'pin-d8', label: '8', color: '#38bdf8' },
    { id: 'pin-d7', label: '7', color: '#38bdf8' },
    { id: 'pin-d6', label: '~6', color: '#38bdf8' },
    { id: 'pin-d5', label: '~5', color: '#38bdf8' },
    { id: 'pin-d4', label: '4', color: '#38bdf8' },
    { id: 'pin-d3', label: '~3', color: '#38bdf8' },
    { id: 'pin-d2', label: '2', color: '#38bdf8' },
    { id: 'pin-d1', label: 'TX', color: '#cbd5e1' },
    { id: 'pin-d0', label: 'RX', color: '#cbd5e1' }
  ];

  const bottomPowerPins = [
    { id: 'pin-reset', label: 'RST', color: '#94a3b8' },
    { id: 'pin-3v3', label: '3V3', color: '#f59e0b' },
    { id: 'pin-5v', label: '5V', color: '#ef4444' }, // Highlighted target power
    { id: 'pin-gnd-1', label: 'GND', color: '#f59e0b' }, // Target ground
    { id: 'pin-gnd-2', label: 'GND', color: '#f59e0b' }, // Target ground
    { id: 'pin-vin', label: 'VIN', color: '#f59e0b' }
  ];

  const bottomAnalogPins = [
    {
      id: 'pin-a0',
      label: telemetry ? `A0 [${telemetry.adcValue}]` : 'A0',
      color: telemetry ? '#38bdf8' : '#34d399'
    },
    { id: 'pin-a1', label: 'A1', color: '#34d399' },
    { id: 'pin-a2', label: 'A2', color: '#34d399' },
    { id: 'pin-a3', label: 'A3', color: '#34d399' },
    { id: 'pin-a4', label: 'A4', color: '#34d399' },
    { id: 'pin-a5', label: 'A5', color: '#34d399' }
  ];

  return (
    <div style={{
      width: '390px',
      background: 'linear-gradient(145deg, #083b66 0%, #062b4a 100%)',
      borderRadius: '8px',
      padding: '10px 14px',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      border: '2px solid #005c8a'
    }}>
      {/* Top Digital Header Pins */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {topPins.map(pin => (
          <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <PinHandle
              id={pin.id}
              position={Position.Top}
              label={pin.label}
              color={pin.color}
              style={{ top: '-10px' }}
            />
            <span style={{ fontSize: '9px', fontWeight: 600, color: pin.color, marginTop: '2px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: '28px', height: '18px', background: '#94a3b8', borderRadius: '2px', border: '1px solid #64748b' }} title="USB Type-B Port" />
          <div style={{ width: '20px', height: '16px', background: '#1e293b', borderRadius: '2px', border: '1px solid #475569' }} title="DC Barrel Jack" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#38bdf8' }}>
            ARDUINO UNO
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>
            Arduino Uno — simplified pin view
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
            padding: '3px 10px',
            background: telemetry ? 'rgba(16, 185, 129, 0.15)' : '#020d18',
            border: `1px solid ${telemetry ? '#10b981' : '#1e3a5f'}`,
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: telemetry ? '#34d399' : '#38bdf8'
          }}>
            {telemetry ? (
              <>
                <Activity size={10} color="#34d399" />
                <span>A0: {telemetry.dividerVoltage.toFixed(2)}V • D9: {isD9Active ? 'HIGH' : 'LOW'}</span>
              </>
            ) : (
              <span>ATmega328P • 16MHz • 5V</span>
            )}
          </div>
        </div>

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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {bottomPowerPins.map(pin => (
            <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: pin.color, marginBottom: '2px' }}>
                {pin.label}
              </span>
              <PinHandle
                id={pin.id}
                position={Position.Bottom}
                label={pin.label}
                color={pin.color}
                style={{ bottom: '-10px' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {bottomAnalogPins.map(pin => (
            <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: pin.color, marginBottom: '2px' }}>
                {pin.label}
              </span>
              <PinHandle
                id={pin.id}
                position={Position.Bottom}
                label={pin.label}
                color={pin.color}
                style={{ bottom: '-10px' }}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        {pins.map(pin => (
          <div key={pin.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: pin.color, marginBottom: '3px' }}>
              {pin.label}
            </span>
            <PinHandle
              id={pin.id}
              position={Position.Bottom}
              label={pin.label}
              color={pin.color}
              style={{ bottom: '-10px' }}
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
      padding: '10px 16px',
      background: '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '175px'
    }}>
      {/* Terminal 1 Handle on Left */}
      <PinHandle
        id="pin-1"
        position={Position.Left}
        label="Terminal 1"
        color="#38bdf8"
        style={{ left: '-6px' }}
      />

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
        <div style={{ width: '4px', height: '100%', background: '#dc2626' }} />
        <div style={{ width: '4px', height: '100%', background: '#dc2626' }} />
        <div style={{ width: '4px', height: '100%', background: '#78350f' }} />
        <div style={{ width: '4px', height: '100%', background: '#d97706' }} />
      </div>

      <div style={{ width: '16px', height: '2px', background: '#94a3b8' }} />

      {/* Terminal 2 Handle on Right */}
      <PinHandle
        id="pin-2"
        position={Position.Right}
        label="Terminal 2"
        color="#38bdf8"
        style={{ right: '-6px' }}
      />

      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{displayVal}</span>
      </div>
    </div>
  );
};

// ---------------- 4. LED Visual Representation ----------------
const LedVisual: React.FC<{
  label: string;
  properties: Record<string, unknown>;
  isSimulating?: boolean;
  telemetry?: StreetLightTelemetry | null;
}> = ({ label, properties, isSimulating, telemetry }) => {
  const color = (properties.color as string) || 'white';
  const isLit = isSimulating && telemetry ? telemetry.ledState === 'ON' : false;

  const colorMap: Record<string, { body: string; border: string; glow: string }> = {
    red: { body: '#ef4444', border: '#b91c1c', glow: 'rgba(239, 68, 68, 0.3)' },
    green: { body: '#22c55e', border: '#15803d', glow: 'rgba(34, 197, 94, 0.3)' },
    blue: { body: '#3b82f6', border: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.3)' },
    yellow: { body: '#eab308', border: '#a16207', glow: 'rgba(234, 179, 8, 0.3)' },
    white: { body: '#f8fafc', border: '#94a3b8', glow: 'rgba(255, 255, 255, 0.4)' }
  };

  const theme = colorMap[color] || colorMap.white;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      background: isLit ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '175px',
      border: isLit ? '1px solid rgba(253, 224, 71, 0.5)' : '1px solid transparent',
      boxShadow: isLit ? '0 0 20px rgba(253, 224, 71, 0.25)' : 'none',
      transition: 'all 0.2s ease-in-out'
    }}>
      {/* Anode Handle (A / +) on Left */}
      <PinHandle
        id="anode"
        position={Position.Left}
        label="Anode (A / +)"
        color="#ef4444"
        style={{ left: '-6px' }}
      />

      <div style={{ width: '12px', height: '2px', background: '#94a3b8' }} />

      {/* 5mm LED Dome */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50% 50% 3px 3px',
        background: isLit
          ? '#ffffff'
          : isSimulating
          ? 'rgba(100, 116, 139, 0.4)'
          : theme.body,
        border: isLit
          ? '2px solid #fef08a'
          : `2px solid ${theme.border}`,
        boxShadow: isLit
          ? '0 0 25px 8px #ffffff, 0 0 45px 15px rgba(253, 224, 71, 0.8)'
          : isSimulating
          ? 'none'
          : `0 0 10px ${theme.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: isSimulating ? (isLit ? 1.0 : 0.4) : 0.9,
        transition: 'all 0.2s ease-in-out'
      }}>
        <div style={{
          width: '8px',
          height: '10px',
          borderLeft: isLit ? '2px solid #fef08a' : '1px solid #ffffff',
          opacity: isLit ? 0.9 : 0.5
        }} />
      </div>

      <div style={{ width: '12px', height: '2px', background: '#94a3b8' }} />

      {/* Cathode Handle (K / -) on Right */}
      <PinHandle
        id="cathode"
        position={Position.Right}
        label="Cathode (K / -)"
        color="#38bdf8"
        style={{ right: '-6px' }}
      />

      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        {isSimulating ? (
          <>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: isLit ? '#34d399' : '#64748b',
                marginTop: '1px'
              }}
            >
              {isLit ? '● ON (5.0V)' : '○ OFF (0.0V)'}
            </span>
            <span style={{ fontSize: '9px', color: isLit ? '#cbd5e1' : '#475569' }}>
              {isLit ? `~${telemetry?.ledCurrentMa} mA` : 'Standby'}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'capitalize' }}>
              {color} LED
            </span>
            <span style={{ fontSize: '9px', color: '#64748b' }}>A(+) / K(-)</span>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------- 5. LDR Visual Representation ----------------
const LdrVisual: React.FC<{
  label: string;
  properties: Record<string, unknown>;
  isSimulating?: boolean;
  telemetry?: StreetLightTelemetry | null;
}> = ({ label, properties, isSimulating, telemetry }) => {
  const darkR = properties.darkResistance ? `${Number(properties.darkResistance) / 1000}k` : '100k';
  const brightR = properties.brightResistance ? `${Number(properties.brightResistance) / 1000}k` : '1k';

  // Compute disc background shift based on ambient light
  const lightPct = isSimulating && telemetry ? telemetry.ambientLight : 20;
  const discBg = lightPct < 40 ? '#7c2d12' : lightPct < 70 ? '#ea580c' : '#f59e0b';
  const discBorder = lightPct < 40 ? '#9a3412' : '#fed7aa';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      background: '#0d131f',
      borderRadius: '6px',
      position: 'relative',
      minWidth: '175px',
      border: isSimulating ? '1px solid rgba(234, 88, 12, 0.4)' : '1px solid transparent',
      boxShadow: isSimulating ? '0 0 14px rgba(234, 88, 12, 0.2)' : 'none',
      transition: 'all 0.2s ease-in-out'
    }}>
      {/* Terminal 1 Handle on Left */}
      <PinHandle
        id="pin-1"
        position={Position.Left}
        label="Terminal 1"
        color="#f59e0b"
        style={{ left: '-6px' }}
      />

      <div style={{ width: '14px', height: '2px', background: '#94a3b8' }} />

      {/* Disc Ceramic Sensor Head */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: discBg,
        border: `2px solid ${discBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSimulating ? '0 0 12px rgba(245, 158, 11, 0.4)' : '0 0 8px rgba(234, 88, 12, 0.25)',
        transition: 'background 0.2s ease-in-out'
      }}>
        <Zap size={16} color="#ffffff" />
      </div>

      <div style={{ width: '14px', height: '2px', background: '#94a3b8' }} />

      {/* Terminal 2 Handle on Right */}
      <PinHandle
        id="pin-2"
        position={Position.Right}
        label="Terminal 2"
        color="#f59e0b"
        style={{ right: '-6px' }}
      />

      <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        {isSimulating && telemetry ? (
          <>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
              Light: {telemetry.ambientLight}%
            </span>
            <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              R ≈ {telemetry.ldrResistance >= 1000 ? `${(telemetry.ldrResistance / 1000).toFixed(1)}kΩ` : `${telemetry.ldrResistance}Ω`}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '10px', color: '#ea580c' }}>Photoresistor</span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              {darkR} / {brightR}Ω
            </span>
          </>
        )}
      </div>
    </div>
  );
};
