"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_BASE = process.env.API_URL || 'http://localhost:4000';
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value;
    return acc;
}, {});
const CONFIG = {
    meters: parseInt(args.meters || '100'),
    rps: parseInt(args.rps || '50'),
    duration: parseInt(args.duration || '60'),
    url: args.url || API_BASE,
};
const TECHNOLOGIES = ['LORAWAN', 'SIGFOX', 'NB_IOT'];
function randomHex(length) {
    let result = '';
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
function generateMockMeters(count) {
    const meters = [];
    for (let i = 0; i < count; i++) {
        const technology = TECHNOLOGIES[i % TECHNOLOGIES.length];
        let deviceId;
        switch (technology) {
            case 'LORAWAN':
                deviceId = randomHex(16);
                break;
            case 'SIGFOX':
                deviceId = randomHex(8);
                break;
            case 'NB_IOT':
                deviceId = '35' + randomHex(13).replace(/[A-F]/g, () => Math.floor(Math.random() * 10).toString());
                break;
        }
        meters.push({
            id: i + 1,
            deviceId,
            technology,
            currentIndex: Math.floor(Math.random() * 1000000) / 1000,
        });
    }
    return meters;
}
function generatePayload(meter) {
    meter.currentIndex += Math.random() * 0.099 + 0.001;
    const indexHex = Math.floor(meter.currentIndex * 1000).toString(16).padStart(8, '0').toUpperCase();
    const batteryHex = Math.floor(Math.random() * 100).toString(16).padStart(2, '0').toUpperCase();
    const signalHex = Math.floor(Math.random() * 30 + 70).toString(16).padStart(2, '0').toUpperCase();
    const tempHex = Math.floor(Math.random() * 40 + 10).toString(16).padStart(2, '0').toUpperCase();
    return indexHex + batteryHex + signalHex + tempHex;
}
function buildIngestRequest(meter) {
    const payload = generatePayload(meter);
    return {
        deviceId: meter.deviceId,
        payload,
        technology: meter.technology,
        timestamp: new Date().toISOString(),
        rssi: Math.floor(Math.random() * 30) - 110,
        snr: Math.floor(Math.random() * 20) - 5,
    };
}
const stats = {
    sent: 0,
    successful: 0,
    failed: 0,
    totalLatency: 0,
    startTime: 0,
};
async function sendRequest(meter) {
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
        }
        else {
            stats.failed++;
            if (stats.failed <= 5) {
                console.error(`Request failed: ${response.status} ${response.statusText}`);
            }
        }
    }
    catch (error) {
        stats.failed++;
        stats.sent++;
        if (stats.failed <= 5) {
            console.error(`Request error: ${error}`);
        }
    }
}
function printProgress() {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const actualRps = stats.sent / elapsed;
    const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;
    const successRate = stats.sent > 0 ? (stats.successful / stats.sent * 100).toFixed(1) : '0';
    process.stdout.write(`\r📊 Sent: ${stats.sent} | Success: ${stats.successful} | Failed: ${stats.failed} | ` +
        `RPS: ${actualRps.toFixed(1)} | Avg Latency: ${avgLatency.toFixed(0)}ms | Success Rate: ${successRate}%`);
}
async function runSimulation() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          Read Water - Traffic Simulator 🌊                     ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Meters: ${CONFIG.meters.toString().padEnd(10)} │ RPS Target: ${CONFIG.rps.toString().padEnd(10)}       ║`);
    console.log(`║  Duration: ${CONFIG.duration}s          │ API: ${CONFIG.url.slice(0, 25).padEnd(25)} ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🔧 Generating ${CONFIG.meters} mock meters...`);
    const meters = generateMockMeters(CONFIG.meters);
    console.log('✅ Meters generated');
    console.log('');
    const intervalMs = 1000 / CONFIG.rps;
    const totalRequests = CONFIG.rps * CONFIG.duration;
    console.log(`🚀 Starting simulation: ${totalRequests} requests over ${CONFIG.duration} seconds`);
    console.log('   Press Ctrl+C to stop early');
    console.log('');
    stats.startTime = Date.now();
    let requestIndex = 0;
    const progressInterval = setInterval(printProgress, 500);
    const endTime = stats.startTime + (CONFIG.duration * 1000);
    while (Date.now() < endTime) {
        const meter = meters[requestIndex % meters.length];
        sendRequest(meter);
        requestIndex++;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    console.log('\n\n⏳ Waiting for pending requests to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearInterval(progressInterval);
    printProgress();
    const totalTime = (Date.now() - stats.startTime) / 1000;
    const actualRps = stats.sent / totalTime;
    const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    Simulation Complete! ✅                     ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Total Requests:   ${stats.sent.toString().padEnd(10)}                              ║`);
    console.log(`║  Successful:       ${stats.successful.toString().padEnd(10)} (${(stats.successful / stats.sent * 100).toFixed(1)}%)                     ║`);
    console.log(`║  Failed:           ${stats.failed.toString().padEnd(10)}                              ║`);
    console.log(`║  Actual RPS:       ${actualRps.toFixed(1).padEnd(10)}                              ║`);
    console.log(`║  Avg Latency:      ${avgLatency.toFixed(0)}ms`.padEnd(65) + '║');
    console.log(`║  Total Time:       ${totalTime.toFixed(1)}s`.padEnd(65) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('💡 Check the frontend Live Readings page to see real-time updates!');
    console.log('');
}
process.on('SIGINT', () => {
    console.log('\n\n🛑 Simulation interrupted by user');
    const totalTime = (Date.now() - stats.startTime) / 1000;
    console.log(`📊 Partial results: ${stats.sent} requests in ${totalTime.toFixed(1)}s`);
    process.exit(0);
});
runSimulation().catch(console.error);
//# sourceMappingURL=simulate-traffic.js.map