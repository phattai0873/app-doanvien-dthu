/**
 * Load Test Script — 300 Concurrent Requests
 * Giả lập 300 người dùng gửi request đồng thời
 * Chạy: node load_test.js
 */

const http = require('http');

const HOST = '127.0.0.1';
const PORT = 5000;
const TOTAL_REQUESTS = 300;
const TEST_ENDPOINT = '/api/news'; // Endpoint public, không cần auth

const results = {
    success: 0,
    failed: 0,
    timeouts: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    responseTimes: [],
    errors: []
};

function makeRequest(index) {
    return new Promise((resolve) => {
        const start = Date.now();

        const options = {
            hostname: HOST,
            port: PORT,
            path: TEST_ENDPOINT,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10s timeout
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const elapsed = Date.now() - start;
                results.responseTimes.push(elapsed);
                results.totalTime += elapsed;
                if (elapsed < results.minTime) results.minTime = elapsed;
                if (elapsed > results.maxTime) results.maxTime = elapsed;

                if (res.statusCode >= 200 && res.statusCode < 400) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`[${index}] HTTP ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('timeout', () => {
            results.timeouts++;
            results.failed++;
            results.errors.push(`[${index}] TIMEOUT`);
            req.destroy();
            resolve();
        });

        req.on('error', (err) => {
            results.failed++;
            results.errors.push(`[${index}] ERROR: ${err.message}`);
            resolve();
        });

        req.end();
    });
}

async function runLoadTest() {
    console.log('='.repeat(60));
    console.log('🚀 LOAD TEST — AppDoanVien Backend');
    console.log(`📍 Target: http://${HOST}:${PORT}${TEST_ENDPOINT}`);
    console.log(`👥 Concurrent requests: ${TOTAL_REQUESTS}`);
    console.log('='.repeat(60));
    console.log('🔄 Đang gửi requests...\n');

    const globalStart = Date.now();

    // Gửi tất cả requests cùng một lúc (true concurrency)
    const promises = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(makeRequest(i + 1));
    }

    await Promise.all(promises);

    const totalElapsed = Date.now() - globalStart;
    const avgTime = results.responseTimes.length > 0
        ? Math.round(results.totalTime / results.responseTimes.length)
        : 0;

    // Sort for percentiles
    results.responseTimes.sort((a, b) => a - b);
    const p50 = results.responseTimes[Math.floor(results.responseTimes.length * 0.5)] || 0;
    const p90 = results.responseTimes[Math.floor(results.responseTimes.length * 0.9)] || 0;
    const p99 = results.responseTimes[Math.floor(results.responseTimes.length * 0.99)] || 0;

    const rps = Math.round(TOTAL_REQUESTS / (totalElapsed / 1000));

    console.log('='.repeat(60));
    console.log('📊 KẾT QUẢ LOAD TEST');
    console.log('='.repeat(60));
    console.log(`✅ Thành công     : ${results.success} / ${TOTAL_REQUESTS}`);
    console.log(`❌ Thất bại       : ${results.failed} / ${TOTAL_REQUESTS}`);
    console.log(`⏱️  Timeout        : ${results.timeouts}`);
    console.log('-'.repeat(60));
    console.log(`⏱️  Tổng thời gian : ${totalElapsed}ms`);
    console.log(`🚄 Throughput     : ${rps} req/s`);
    console.log('-'.repeat(60));
    console.log(`📈 Response Time:`);
    console.log(`   Min           : ${results.minTime}ms`);
    console.log(`   Avg           : ${avgTime}ms`);
    console.log(`   Max           : ${results.maxTime}ms`);
    console.log(`   P50 (median)  : ${p50}ms`);
    console.log(`   P90           : ${p90}ms`);
    console.log(`   P99           : ${p99}ms`);
    console.log('='.repeat(60));

    // Đánh giá kết quả
    const successRate = (results.success / TOTAL_REQUESTS) * 100;
    console.log('\n🔍 ĐÁNH GIÁ:');
    if (successRate >= 99 && avgTime < 500) {
        console.log('🟢 EXCELLENT: Server chịu tải xuất sắc!');
    } else if (successRate >= 95 && avgTime < 1000) {
        console.log('🟡 GOOD: Server chịu được nhưng có độ trễ tăng.');
    } else if (successRate >= 80) {
        console.log('🟠 WARNING: Server đang bị quá tải. Cần tối ưu!');
    } else {
        console.log('🔴 CRITICAL: Server không chịu được tải này!');
        console.log('   → Cần tăng Connection Pool, thêm PM2 Cluster, hoặc scale out.');
    }

    if (results.errors.length > 0 && results.errors.length <= 20) {
        console.log('\n⚠️  Danh sách lỗi:');
        results.errors.forEach(e => console.log('  ', e));
    } else if (results.errors.length > 20) {
        console.log(`\n⚠️  ${results.errors.length} lỗi xảy ra (chỉ hiển thị 20 đầu):`);
        results.errors.slice(0, 20).forEach(e => console.log('  ', e));
    }

    console.log('\n' + '='.repeat(60));
}

runLoadTest();
