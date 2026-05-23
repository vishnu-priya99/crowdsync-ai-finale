import test from "node:test";
import assert from "node:assert/strict";
import StadiumSimulator from "./simulator.js";

test("StadiumSimulator Core Logic Suite", async (t) => {

  await t.test("Initial state is correctly populated", () => {
    const simulator = new StadiumSimulator();
    const telemetry = simulator.getTelemetry();
    
    assert.strictEqual(telemetry.phase, "PRE_MATCH");
    assert.strictEqual(telemetry.gates.length, 6);
    assert.strictEqual(telemetry.zones.length, 4);
    assert.strictEqual(telemetry.alerts.length, 0);
    simulator.destroy();
  });

  await t.test("updateGateStatus correctly updates valid gates", () => {
    const simulator = new StadiumSimulator();
    
    const success = simulator.updateGateStatus("gate-a", "REROUTING");
    assert.strictEqual(success, true);
    
    const telemetry = simulator.getTelemetry();
    const gateA = telemetry.gates.find(g => g.id === "gate-a");
    assert.strictEqual(gateA.status, "REROUTING");
    simulator.destroy();
  });

  await t.test("updateGateStatus gracefully rejects invalid gates", () => {
    const simulator = new StadiumSimulator();
    
    const success = simulator.updateGateStatus("gate-invalid", "OPEN");
    assert.strictEqual(success, false);
    simulator.destroy();
  });

  await t.test("injectCrisis: thunderstorm creates weather alert", () => {
    const simulator = new StadiumSimulator();
    
    const telemetry = simulator.injectCrisis("thunderstorm");
    
    assert.strictEqual(telemetry.weather.condition, "Storming");
    assert.ok(telemetry.weather.precipitation > 50);
    assert.ok(telemetry.alerts.some(a => a.id === "weather-storm"));
    simulator.destroy();
  });

  await t.test("injectCrisis: stampede risk causes bottleneck alert", () => {
    const simulator = new StadiumSimulator();
    
    const telemetry = simulator.injectCrisis("stampede_risk_gate_b");
    const gateB = telemetry.gates.find(g => g.id === "gate-b");
    
    assert.ok(gateB.queueSize > 400);
    assert.strictEqual(gateB.flowRate, 5);
    assert.ok(telemetry.alerts.some(a => a.id === "stampede-gate-b"));
    simulator.destroy();
  });

  await t.test("dispatchEmergencyServices successfully logs dispatches", () => {
    const simulator = new StadiumSimulator();
    
    const success = simulator.dispatchEmergencyServices("Medical", "gate-b");
    assert.strictEqual(success, true);
    
    const telemetry = simulator.getTelemetry();
    assert.strictEqual(telemetry.dispatchedServices.length, 1);
    assert.strictEqual(telemetry.dispatchedServices[0].serviceType, "Medical");
    assert.strictEqual(telemetry.dispatchedServices[0].gateId, "gate-b");
    simulator.destroy();
  });

  await t.test("broadcastAlert creates broadcast logs", () => {
    const simulator = new StadiumSimulator();
    
    const success = simulator.broadcastAlert("Please evacuate", "zone-1");
    assert.strictEqual(success, true);
    
    const telemetry = simulator.getTelemetry();
    assert.strictEqual(telemetry.broadcastLogs.length, 1);
    assert.strictEqual(telemetry.broadcastLogs[0].zone, "zone-1");
    simulator.destroy();
  });

});
