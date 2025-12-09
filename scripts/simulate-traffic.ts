/**
 * =============================================================================
 * Read Water - Traffic Simulator
 * =============================================================================
 * 
 * This script simulates high-volume IoT meter readings to test the ingestion
 * pipeline: HTTP Ingest -> BullMQ -> Worker -> TimescaleDB -> Socket.IO -> UI
 * 
 * Usage:
 *   cd api
 *   npx ts-node scripts/simulate-traffic.ts
 * 
 * Options:
 *   --meters=100       Number of unique meters (default: 100)
 *   --rps=50           Requests per second (default: 50)
 *   --duration=60      Duration in seconds (default: 60)
 *   --url=http://...   API base URL (default: http://localhost:4000)
 * 
 * =============================================================================
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {} as Record<string, string>);

const CONFIG = {
  meters: parseInt(args.meters || '100'),
  rps: parseInt(args.rps || '50'),
  duration: parseInt(args.duration || '60'),
  url: args.url || API_BASE,
};

// Communication technologies with their formats
const TECHNOLOGIES = ['LORAWAN', 'SIGFOX', 'NB_IOT'] as const;
type Technology = typeof TECHNOLOGIES[number];

// Generate random hex string
function randomHex(length: number): string {
  let result = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate mock meter IDs with appropriate device IDs per technology
interface MockMeter {
  id: number;
  deviceId: string;
  technology: Technology;
  currentIndex: number;
}

function generateMockMeters(count: number): MockMeter[] {
  const meters: MockMeter[] = [];
  
  for (let i = 0; i < count; i++) {
    const technology = TECHNOLOGIES[i % TECHNOLOGIES.length];
    let deviceId: string;
    
    switch (technology) {
      case 'LORAWAN':
        deviceId = randomHex(16); // DevEUI
        break;
      case 'SIGFOX':
        deviceId = randomHex(8); // Sigfox ID
        break;
      case 'NB_IOT':
        deviceId = '35' + randomHex(13).replace(/[A-F]/g, () => Math.floor(Math.random() * 10).toString()); // IMEI-like
        break;
    }
    
    meters.push({
      id: i + 1,
      deviceId,
      technology,
      currentIndex: Math.floor(Math.random() * 1000000) / 1000, // Random starting index in m³
    });
  }
  
  return meters;
}

// Generate a payload based on technology
function generatePayload(meter: MockMeter): string {
  // Increment meter index by random consumption (0.001 - 0.1 m³)
  meter.currentIndex += Math.random() * 0.099 + 0.001;
  
  // Create payload based on technology
  const indexHex = Math.floor(meter.currentIndex * 1000).toString(16).padStart(8, '0').toUpperCase();
  const batteryHex = Math.floor(Math.random() * 100).toString(16).padStart(2, '0').toUpperCase();
  const signalHex = Math.floor(Math.random() * 30 + 70).toString(16).padStart(2, '0').toUpperCase();
  const tempHex = Math.floor(Math.random() * 40 + 10).toString(16).padStart(2, '0').toUpperCase();
  
  // Payload format: INDEX(8) + BATTERY(2) + SIGNAL(2) + TEMP(2) = 14 hex chars
  return indexHex + batteryHex + signalHex + tempHex;
}

// Build request body for ingestion endpoint
function buildIngestRequest(meter: MockMeter) {
  const payload = generatePayload(meter);
  
  return {
    deviceId: meter.deviceId,
    payload,
    technology: meter.technology,
    timestamp: new Date().toISOString(),
    rssi: Math.floor(Math.random() * 30) - 110, // -110 to -80 dBm
    snr: Math.floor(Math.random() * 20) - 5, // -5 to 15 dB
  };
}

// Stats tracking
interface Stats {
  sent: number;
  successful: number;
  failed: number;
  totalLatency: number;
  startTime: number;
}

const stats: Stats = {
  sent: 0,
  successful: 0,
  failed: 0,
  totalLatency: 0,
  startTime: 0,
};

// Send a single request
async function sendRequest(meter: MockMeter): Promise<void> {
  const body = buildIngestRequest(meter);
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${CONFIG.url}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const latency = Date.now() - startTime;
    stats.totalLatency += latency;
    stats.sent++;
    
    if (response.ok || response.status === 202) {
      stats.successful++;
    } else {
      stats.failed++;
      if (stats.failed <= 5) {
        console.error(`Request failed: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    stats.failed++;
    stats.sent++;
    if (stats.failed <= 5) {
      console.error(`Request error: ${error}`);
    }
  }
}

// Print progress
function printProgress(): void {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const actualRps = stats.sent / elapsed;
  const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;
  const successRate = stats.sent > 0 ? (stats.successful / stats.sent * 100).toFixed(1) : '0';
  
  process.stdout.write(
    `\r📊 Sent: ${stats.sent} | Success: ${stats.successful} | Failed: ${stats.failed} | ` +
    `RPS: ${actualRps.toFixed(1)} | Avg Latency: ${avgLatency.toFixed(0)}ms | Success Rate: ${successRate}%`
  );
}

// Main simulation loop
async function runSimulation(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          Read Water - Traffic Simulator 🌊                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Meters: ${CONFIG.meters.toString().padEnd(10)} │ RPS Target: ${CONFIG.rps.toString().padEnd(10)}       ║`);
  console.log(`║  Duration: ${CONFIG.duration}s          │ API: ${CONFIG.url.slice(0, 25).padEnd(25)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Generate mock meters
  console.log(`🔧 Generating ${CONFIG.meters} mock meters...`);
  const meters = generateMockMeters(CONFIG.meters);
  console.log('✅ Meters generated');
  console.log('');
  
  // Calculate interval between requests
  const intervalMs = 1000 / CONFIG.rps;
  const totalRequests = CONFIG.rps * CONFIG.duration;
  
  console.log(`🚀 Starting simulation: ${totalRequests} requests over ${CONFIG.duration} seconds`);
  console.log('   Press Ctrl+C to stop early');
  console.log('');
  
  stats.startTime = Date.now();
  let requestIndex = 0;
  
  // Progress printing interval
  const progressInterval = setInterval(printProgress, 500);
  
  // Main request loop
  const endTime = stats.startTime + (CONFIG.duration * 1000);
  
  while (Date.now() < endTime) {
    const meter = meters[requestIndex % meters.length];
    
    // Fire and forget (don't await to maintain RPS)
    sendRequest(meter);
    
    requestIndex++;
    
    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  // Wait for pending requests to complete
  console.log('\n\n⏳ Waiting for pending requests to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  clearInterval(progressInterval);
  printProgress();
  
  // Final stats
  const totalTime = (Date.now() - stats.startTime) / 1000;
  const actualRps = stats.sent / totalTime;
  const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;
  
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Simulation Complete! ✅                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Requests:   ${stats.sent.toString().padEnd(10)}                              ║`);
  console.log(`║  Successful:       ${stats.successful.toString().padEnd(10)} (${(stats.successful/stats.sent*100).toFixed(1)}%)                     ║`);
  console.log(`║  Failed:           ${stats.failed.toString().padEnd(10)}                              ║`);
  console.log(`║  Actual RPS:       ${actualRps.toFixed(1).padEnd(10)}                              ║`);
  console.log(`║  Avg Latency:      ${avgLatency.toFixed(0)}ms`.padEnd(65) + '║');
  console.log(`║  Total Time:       ${totalTime.toFixed(1)}s`.padEnd(65) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('💡 Check the frontend Live Readings page to see real-time updates!');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Simulation interrupted by user');
  const totalTime = (Date.now() - stats.startTime) / 1000;
  console.log(`📊 Partial results: ${stats.sent} requests in ${totalTime.toFixed(1)}s`);
  process.exit(0);
});

// Run the simulation
runSimulation().catch(console.error);

