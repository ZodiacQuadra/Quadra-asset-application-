const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:5100${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ path, status: res.statusCode, ok: res.statusCode === 200 && json.success !== false, data: json });
        } catch (e) {
          resolve({ path, status: res.statusCode, ok: false, error: 'JSON parse error: ' + e.message, raw: data.substring(0, 100) });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ path, status: 0, ok: false, error: err.message });
    });
    req.setTimeout(4000, () => {
      req.abort();
      resolve({ path, status: 408, ok: false, error: 'Timeout' });
    });
  });
}

const endpoints = [
  // Health
  '/health',
  // Asset Management
  '/asset/categories',
  '/asset/subcategories',
  '/asset/vendors',
  '/asset/all',
  '/asset/recent-activities',
  '/asset/employees',
  '/asset/employees/1',
  '/asset/requests',
  '/asset/requests?requester_id=1',
  '/asset/requests?status=Pending',
  '/asset/non-it',
  '/asset/reports/by-department',
  '/asset/reports/insights',
  '/asset/reports/stock-status',
  '/asset/reports/cost-metrics',
  '/asset/reports/assignments',
  '/asset/reports/replacement-forecast',
  '/asset/reports/service-history',
  '/asset/reports/aging',
  '/asset/configurations',
  '/asset/sla',
  '/asset/notifications',
  '/asset/metrics',
  // HR Endpoints
  '/asset/hr-requests',
  '/asset/hr-requests/1',
  '/asset/hr/metrics',
  '/asset/hr/category-summary',
  '/asset/hr/eligible-applicants',
  '/asset/category-components/1',
  '/asset/organization/metrics',
];

async function run() {
  console.log('--- STARTING COMPREHENSIVE BACKEND HEALTH AUDIT ---');
  let pass = 0, fail = 0;
  for (const ep of endpoints) {
    const res = await get(ep);
    if (res.ok) {
      pass++;
      const count = Array.isArray(res.data?.data) ? `${res.data.data.length} records` : (typeof res.data?.data === 'object' && res.data?.data !== null ? 'object' : 'ok');
      console.log(`[PASS] ${res.status} ${res.path} -> ${count}`);
    } else {
      fail++;
      console.error(`[FAIL] ${res.status} ${res.path} -> ${res.error || JSON.stringify(res.data)}`);
    }
  }
  console.log(`\nAUDIT RESULT: ${pass} PASSED, ${fail} FAILED out of ${endpoints.length} endpoints.`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
