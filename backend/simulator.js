// Stadium Crowd Simulation Engine

class StadiumSimulator {
  constructor() {
    this.phase = "PRE_MATCH"; // PRE_MATCH, IN_PROGRESS, POST_MATCH
    this.weather = {
      condition: "Clear",
      temp: 32,
      windSpeed: 12,
      precipitation: 0
    };
    
    this.gates = [
      { id: "gate-a", name: "Gate A (North Entrance)", status: "OPEN", queueSize: 120, capacity: 500, flowRate: 45, associatedZones: ["zone-1", "zone-2"] },
      { id: "gate-b", name: "Gate B (East Entrance)", status: "OPEN", queueSize: 210, capacity: 500, flowRate: 50, associatedZones: ["zone-2", "zone-3"] },
      { id: "gate-c", name: "Gate C (South Entrance)", status: "OPEN", queueSize: 95, capacity: 500, flowRate: 40, associatedZones: ["zone-3", "zone-4"] },
      { id: "gate-d", name: "Gate D (West Entrance)", status: "OPEN", queueSize: 140, capacity: 500, flowRate: 45, associatedZones: ["zone-4", "zone-1"] },
      { id: "gate-e", name: "Gate E (Emergency Exit North)", status: "CLOSED", queueSize: 0, capacity: 1000, flowRate: 0, associatedZones: ["zone-1", "zone-2"] },
      { id: "gate-f", name: "Gate F (Emergency Exit South)", status: "CLOSED", queueSize: 0, capacity: 1000, flowRate: 0, associatedZones: ["zone-3", "zone-4"] }
    ];

    this.zones = [
      { id: "zone-1", name: "North Stand (Zone 1)", currentOccupancy: 4200, capacity: 8000 },
      { id: "zone-2", name: "East Pavilion (Zone 2)", currentOccupancy: 6100, capacity: 10000 },
      { id: "zone-3", name: "South Stand (Zone 3)", currentOccupancy: 3900, capacity: 8000 },
      { id: "zone-4", name: "West Pavilion (Zone 4)", currentOccupancy: 5300, capacity: 10000 }
    ];

    this.alerts = [];
    this.broadcastLogs = [];
    this.dispatchedServices = [];
    
    // Total ticketing counts
    this.ticketsScanned = 19500;
    this.ticketsTotal = 36000;

    // Start simulation ticks
    this.tickInterval = setInterval(() => this.tick(), 3000);
  }

  getTelemetry() {
    // Calculate current densities
    const gateData = this.gates.map(g => {
      const density = Math.min(100, Math.round((g.queueSize / g.capacity) * 100));
      return { ...g, density };
    });

    const zoneData = this.zones.map(z => {
      const density = Math.min(100, Math.round((z.currentOccupancy / z.capacity) * 100));
      return { ...z, density };
    });

    return {
      phase: this.phase,
      weather: this.weather,
      gates: gateData,
      zones: zoneData,
      alerts: this.alerts,
      ticketsScanned: this.ticketsScanned,
      ticketsTotal: this.ticketsTotal,
      dispatchedServices: this.dispatchedServices,
      broadcastLogs: this.broadcastLogs.slice(-10) // last 10 logs
    };
  }

  updateGateStatus(gateId, status) {
    const gate = this.gates.find(g => g.id === gateId);
    if (gate) {
      gate.status = status;
      if (status === "CLOSED") {
        gate.flowRate = 0;
      } else if (status === "OPEN") {
        gate.flowRate = gateId.startsWith("gate-e") || gateId.startsWith("gate-f") ? 150 : 45; // Emergency exit open rate is high
      } else if (status === "EMERGENCY_ONLY") {
        gate.flowRate = 180; // massive flow rate for evacuation
      } else if (status === "REROUTING") {
        gate.flowRate = 15; // bottlenecked or restricted flow
      }
      return true;
    }
    return false;
  }

  broadcastAlert(message, zone) {
    const timestamp = new Date().toLocaleTimeString();
    this.broadcastLogs.push({ timestamp, message, zone });
    return true;
  }

  dispatchEmergencyServices(serviceType, gateId) {
    const timestamp = new Date().toLocaleTimeString();
    this.dispatchedServices.push({ timestamp, serviceType, gateId });
    this.alerts.push({
      id: `emergency-dispatch-${Date.now()}`,
      severity: "INFO",
      source: "Manual/Agent Dispatch",
      message: `${serviceType} services dispatched to ${gateId.toUpperCase().replace("-", " ")}.`
    });
    return true;
  }

  injectCrisis(type) {
    if (type === "thunderstorm") {
      this.weather.condition = "Storming";
      this.weather.precipitation = 95;
      this.weather.temp = 22;
      this.weather.windSpeed = 48;
      
      this.alerts.push({
        id: "weather-storm",
        severity: "CRITICAL",
        source: "Weather Radar",
        message: "Severe Thunderstorm Alert: High-speed winds, heavy precipitation, and lightning hazard detected near stadium. Move open-stand spectators to sheltered concourses immediately."
      });
    } else if (type === "stampede_risk_gate_b") {
      const gateB = this.gates.find(g => g.id === "gate-b");
      if (gateB) {
        gateB.queueSize = 480; // dangerous level
        gateB.flowRate = 5; // drop due to blockage
      }
      this.alerts.push({
        id: "stampede-gate-b",
        severity: "CRITICAL",
        source: "CCTV Crowd Analytics",
        message: "Crowd Crush / Bottleneck Risk Detected at Gate B. Queue exceeds safety thresholds (480/500 density). Flow rate has dropped due to physical gate friction."
      });
    } else if (type === "security_breach_gate_e") {
      const gateE = this.gates.find(g => g.id === "gate-e");
      if (gateE) {
        gateE.status = "CLOSED";
      }
      this.alerts.push({
        id: "security-breach-e",
        severity: "HIGH",
        source: "Access Control Systems",
        message: "Intrusion / Perimeter Breach attempt detected near Emergency Gate E. Security requested immediately to lock down and sweep the sector."
      });
    } else if (type === "power_failure") {
      const gateC = this.gates.find(g => g.id === "gate-c");
      const gateD = this.gates.find(g => g.id === "gate-d");
      if (gateC) { gateC.flowRate = 0; gateC.queueSize = 350; }
      if (gateD) { gateD.flowRate = 0; gateD.queueSize = 320; }
      
      this.alerts.push({
        id: "power-failure-cd",
        severity: "HIGH",
        source: "Facilities Management",
        message: "Localized power grid failure affecting turnstiles at Gate C and Gate D. Manual ticket scanning initiated, leading to rapid crowd accumulation."
      });
    } else if (type === "reset") {
      this.weather = { condition: "Clear", temp: 32, windSpeed: 12, precipitation: 0 };
      this.gates = [
        { id: "gate-a", name: "Gate A (North Entrance)", status: "OPEN", queueSize: 120, capacity: 500, flowRate: 45, associatedZones: ["zone-1", "zone-2"] },
        { id: "gate-b", name: "Gate B (East Entrance)", status: "OPEN", queueSize: 210, capacity: 500, flowRate: 50, associatedZones: ["zone-2", "zone-3"] },
        { id: "gate-c", name: "Gate C (South Entrance)", status: "OPEN", queueSize: 95, capacity: 500, flowRate: 40, associatedZones: ["zone-3", "zone-4"] },
        { id: "gate-d", name: "Gate D (West Entrance)", status: "OPEN", queueSize: 140, capacity: 500, flowRate: 45, associatedZones: ["zone-4", "zone-1"] },
        { id: "gate-e", name: "Gate E (Emergency Exit North)", status: "CLOSED", queueSize: 0, capacity: 1000, flowRate: 0, associatedZones: ["zone-1", "zone-2"] },
        { id: "gate-f", name: "Gate F (Emergency Exit South)", status: "CLOSED", queueSize: 0, capacity: 1000, flowRate: 0, associatedZones: ["zone-3", "zone-4"] }
      ];
      this.zones = [
        { id: "zone-1", name: "North Stand (Zone 1)", currentOccupancy: 4200, capacity: 8000 },
        { id: "zone-2", name: "East Pavilion (Zone 2)", currentOccupancy: 6100, capacity: 10000 },
        { id: "zone-3", name: "South Stand (Zone 3)", currentOccupancy: 3900, capacity: 8000 },
        { id: "zone-4", name: "West Pavilion (Zone 4)", currentOccupancy: 5300, capacity: 10000 }
      ];
      this.alerts = [];
      this.dispatchedServices = [];
      this.broadcastLogs = [];
      this.ticketsScanned = 19500;
    }
    return this.getTelemetry();
  }

  tick() {
    // Simulate real-time crowd dynamics based on match phase
    if (this.phase === "PRE_MATCH") {
      // Spectators entering the stadium
      this.gates.forEach(g => {
        if (g.status === "OPEN") {
          // Influx of people arriving
          const influx = Math.floor(Math.random() * 30) + 20; // 20-50 people arriving
          // Processing speed
          const processed = Math.min(g.queueSize, Math.floor(g.flowRate * (0.8 + Math.random() * 0.4)));
          
          g.queueSize = Math.max(0, g.queueSize + influx - processed);
          this.ticketsScanned += processed;

          // Distribute processed people to associated zones
          processed.toString(); // noop
          const zCount = g.associatedZones.length;
          g.associatedZones.forEach(zId => {
            const zone = this.zones.find(z => z.id === zId);
            if (zone && zone.currentOccupancy < zone.capacity) {
              zone.currentOccupancy = Math.min(zone.capacity, zone.currentOccupancy + Math.floor(processed / zCount));
            }
          });
        } else if (g.status === "REROUTING") {
          // Slow trickle, remainder routed away
          const processed = Math.min(g.queueSize, Math.floor(g.flowRate * (0.5 + Math.random() * 0.5)));
          g.queueSize = Math.max(0, g.queueSize - processed);
          this.ticketsScanned += processed;
          
          // Re-route newcomers to other OPEN gates
          const otherGates = this.gates.filter(og => og.status === "OPEN" && og.id !== g.id && !og.id.startsWith("gate-e"));
          if (otherGates.length > 0) {
            const redirectGate = otherGates[Math.floor(Math.random() * otherGates.length)];
            redirectGate.queueSize += Math.floor(Math.random() * 15);
          }
        } else if (g.status === "CLOSED" && g.queueSize > 0) {
          // Queue builds up if they don't know it's closed, or disperses slowly
          g.queueSize = Math.max(0, g.queueSize - (Math.floor(Math.random() * 10) + 5)); // dispersing
          // Send crowd to open gates
          const openGates = this.gates.filter(og => og.status === "OPEN" && !og.id.startsWith("gate-e"));
          if (openGates.length > 0) {
            const redirectGate = openGates[Math.floor(Math.random() * openGates.length)];
            redirectGate.queueSize += Math.floor(Math.random() * 10);
          }
        }
      });

      // Stop pre-match phase if total ticket scan capacity is reached
      if (this.ticketsScanned >= this.ticketsTotal * 0.95) {
        this.phase = "IN_PROGRESS";
      }
    } else if (this.phase === "IN_PROGRESS") {
      // Inside stadium, queues are low, occasional movement
      this.gates.forEach(g => {
        if (!g.id.startsWith("gate-e") && g.status === "OPEN") {
          g.queueSize = Math.max(0, Math.floor(g.queueSize * 0.8) + Math.floor(Math.random() * 5));
        }
      });
    } else if (this.phase === "POST_MATCH") {
      // Everyone leaving stadium. Exit flow from zones to gates!
      // Invert logic: zones lose people, gates queue sizes increase for exits
      let totalOccupancy = this.zones.reduce((sum, z) => sum + z.currentOccupancy, 0);
      if (totalOccupancy > 100) {
        this.gates.forEach(g => {
          if (g.status === "OPEN" || g.status === "EMERGENCY_ONLY") {
            // Outflux from stadium
            const exitInflux = Math.floor(Math.random() * 60) + 40;
            g.queueSize = Math.min(g.capacity * 1.5, g.queueSize + exitInflux);
            
            // Process exits
            const processedExits = Math.min(g.queueSize, Math.floor(g.flowRate * 1.5));
            g.queueSize = Math.max(0, g.queueSize - processedExits);

            // Deduct from zones
            g.associatedZones.forEach(zId => {
              const zone = this.zones.find(z => z.id === zId);
              if (zone) {
                zone.currentOccupancy = Math.max(0, zone.currentOccupancy - Math.floor(exitInflux / g.associatedZones.length));
              }
            });
          }
        });
      }
    }
  }

  destroy() {
    clearInterval(this.tickInterval);
  }
}

export default StadiumSimulator;
