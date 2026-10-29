import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Sun,
  Moon,
  Activity,
  Sliders,
  Play,
  Square,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Cpu
} from 'lucide-react';

export const SimulationControlsOverlay: React.FC = () => {
  const {
    simulationStatus,
    simulationInputs,
    simulationTelemetry,
    simulationFault,
    setAmbientLight,
    setSimulationThreshold,
    startSimulation,
    stopSimulation
  } = useProjectStore();

  const [isMinimized, setIsMinimized] = useState(false);

  const isRunning = simulationStatus === 'running';
  const isFault = simulationStatus === 'fault';
  const telemetry = simulationTelemetry;

  return (
    <aside
      aria-label="Simulation Controls Overlay"
      className="simulation-overlay-panel"
      style={{
        position: 'absolute',
        top: '56px',
        right: '16px',
        width: isMinimized ? 'auto' : '360px',
        maxWidth: 'calc(100% - 32px)',
        zIndex: 15,
        backgroundColor: 'rgba(13, 19, 31, 0.94)',
        backdropFilter: 'blur(12px)',
        border: isFault
          ? '1px solid rgba(244, 63, 94, 0.5)'
          : isRunning
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : '1px solid rgba(51, 65, 85, 0.7)',
        borderRadius: '10px',
        boxShadow: isRunning
          ? '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(16, 185, 129, 0.15)'
          : '0 10px 25px rgba(0,0,0,0.5)',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: isFault
            ? 'rgba(244, 63, 94, 0.12)'
            : isRunning
            ? 'rgba(16, 185, 129, 0.1)'
            : 'rgba(30, 41, 59, 0.4)',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(51, 65, 85, 0.4)',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity
            size={15}
            color={isFault ? '#f43f5e' : isRunning ? '#10b981' : '#94a3b8'}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>
            Street Light Simulation
          </span>

          {/* Status Badge */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: isRunning
                ? 'rgba(16, 185, 129, 0.25)'
                : isFault
                ? 'rgba(244, 63, 94, 0.25)'
                : 'rgba(100, 116, 139, 0.25)',
              color: isRunning ? '#34d399' : isFault ? '#f43f5e' : '#94a3b8',
              border: `1px solid ${
                isRunning ? 'rgba(16, 185, 129, 0.5)' : isFault ? 'rgba(244, 63, 94, 0.5)' : 'rgba(100, 116, 139, 0.3)'
              }`
            }}
          >
            {simulationStatus.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isRunning ? (
            <button
              className="icon-btn"
              title="Stop simulation"
              onClick={e => {
                e.stopPropagation();
                stopSimulation();
              }}
              style={{
                padding: '3px 6px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f43f5e',
                borderRadius: '4px'
              }}
            >
              <Square size={12} />
            </button>
          ) : (
            <button
              className="icon-btn"
              title="Start simulation"
              onClick={e => {
                e.stopPropagation();
                startSimulation();
              }}
              style={{
                padding: '3px 6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderRadius: '4px'
              }}
            >
              <Play size={12} />
            </button>
          )}

          <button
            className="icon-btn"
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
            style={{ padding: '2px' }}
          >
            {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {!isMinimized && (
        <div style={{ padding: '12px' }}>
          {/* Fault Banner if circuit is broken */}
          {isFault && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                marginBottom: '10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                fontSize: '11px',
                color: '#fca5a5'
              }}
            >
              <AlertTriangle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong style={{ color: '#f87171' }}>Fault Suspended: </strong>
                {simulationFault?.message || 'Circuit topology is broken or disconnected.'}
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#cbd5e1' }}>
                  Reconnect the missing wires on the canvas to resume simulation.
                </div>
              </div>
            </div>
          )}

          {/* 1. Ambient Light Slider */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >
              <label
                htmlFor="ambient-light-slider"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1'
                }}
              >
                <Sun size={13} color="#f59e0b" />
                <span>Ambient Light Level</span>
              </label>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: simulationInputs.ambientLight < 50 ? '#38bdf8' : '#f59e0b',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #334155'
                }}
              >
                {simulationInputs.ambientLight}% ({simulationInputs.ambientLight < 50 ? 'Night' : 'Daylight'})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span title="0% (Darkness)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Moon size={14} color="#38bdf8" />
              </span>
              <input
                id="ambient-light-slider"
                type="range"
                min="0"
                max="100"
                step="1"
                value={simulationInputs.ambientLight}
                onChange={e => setAmbientLight(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: simulationInputs.ambientLight < 50 ? '#0284c7' : '#ea580c',
                  cursor: 'pointer'
                }}
              />
              <span title="100% (Full Daylight)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Sun size={15} color="#ea580c" />
              </span>
            </div>
          </div>

          {/* 2. Darkness ADC Threshold Control */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >
              <label
                htmlFor="darkness-threshold-slider"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1'
                }}
              >
                <Sliders size={13} color="#a855f7" />
                <span>ADC Switching Threshold</span>
              </label>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#c084fc',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #334155'
                }}
              >
                {simulationInputs.threshold} / 1023
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="darkness-threshold-slider"
                type="range"
                min="50"
                max="950"
                step="5"
                value={simulationInputs.threshold}
                onChange={e => setSimulationThreshold(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#9333ea',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* 3. Live Telemetry HUD Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid #1e293b',
              marginBottom: '10px'
            }}
          >
            {/* LDR Resistance */}
            <div
              style={{
                padding: '6px',
                background: '#0d131f',
                borderRadius: '5px',
                border: '1px solid #1e293b'
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                LDR Resistance
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#f59e0b',
                  marginTop: '2px'
                }}
              >
                {telemetry
                  ? telemetry.ldrResistance >= 1000
                    ? `${(telemetry.ldrResistance / 1000).toFixed(1)} kΩ`
                    : `${telemetry.ldrResistance} Ω`
                  : '—'}
              </div>
            </div>

            {/* A0 Node Voltage */}
            <div
              style={{
                padding: '6px',
                background: '#0d131f',
                borderRadius: '5px',
                border: '1px solid #1e293b'
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                A0 Divider Voltage
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#34d399',
                  marginTop: '2px'
                }}
              >
                {telemetry ? `${telemetry.dividerVoltage.toFixed(2)} V` : '—'}
              </div>
            </div>

            {/* ADC Value */}
            <div
              style={{
                padding: '6px',
                background: '#0d131f',
                borderRadius: '5px',
                border: '1px solid #1e293b'
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                10-bit ADC Value
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginTop: '2px'
                }}
              >
                {telemetry ? `${telemetry.adcValue}` : '—'}
                {telemetry && (
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>
                    {' '}({telemetry.isDark ? '<' : '>='} {telemetry.threshold})
                  </span>
                )}
              </div>
            </div>

            {/* Arduino D9 Pin */}
            <div
              style={{
                padding: '6px',
                background: '#0d131f',
                borderRadius: '5px',
                border: '1px solid #1e293b'
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Pin D9 Output
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: telemetry?.d9Voltage ? '#34d399' : '#64748b',
                  marginTop: '2px'
                }}
              >
                {telemetry
                  ? telemetry.d9Voltage > 0
                    ? 'HIGH (5.0 V)'
                    : 'LOW (0.0 V)'
                  : '—'}
              </div>
            </div>
          </div>

          {/* 4. Lamp State Hero Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '6px',
              background:
                telemetry?.ledState === 'ON'
                  ? 'linear-gradient(90deg, rgba(234, 179, 8, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)'
                  : 'rgba(15, 23, 42, 0.5)',
              border:
                telemetry?.ledState === 'ON'
                  ? '1px solid rgba(234, 179, 8, 0.5)'
                  : '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb
                size={18}
                color={telemetry?.ledState === 'ON' ? '#fde047' : '#64748b'}
              />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700 }}>
                  Street Lamp:{' '}
                  <span
                    style={{
                      color: telemetry?.ledState === 'ON' ? '#fde047' : '#94a3b8'
                    }}
                  >
                    {telemetry ? telemetry.ledState : 'OFF'}
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                  {telemetry?.ledState === 'ON'
                    ? `Current: ~${telemetry.ledCurrentMa} mA via 220 Ω limiter`
                    : 'Output inactive / daylight standby'}
                </div>
              </div>
            </div>

            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: telemetry?.ledState === 'ON' ? '#fde047' : '#334155',
                boxShadow:
                  telemetry?.ledState === 'ON'
                    ? '0 0 14px 4px rgba(253, 224, 71, 0.7)'
                    : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </div>

          {/* Model info disclaimer */}
          <div
            style={{
              marginTop: '8px',
              fontSize: '9px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Cpu size={10} color="#64748b" />
            <span>Deterministic mathematical model • R_LDR = 100k·(1k/100k)^(L/100)</span>
          </div>
        </div>
      )}
    </aside>
  );
};
