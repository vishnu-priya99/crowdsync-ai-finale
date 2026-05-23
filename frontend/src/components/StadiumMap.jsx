import React from "react";

export default function StadiumMap({ gates = [], zones = [], onGateClick }) {
  // Get color for a zone based on its density
  const getZoneColor = (density) => {
    if (density < 50) return "rgba(48, 209, 88, 0.25)"; // Soft green
    if (density < 80) return "rgba(255, 159, 10, 0.4)";  // Warm amber
    return "rgba(255, 59, 48, 0.6)";                     // Critical red
  };

  const getZoneStroke = (density) => {
    if (density < 50) return "#30d158";
    if (density < 80) return "#ff9f0a";
    return "#ff3b30";
  };

  // Get color for a gate based on status
  const getGateColor = (status) => {
    switch (status) {
      case "OPEN": return "#00f5d4";       // Neon Teal
      case "CLOSED": return "#ff3b30";     // Red
      case "REROUTING": return "#bf5af2";   // Purple
      case "EMERGENCY_ONLY": return "#ff9f0a"; // Amber
      default: return "#64748b";
    }
  };

  // Define gate positions in SVG coordinates (width: 500, height: 400, center: 250, 200)
  const gatePositions = {
    "gate-a": { x: 250, y: 40, labelY: 25, align: "middle" },   // Top
    "gate-b": { x: 440, y: 130, labelY: 135, align: "start" },  // Top-Right
    "gate-c": { x: 440, y: 270, labelY: 275, align: "start" },  // Bottom-Right
    "gate-d": { x: 250, y: 360, labelY: 385, align: "middle" },  // Bottom
    "gate-e": { x: 60, y: 270, labelY: 275, align: "end" },    // Bottom-Left
    "gate-f": { x: 60, y: 130, labelY: 135, align: "end" }     // Top-Left
  };

  // Find gate status helper
  const getGateInfo = (id) => {
    return gates.find(g => g.id === id) || { status: "CLOSED", queueSize: 0, density: 0 };
  };

  return (
    <div className="glass-panel" style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "420px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ fontSize: "18px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pulsing-indicator-cyan"></span>
          Live Stadium Flow Map
        </h3>
        <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00f5d4" }}></span> Open
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#bf5af2" }}></span> Reroute
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff9f0a" }}></span> Emergency
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff3b30" }}></span> Closed
          </span>
        </div>
      </div>

      <div style={{ position: "relative", flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "#03050a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)", overflow: "hidden", padding: "10px" }}>
        <svg viewBox="0 0 500 400" style={{ width: "100%", maxHeight: "380px" }}>
          <defs>
            {/* Grid Pattern Background */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            </pattern>
            {/* Radial Glow Filters */}
            <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Evacuation and Entry Dash-Flow markers */}
            <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e4620" />
              <stop offset="100%" stopColor="#0f2b11" />
            </linearGradient>
          </defs>

          {/* Grid Fill */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Outermost boundary */}
          <ellipse cx="250" cy="200" rx="220" ry="170" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="2" />

          {/* Crowd Flow Lines (Animated Dasharrays) */}
          {/* Gate A Flow */}
          {getGateInfo("gate-a").status !== "CLOSED" && (
            <path 
              d="M 250,55 Q 250,110 250,130" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-a").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-a").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}
          {/* Gate B Flow */}
          {getGateInfo("gate-b").status !== "CLOSED" && (
            <path 
              d="M 430,135 Q 350,160 310,170" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-b").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-b").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}
          {/* Gate C Flow */}
          {getGateInfo("gate-c").status !== "CLOSED" && (
            <path 
              d="M 430,265 Q 350,240 310,230" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-c").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-c").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}
          {/* Gate D Flow */}
          {getGateInfo("gate-d").status !== "CLOSED" && (
            <path 
              d="M 250,345 Q 250,290 250,270" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-d").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-d").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}
          {/* Gate E Flow (Emergency North) */}
          {getGateInfo("gate-e").status !== "CLOSED" && (
            <path 
              d="M 70,265 Q 150,240 190,230" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-e").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-e").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}
          {/* Gate F Flow (Emergency South) */}
          {getGateInfo("gate-f").status !== "CLOSED" && (
            <path 
              d="M 70,135 Q 150,160 190,170" 
              fill="none" 
              stroke={getGateColor(getGateInfo("gate-f").status)} 
              strokeWidth="2" 
              strokeDasharray="6, 6" 
              style={{
                strokeDashoffset: getGateInfo("gate-f").status === "EMERGENCY_ONLY" ? -30 : 30,
                animation: "flow-animation 1.5s linear infinite"
              }}
            />
          )}

          {/* Rerouting flow paths (drawn when active) */}
          {getGateInfo("gate-b").status === "REROUTING" && (
            <path 
              d="M 430,135 Q 350,100 270,55" 
              fill="none" 
              stroke="#bf5af2" 
              strokeWidth="2.5" 
              strokeDasharray="5, 5" 
              style={{ animation: "flow-animation 1.2s linear infinite" }}
            />
          )}

          {/* STADIUM SEATING ZONES */}
          {/* Zone 1: North Stand */}
          {zones.find(z => z.id === "zone-1") && (() => {
            const z = zones.find(z => z.id === "zone-1");
            return (
              <path 
                d="M 100,140 A 170,130 0 0,1 400,140 L 330,160 A 100,75 0 0,0 170,160 Z" 
                fill={getZoneColor(z.density)} 
                stroke={getZoneStroke(z.density)} 
                strokeWidth="1.5" 
                className="stadium-zone"
              />
            );
          })()}
          <text x="250" y="115" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">ZONE 1 (NORTH)</text>

          {/* Zone 2: East Stand */}
          {zones.find(z => z.id === "zone-2") && (() => {
            const z = zones.find(z => z.id === "zone-2");
            return (
              <path 
                d="M 400,140 A 170,130 0 0,1 400,260 L 330,240 A 100,75 0 0,0 330,160 Z" 
                fill={getZoneColor(z.density)} 
                stroke={getZoneStroke(z.density)} 
                strokeWidth="1.5" 
                className="stadium-zone"
              />
            );
          })()}
          <text x="355" y="205" textAnchor="start" fill="#fff" fontSize="10" fontWeight="bold">ZONE 2 (EAST)</text>

          {/* Zone 3: South Stand */}
          {zones.find(z => z.id === "zone-3") && (() => {
            const z = zones.find(z => z.id === "zone-3");
            return (
              <path 
                d="M 400,260 A 170,130 0 0,1 100,260 L 170,240 A 100,75 0 0,0 330,240 Z" 
                fill={getZoneColor(z.density)} 
                stroke={getZoneStroke(z.density)} 
                strokeWidth="1.5" 
                className="stadium-zone"
              />
            );
          })()}
          <text x="250" y="295" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">ZONE 3 (SOUTH)</text>

          {/* Zone 4: West Stand */}
          {zones.find(z => z.id === "zone-4") && (() => {
            const z = zones.find(z => z.id === "zone-4");
            return (
              <path 
                d="M 100,260 A 170,130 0 0,1 100,140 L 170,160 A 100,75 0 0,0 170,240 Z" 
                fill={getZoneColor(z.density)} 
                stroke={getZoneStroke(z.density)} 
                strokeWidth="1.5" 
                className="stadium-zone"
              />
            );
          })()}
          <text x="145" y="205" textAnchor="end" fill="#fff" fontSize="10" fontWeight="bold">ZONE 4 (WEST)</text>

          {/* Green Pitch Inner Field */}
          <ellipse cx="250" cy="200" rx="75" ry="50" fill="url(#pitchGrad)" stroke="#529b56" strokeWidth="2" />
          {/* Cricket Pitch Wickets & Line */}
          <rect x="246" y="185" width="8" height="30" fill="#c2b280" opacity="0.8" />
          <line x1="245" y1="185" x2="245" y2="215" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
          <line x1="255" y1="185" x2="255" y2="215" stroke="#fff" strokeWidth="1.5" opacity="0.8" />

          {/* GATE INDICATORS */}
          {Object.entries(gatePositions).map(([id, pos]) => {
            const gate = getGateInfo(id);
            const color = getGateColor(gate.status);
            const isEmergency = id.startsWith("gate-e") || id.startsWith("gate-f");
            
            // Bottleneck pulse radius
            const pulseRadius = gate.queueSize > 250 ? 25 + Math.sin(Date.now() / 200) * 5 : 0;
            
            return (
              <g 
                key={id} 
                className="gate-sensor"
                onClick={() => onGateClick && onGateClick(gate)}
              >
                {/* Bottleneck Alert Aura */}
                {gate.queueSize > 250 && (
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={20 + (gate.queueSize / 15)} 
                    fill="none" 
                    stroke="#ff3b30" 
                    strokeWidth="1.5" 
                    opacity="0.6"
                    style={{
                      transformOrigin: `${pos.x}px ${pos.y}px`,
                      animation: "pulse-red 1.5s infinite"
                    }}
                  />
                )}

                {/* Main Gate Circle */}
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r={isEmergency ? 11 : 9} 
                  fill="#0c1020" 
                  stroke={color} 
                  strokeWidth="2.5" 
                  filter={gate.status !== "CLOSED" ? "url(#glow-teal)" : ""}
                />
                
                {/* Visual indicator of queue size */}
                {gate.queueSize > 0 && (
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={Math.min(7, 2 + gate.queueSize / 70)} 
                    fill={gate.queueSize > 200 ? "#ff3b30" : "#ffaa00"} 
                  />
                )}

                {/* Gate Label Text */}
                <text 
                  x={pos.x} 
                  y={pos.labelY} 
                  textAnchor={pos.align} 
                  fill={gate.queueSize > 250 ? "#ff3b30" : "#c4d3eb"} 
                  fontSize="11" 
                  fontWeight="bold"
                  fontFamily="var(--font-display)"
                >
                  {gate.name.split(" ")[1]} 
                  {gate.queueSize > 0 ? ` (${gate.queueSize})` : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* CSS Keyframes for SVG Dash Flows inside Style Tag */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes flow-animation {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}} />
      </div>
    </div>
  );
}
