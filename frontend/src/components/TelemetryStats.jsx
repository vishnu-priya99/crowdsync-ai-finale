import React from "react";
import { Shield, CloudRain, Sun, Compass, HelpCircle, Users, Ticket, AlertTriangle, AlertCircle, HelpCircle as Help } from "lucide-react";

export default function TelemetryStats({ telemetry }) {
  const {
    phase,
    weather,
    gates = [],
    zones = [],
    alerts = [],
    ticketsScanned = 0,
    ticketsTotal = 0,
    dispatchedServices = []
  } = telemetry;

  const progressPercent = Math.min(100, Math.round((ticketsScanned / ticketsTotal) * 100));

  // Determine weather icon
  const getWeatherIcon = (cond) => {
    switch (cond) {
      case "Clear": return <Sun size={20} style={{ color: "var(--accent-orange)" }} />;
      case "Cloudy": return <Compass size={20} style={{ color: "var(--text-secondary)" }} />;
      case "Storming":
      case "Raining": return <CloudRain size={20} style={{ color: "var(--accent-blue)", animation: "warning-blink 1.5s infinite" }} />;
      default: return <Sun size={20} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. System Alerts / Banners */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alerts.map((alert, idx) => (
            <div 
              key={alert.id || idx} 
              className={alert.severity === "CRITICAL" ? "warning-bar glow-red" : "warning-bar"} 
              style={{
                borderColor: alert.severity === "CRITICAL" ? "var(--accent-red)" : alert.severity === "HIGH" ? "var(--accent-orange)" : "var(--accent-blue)",
                background: alert.severity === "CRITICAL" ? "rgba(255, 59, 48, 0.15)" : alert.severity === "HIGH" ? "rgba(255, 159, 10, 0.15)" : "rgba(10, 132, 255, 0.15)",
                color: "var(--text-primary)",
                animation: alert.severity === "CRITICAL" ? "warning-blink 1.5s infinite ease-in-out" : "none"
              }}
            >
              {alert.severity === "CRITICAL" ? <AlertCircle size={20} style={{ color: "var(--accent-red)", flexShrink: 0 }} /> : <AlertTriangle size={20} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", opacity: 0.8 }}>
                  {alert.source} • {alert.severity} Alert
                </div>
                <div style={{ fontSize: "12px", marginTop: "2px", fontWeight: 500 }}>{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
        
        {/* Ticket Intake Card */}
        <div className="glass-panel" style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
              <Ticket size={16} style={{ color: "var(--accent-cyan)" }} />
              TICKETS SCAN RATIO
            </span>
            <span style={{ fontSize: "11px", background: "rgba(0,240,255,0.1)", color: "var(--accent-cyan)", padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-mono)" }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-display)", color: "#fff" }}>
            {ticketsScanned.toLocaleString()} / {ticketsTotal.toLocaleString()}
          </div>
          {/* Progress Bar */}
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${progressPercent}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))", 
                borderRadius: "3px",
                transition: "width 0.5s ease" 
              }} 
            />
          </div>
        </div>

        {/* Phase & Weather Card */}
        <div className="glass-panel" style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
              {getWeatherIcon(weather.condition)}
              METEOROLOGY & PHASE
            </span>
            <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
              {phase.replace("_", " ")}
            </span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-display)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span>{weather.temp}°C</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              {weather.condition} • {weather.windSpeed} km/h Wind
            </span>
          </div>
          {weather.condition === "Storming" && (
            <div style={{ color: "var(--accent-red)", fontSize: "11px", fontWeight: "bold", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulsing-indicator-red"></span> Rain: {weather.precipitation}%
            </div>
          )}
        </div>
      </div>

      {/* 3. Emergency Dispatches */}
      <div className="glass-panel" style={{ padding: "14px" }}>
        <h4 style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          <Shield size={16} style={{ color: "var(--accent-orange)" }} />
          Emergency Response Dispatch Logs
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
          {dispatchedServices.length === 0 ? (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
              No emergency operations active.
            </div>
          ) : (
            dispatchedServices.map((disp, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  background: "rgba(255, 159, 10, 0.05)", 
                  border: "1px solid rgba(255, 159, 10, 0.15)", 
                  borderRadius: "6px", 
                  padding: "6px 10px", 
                  fontSize: "12px" 
                }}
              >
                <strong style={{ color: "var(--accent-orange)" }}>🚨 {disp.serviceType} Services</strong>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Location: {disp.gateId.toUpperCase().replace("-", " ")}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>{disp.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Gate Detail Overview */}
      <div className="glass-panel" style={{ padding: "14px" }}>
        <h4 style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Gates Telemetry Detail
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Header Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr", padding: "4px 8px", fontSize: "10px", fontWeight: "bold", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", textTransform: "uppercase" }}>
            <span>Gate Name</span>
            <span style={{ textAlign: "right" }}>Queue Size</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          {/* Gate Items */}
          {gates.map((g) => (
            <div 
              key={g.id} 
              style={{ 
                display: "grid", 
                gridTemplateColumns: "1.2fr 0.8fr 0.8fr", 
                padding: "6px 8px", 
                fontSize: "12px", 
                borderRadius: "6px", 
                background: g.queueSize > 250 ? "rgba(255,59,48,0.06)" : "rgba(255,255,255,0.01)",
                border: g.queueSize > 250 ? "1px solid rgba(255,59,48,0.15)" : "1px solid transparent"
              }}
            >
              <span style={{ fontWeight: 600, color: g.queueSize > 250 ? "var(--accent-red)" : "var(--text-primary)" }}>
                {g.name.replace("Entrance", "").replace("Exit", "")}
              </span>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: "bold", color: g.queueSize > 200 ? "var(--accent-orange)" : "var(--text-primary)" }}>
                {g.queueSize}
              </span>
              <span style={{ 
                textAlign: "right", 
                fontWeight: "bold", 
                fontSize: "10px",
                color: g.status === "OPEN" ? "var(--accent-teal)" : g.status === "CLOSED" ? "var(--accent-red)" : g.status === "REROUTING" ? "var(--accent-purple)" : "var(--accent-orange)"
              }}>
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
