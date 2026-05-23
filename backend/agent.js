import { GoogleGenerativeAI } from "@google/generative-ai";

const tools = [
  {
    functionDeclarations: [
      {
        name: "getStadiumTelemetry",
        description: "Fetch real-time stadium metrics including gate queue sizes, zone occupancies, active alerts, dispatched services, and weather.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "updateGateStatus",
        description: "Modify the operational status of a specific entry/exit gate. Closed gates stop flow. Emergency gates open with high capacity. Rerouting restricts flow. EMERGENCY_ONLY opens gate with extreme exit capacity.",
        parameters: {
          type: "OBJECT",
          properties: {
            gateId: {
              type: "STRING",
              description: "The ID of the gate to update (e.g., 'gate-a', 'gate-b', 'gate-c', 'gate-d', 'gate-e', 'gate-f')."
            },
            status: {
              type: "STRING",
              enum: ["OPEN", "CLOSED", "REROUTING", "EMERGENCY_ONLY"],
              description: "The target status for the gate."
            }
          },
          required: ["gateId", "status"]
        }
      },
      {
        name: "broadcastAlert",
        description: "Send an emergency or informational broadcast message to fans and volunteers in a specific zone or stadium-wide.",
        parameters: {
          type: "OBJECT",
          properties: {
            message: {
              type: "STRING",
              description: "The message text to broadcast."
            },
            zone: {
              type: "STRING",
              description: "The target zone stand (e.g., 'zone-1', 'zone-2', 'zone-3', 'zone-4', or 'all')."
            }
          },
          required: ["message", "zone"]
        }
      },
      {
        name: "dispatchEmergencyServices",
        description: "Deploy emergency response units (Security, Medical, Fire Rescue) to a specific gate location.",
        parameters: {
          type: "OBJECT",
          properties: {
            serviceType: {
              type: "STRING",
              enum: ["Security", "Medical", "Fire Rescue"],
              description: "The type of emergency responder service."
            },
            gateId: {
              type: "STRING",
              description: "The target gate ID (e.g., 'gate-a', 'gate-b', etc.)."
            }
          },
          required: ["serviceType", "gateId"]
        }
      }
    ]
  }
];

export async function runAgentSession(simulator, userMessage, chatHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: "Error: GEMINI_API_KEY environment variable is not configured in the backend dashboard server.",
      logs: [{ timestamp: new Date().toLocaleTimeString(), message: "System error: Missing API Key" }]
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Quick responses suitable for live presentation pacing
    systemInstruction: `You are the CrowdSync Command Orchestrator, an AI-powered safety agent designed to manage crowd routing, gate flows, and emergency logistics for major cricket matches.
Your job is to:
1. Access stadium metrics via 'getStadiumTelemetry'.
2. Reroute gates, open emergency gates, broadcast warning messages, and dispatch response units whenever safety indices (like queue size or active weather/crowd alerts) require immediate response.
3. Be proactive: if a storm alert is in the telemetry, open emergency exits, broadcast shelter advice, and reroute outdoor crowds. If a gate B bottleneck is reported, update B to REROUTING or CLOSED, route traffic to gates with lower queues, and broadcast reroute instructions to Zone 2/3.
4. Keep explanations concise, professional, and structured. Let the operator know exactly what you did, which tools you invoked, and your rationale.`
  });

  // Map incoming history to format required by Gemini Chat Content structure
  const contents = chatHistory.map(item => {
    return {
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text }]
    };
  });

  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const agentLogs = [];
  let loopCount = 0;
  const maxLoops = 5;

  while (loopCount < maxLoops) {
    loopCount++;
    
    agentLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      message: `Analyzing stadium conditions... (Iteration ${loopCount})`
    });

    try {
      const response = await model.generateContent({
        contents,
        tools
      });

      const candidate = response.response.candidates?.[0];
      if (!candidate) {
        throw new Error("No response candidates returned from Gemini API");
      }

      const content = candidate.content;
      const parts = content.parts || [];
      
      // Push the model's output content to history to maintain conversational turn state
      contents.push(content);

      const functionCalls = parts.filter(p => p.functionCall);

      // If no function calls, agent has finalized text response
      if (functionCalls.length === 0) {
        const textPart = parts.find(p => p.text);
        return {
          text: textPart ? textPart.text : "Stadium operations updated.",
          logs: agentLogs
        };
      }

      // Execute all tools requested by the model
      const functionResponses = [];
      for (const fc of functionCalls) {
        const { name, args } = fc.functionCall;
        
        agentLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          message: `🛠️ Tool Request: ${name}(${JSON.stringify(args)})`
        });

        let result;
        if (name === "getStadiumTelemetry") {
          result = simulator.getTelemetry();
        } else if (name === "updateGateStatus") {
          const success = simulator.updateGateStatus(args.gateId, args.status);
          result = { success, message: success ? `Gate ${args.gateId.toUpperCase()} set to ${args.status}` : "Gate not found" };
        } else if (name === "broadcastAlert") {
          const success = simulator.broadcastAlert(args.message, args.zone);
          result = { success, message: success ? `Broadcasted alert to ${args.zone}: "${args.message}"` : "Broadcast failed" };
        } else if (name === "dispatchEmergencyServices") {
          const success = simulator.dispatchEmergencyServices(args.serviceType, args.gateId);
          result = { success, message: success ? `${args.serviceType} services dispatched to ${args.gateId.toUpperCase()}` : "Dispatch failed" };
        } else {
          result = { error: "Unknown tool call" };
        }

        agentLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          message: `✅ Tool Response: ${JSON.stringify(result)}`
        });

        functionResponses.push({
          functionResponse: {
            name,
            response: { result }
          }
        });
      }

      // Add the function responses back to Gemini context
      contents.push({
        role: "function",
        parts: functionResponses
      });

    } catch (error) {
      console.error("Gemini Execution Error:", error);
      agentLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `⚠️ Error: ${error.message}`
      });
      return {
        text: `An error occurred during Gemini reasoning: ${error.message}. Please verify your API Key and network.`,
        logs: agentLogs
      };
    }
  }

  return {
    text: "Operational workflows updated based on telemetry analysis.",
    logs: agentLogs
  };
}
