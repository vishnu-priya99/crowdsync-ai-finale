import React, { useState, useRef, useEffect } from "react";
import { Send, Terminal as TermIcon, Loader } from "lucide-react";

export default function AgentTerminal({ chatHistory = [], agentLogs = [], onSendMessage, isThinking }) {
  const [input, setInput] = useState("");
  const terminalEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of logs and chats
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput("");
  };

  // Helper to color code terminal messages
  const getLogColor = (message) => {
    if (message.includes("🛠️ Tool Request")) return "var(--accent-cyan)";
    if (message.includes("✅ Tool Response")) return "var(--accent-teal)";
    if (message.includes("⚠️ Error") || message.includes("Critical")) return "var(--accent-red)";
    if (message.includes("Analyzing")) return "var(--text-secondary)";
    return "var(--text-muted)";
  };

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "500px", gap: "12px" }}>
      {/* Title Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TermIcon size={18} style={{ color: "var(--accent-cyan)" }} />
          <h3 style={{ fontSize: "16px" }}>Gemini Command Orchestrator</h3>
        </div>
        {isThinking && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-cyan)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 600 }}>
            <Loader size={14} className="spinning-loader" style={{ animation: "spin 1.5s linear infinite" }} />
            Agent Reasoning...
          </div>
        )}
      </div>

      {/* Main Terminal View (Split into chat messages and execution log) */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: "10px", minHeight: 0 }}>
        
        {/* Execution Log Sub-terminal */}
        <div style={{ flexBasis: "40%", display: "flex", flexDirection: "column", minHeight: "150px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.05em" }}>
            Telemetry Monitoring & Execution Logs
          </div>
          <div className="terminal-console" style={{ flexGrow: 1, height: "100%" }}>
            {agentLogs.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>
                System idle. Awaiting instruction or telemetry anomaly...
              </div>
            ) : (
              agentLogs.map((log, index) => (
                <div key={index} className="terminal-line" style={{ color: getLogColor(log.message) }}>
                  <span className="terminal-time">[{log.timestamp}]</span>
                  <span className="terminal-msg">{log.message}</span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Chat Feed */}
        <div style={{ flexBasis: "60%", display: "flex", flexDirection: "column", minHeight: "200px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.05em" }}>
            Operator Chat Feed
          </div>
          <div style={{ flexGrow: 1, background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* System welcome */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", fontSize: "12px" }}>
              <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: "3px" }}>🤖 CrowdSync System Agent Initialized:</strong>
              Use natural language to instruct operations. Example: <em>"We have crowd surges at Gate B, reroute to other gates and broadcast the warning."</em> or <em>"Inspect the stadium for any safety issues and deploy emergency units if needed."</em>
            </div>

            {/* Chat history list */}
            {chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: chat.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: chat.role === "user" ? "linear-gradient(135deg, rgba(10, 132, 255, 0.2), rgba(0, 240, 255, 0.2))" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${chat.role === "user" ? "rgba(0, 240, 255, 0.3)" : "rgba(255, 255, 255, 0.05)"}`,
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "13px"
                }}
              >
                <div style={{ fontSize: "10px", color: chat.role === "user" ? "var(--accent-cyan)" : "var(--accent-teal)", fontWeight: "bold", marginBottom: "3px", textTransform: "uppercase" }}>
                  {chat.role === "user" ? "Stadium Operator" : "CrowdSync AI"}
                </div>
                <div style={{ color: "var(--text-primary)", whiteSpace: "pre-line", lineHeight: "1.4" }}>{chat.text}</div>
              </div>
            ))}

            {isThinking && (
              <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="pulsing-indicator-cyan"></span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>Orchestrating agent workflows...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isThinking ? "Agent processing..." : "Command the orchestrator (e.g. 'Reroute Gate B traffic')..."}
          disabled={isThinking}
          className="input-field"
          style={{ flexGrow: 1 }}
        />
        <button 
          type="submit" 
          disabled={isThinking || !input.trim()}
          className="btn-primary"
          style={{ padding: "12px", width: "45px", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Spin Animation injected via JSX styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinning-loader {
          animation: spin 1.5s linear infinite;
        }
      `}} />
    </div>
  );
}
