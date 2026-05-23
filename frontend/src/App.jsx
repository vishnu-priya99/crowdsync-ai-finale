import React, { useState, useEffect } from "react";
import StadiumMap from "./components/StadiumMap";
import AgentTerminal from "./components/AgentTerminal";
import TelemetryStats from "./components/TelemetryStats";
import { Shield, Sparkles, CloudAlert, RefreshCw, Key, ShieldAlert } from "lucide-react";

export default function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  
  // API Key handling - supports UI input for easier deployment testing
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("CROWDSYNC_GEMINI_KEY") || "";
  });

  const [selectedGate, setSelectedGate] = useState(null);

  // Polling server for real-time telemetry updates
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("https://crowdsync-backend-990647004439.us-central1.run.app/api/telemetry");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error("Failed to poll telemetry:", err);
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("CROWDSYNC_GEMINI_KEY", key);
  };

  // Interact with Gemini Agent
  const handleSendMessage = async (message) => {
    setIsThinking(true);
    
    // Add user message to history locally
    const updatedHistory = [...chatHistory, { role: "user", text: message }];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch("https://crowdsync-backend-990647004439.us-central1.run.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: chatHistory,
          // If we entered an API key in the UI, pass it along. The backend will configure the env.
          apiKey: apiKey || undefined
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      
      if (data.success) {
        setChatHistory(prev => [...prev, { role: "assistant", text: data.text }]);
        // Append new agent reasoning logs
        if (data.logs && data.logs.length > 0) {
          setAgentLogs(prev => [...prev, ...data.logs]);
        }
        // Update telemetry instantly
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      } else {
        throw new Error(data.error || "Agent execution failed");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setAgentLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `⚠️ Chat Error: ${err.message}` }
      ]);
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", text: `Operations error: ${err.message}. Ensure the backend has a valid GEMINI_API_KEY in its .env file.` }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Inject a simulated crisis event
  const handleInjectCrisis = async (type) => {
    try {
      const res = await fetch("https://crowdsync-backend-990647004439.us-central1.run.app/api/simulate/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        
        let msg = "";
        if (type === "thunderstorm") msg = "🚨 injected: Severe Thunderstorm approaching stadium.";
        else if (type === "stampede_risk_gate_b") msg = "🚨 injected: Queue Bottleneck at Gate B.";
        else if (type === "security_breach_gate_e") msg = "🚨 injected: Perimeter Breach at Gate E.";
        else if (type === "power_failure") msg = "🚨 injected: Gate C & D Scanner Power Grid Failure.";
        else if (type === "reset") {
          msg = "🔄 Simulation State Reset.";
          setChatHistory([]);
          setAgentLogs([]);
        }

        setAgentLogs(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), message: msg }
        ]);

        // If we reset, also close gate modal
        if (type === "reset") {
          setSelectedGate(null);
        }
      }
    } catch (err) {
      console.error("Failed to inject crisis:", err);
    }
  };

  // Manual Gate Override (Human-in-the-loop)
  const handleGateStatusChange = async (gateId, newStatus) => {
    try {
      const res = await fetch("https://crowdsync-backend-990647004439.us-central1.run.app/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateId, status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        
        // Update selected gate modal details
        const updatedGate = data.telemetry.gates.find(g => g.id === gateId);
        setSelectedGate(updatedGate);

        setAgentLogs(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), message: `👤 Manual Override: Set ${gateId.toUpperCase()} to ${newStatus}` }
        ]);
      }
    } catch (err) {
      console.error("Failed to update gate:", err);
    }
  };

  // Change simulation matches phase
  const handlePhaseChange = async (newPhase) => {
    // Basic UI action: update phase directly
    // For simplicity, we can extend backend crisis endpoint to handle phase changes
    try {
      // In this version, we will simulate it by telling the agent or setting state. 
      // Let's pass a custom crisis trigger to set the phase.
      const res = await fetch("https://crowdsync-backend-990647004439.us-central1.run.app/api/simulate/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reset" }) // reset first, then we can adjust phase
      });
      if (res.ok) {
        const data = await res.json();
        // Since simulator constructor starts with PRE_MATCH, we can set local simulation phase
        // In a real app we'd have a specific POST endpoint, let's keep it simple: 
        // We'll update the simulator phase field directly if needed, or let it transition.
        // For the pitch, let's tell the agent: "Switch the stadium phase to POST_MATCH" and watch it act!
        handleSendMessage(`Switch match phase to ${newPhase} and adjust gates accordingly.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!telemetry) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "15px", background: "var(--bg-primary)" }}>
        <RefreshCw className="spinning-loader" size={40} style={{ color: "var(--accent-cyan)", animation: "spin 1.5s linear infinite" }} />
        <div style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)", fontSize: "14px" }}>
          Connecting to CrowdSync AI Telemetry Server...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* 1. Header Command Panel */}
      <header style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(10, 14, 30, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", maxWidth: "1680px", margin: "0 auto" }}>
          
          {/* Logo & Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(0,240,255,0.4)" }}>
              <Shield size={18} style={{ color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "6px", lineHeight: 1 }}>
                CrowdSync AI
                <span style={{ fontSize: "9px", background: "rgba(0, 240, 255, 0.15)", color: "var(--accent-cyan)", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                  Active Orchestration
                </span>
              </h1>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Google Cloud Agentic Premier League Command Dashboard</span>
            </div>
          </div>

          {/* Phase selectors */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            {["PRE_MATCH", "IN_PROGRESS", "POST_MATCH"].map(ph => (
              <button
                key={ph}
                onClick={() => handlePhaseChange(ph)}
                style={{
                  background: telemetry.phase === ph ? "rgba(255,255,255,0.06)" : "transparent",
                  color: telemetry.phase === ph ? "var(--accent-cyan)" : "var(--text-secondary)",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {ph.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* API Key configuration input */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 0, 0, 0.15)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <Key size={14} style={{ color: apiKey ? "var(--accent-teal)" : "var(--text-muted)" }} />
            <input 
              type="password"
              placeholder="Inject Gemini API Key (UI override)"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "11px",
                outline: "none",
                width: "160px"
              }}
            />
            {apiKey && (
              <span style={{ fontSize: "9px", color: "var(--accent-teal)", fontWeight: "bold" }}>SAVED</span>
            )}
          </div>
        </div>
      </header>

      {/* 2. Core Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left/Main Column: Map & Logs */}
        <div className="main-column">
          
          {/* Active SVG Stadium Layout */}
          <StadiumMap 
            gates={telemetry.gates} 
            zones={telemetry.zones} 
            onGateClick={(gate) => setSelectedGate(gate)}
          />

          {/* Real-time Crisis Injection Center */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CloudAlert size={16} style={{ color: "var(--accent-orange)" }} />
              Live Demo Crisis Injection Control Panel
            </h3>
            <div className="crisis-grid">
              <button className="btn-crisis" onClick={() => handleInjectCrisis("thunderstorm")}>
                ⚡ Storm Warning (Weather Shift)
              </button>
              <button className="btn-crisis crisis-critical" onClick={() => handleInjectCrisis("stampede_risk_gate_b")}>
                ⚠️ Gate B Surge (Bottleneck Crush)
              </button>
              <button className="btn-crisis crisis-critical" onClick={() => handleInjectCrisis("security_breach_gate_e")}>
                🚨 Perimeter Intrusion (Gate E lockdown)
              </button>
              <button className="btn-crisis" onClick={() => handleInjectCrisis("power_failure")}>
                🔌 Turnstile Scanner Outage (Gate C/D)
              </button>
              <button className="btn-crisis crisis-reset" style={{ gridColumn: "span 2", justifyContent: "center" }} onClick={() => handleInjectCrisis("reset")}>
                <RefreshCw size={14} /> Reset Stadium Simulation Engine
              </button>
            </div>
          </div>
        </div>

        {/* Right/Side Column: Stats & Chat Agent Console */}
        <div className="side-column">
          
          {/* Telemetry Stats widgets */}
          <TelemetryStats telemetry={telemetry} />

          {/* Agent Chat Terminal Console */}
          <AgentTerminal 
            chatHistory={chatHistory} 
            agentLogs={agentLogs} 
            onSendMessage={handleSendMessage}
            isThinking={isThinking}
          />
        </div>
      </div>

      {/* 3. Human-in-the-loop manual override Modal */}
      {selectedGate && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100
        }}>
          <div className="glass-panel glow-cyan" style={{ width: "350px", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", color: "var(--text-primary)" }}>
              Manual Controller: {selectedGate.name}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Current Status:</span>
                <strong style={{ color: "var(--text-primary)" }}>{selectedGate.status}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active Queue Size:</span>
                <strong style={{ color: "var(--text-primary)" }}>{selectedGate.queueSize} spectators</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Throughput Limit:</span>
                <strong style={{ color: "var(--text-primary)" }}>{selectedGate.flowRate} scans/min</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button 
                onClick={() => handleGateStatusChange(selectedGate.id, "OPEN")} 
                className="btn-primary" 
                style={{ background: "rgba(0, 245, 212, 0.15)", border: "1px solid var(--accent-teal)", color: "var(--accent-teal)", width: "100%", justifyContent: "center" }}
              >
                Set OPEN (Process Entry)
              </button>
              <button 
                onClick={() => handleGateStatusChange(selectedGate.id, "REROUTING")} 
                className="btn-primary" 
                style={{ background: "rgba(191, 90, 242, 0.15)", border: "1px solid var(--accent-purple)", color: "var(--accent-purple)", width: "100%", justifyContent: "center" }}
              >
                Set REROUTING (Restrict Inflow)
              </button>
              <button 
                onClick={() => handleGateStatusChange(selectedGate.id, "EMERGENCY_ONLY")} 
                className="btn-primary" 
                style={{ background: "rgba(255, 159, 10, 0.15)", border: "1px solid var(--accent-orange)", color: "var(--accent-orange)", width: "100%", justifyContent: "center" }}
              >
                Set EMERGENCY EXIT ONLY
              </button>
              <button 
                onClick={() => handleGateStatusChange(selectedGate.id, "CLOSED")} 
                className="btn-primary" 
                style={{ background: "rgba(255, 59, 48, 0.15)", border: "1px solid var(--accent-red)", color: "var(--accent-red)", width: "100%", justifyContent: "center" }}
              >
                Set CLOSED (Lock Gate)
              </button>
              
              <button 
                onClick={() => setSelectedGate(null)} 
                className="btn-outline" 
                style={{ width: "100%", marginTop: "10px" }}
              >
                Cancel / Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
