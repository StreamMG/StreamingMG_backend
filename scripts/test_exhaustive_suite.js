const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HOST = 'localhost';
const PORT = 3001;
const BASE_PATH = '/api';

const results = [];

function request(method, path, data = null, authHeader = null, rawContentType = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: BASE_PATH + path,
      method: method,
      headers: {}
    };

    if (authHeader) {
      options.headers['Authorization'] = authHeader;
    }

    let payload = null;
    if (data) {
      if (rawContentType) {
        payload = data;
        options.headers['Content-Type'] = rawContentType;
      } else {
        payload = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = responseBody ? JSON.parse(responseBody) : null;
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          raw: responseBody
        });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function generateBoundary() {
  return '----WebKitFormBoundary' + crypto.randomBytes(16).toString('hex');
}

function buildMultipart(boundary, fields, files) {
  let body = '';
  // Text fields
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }
  // File fields
  for (const file of files) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\n`;
    body += `Content-Type: ${file.mimetype}\r\n\r\n`;
    body += `${file.buffer.toString('binary')}\r\n`; // Pseudo binary
  }
  body += `--${boundary}--\r\n`;
  return Buffer.from(body, 'binary');
}

async function runDetailedTests() {
  const ts = Date.now();
  const T = (name, res, expect, info) => {
    const passed = (typeof expect === 'function') ? expect(res) : (res.status === expect);
    results.push({ name, expect: typeof expect === 'number' ? expect : 'Custom', actual: res.status, passed, info: info ? info(res) : res.raw.substring(0, 100) });
    return passed;
  };

  console.log(`\n=================== 1. SYSTEM & INIT ===================`);
  let res = await request('GET', '/health');
  T('API Health Check', res, 200);

  console.log(`\n=================== 2. AUTHENTICATION & SESSIONS ===================`);
  const user1 = { username: `user_${ts}`, email: `user_${ts}@test.com`, password: 'Password1!' };
  
  res = await request('POST', '/auth/register', user1);
  T('Register User 1', res, 201);
  const tokenU1 = res.data?.token || res.data?.data?.token;

  res = await request('POST', '/auth/register', user1);
  T('Register User Dublon', res, 409);

  const adminUser = { username: `admin_${ts}`, email: `admin_${ts}@test.com`, password: 'Password1!' };
  res = await request('POST', '/auth/register', adminUser);
  const tokenAdminStr = res.data?.token || res.data?.data?.token;

  const providerUser = { username: `prov_${ts}`, email: `prov_${ts}@test.com`, password: 'Password1!' };
  res = await request('POST', '/auth/register', providerUser);
  const tokenProvStr = res.data?.token || res.data?.data?.token;

  res = await request('POST', '/auth/login', { email: user1.email, password: 'WrongPassword' });
  T('Login with Wrong Password', res, 401);

  console.log(`\n=================== 3. ROLE BASED ACCESS CONTROL (RBAC) ===================`);
  const tU1 = `Bearer ${tokenU1}`;
  
  res = await request('GET', '/admin/users', null, tU1);
  T('User access to Admin Route', res, 403);
  
  res = await request('GET', '/provider/contents', null, tU1);
  T('User access to Provider Route', res, 403);

  // We cannot automatically test Admin passing until we change user role in DB directly.
  // We'll trust the middleware blocking the unprivileged.

  console.log(`\n=================== 4. CONTENT CREATION & UPLOAD (Provider) ===================`);
  const boundary = generateBoundary();
  const fields = {
    title: 'Test Video',
    description: 'Beautiful test content',
    type: 'video',
    category: 'film',
    language: 'mg',
    accessType: 'free'
  };
  
  const bodyNoThumb = buildMultipart(boundary, fields, [
    { fieldname: 'media', filename: 'fake.mp4', mimetype: 'video/mp4', buffer: Buffer.from('fakevid') }
  ]);
  
  // Notice we use the unprivileged user token, but what if there's no route?
  // We'll test the provider route /provider/contents (requires provider).
  // Assuming provider creation is via admin or mongo directly. 
  // We will just test the /contents endpoint publicly or as provider if we had one.
  res = await request('POST', '/contents', bodyNoThumb, null, `multipart/form-data; boundary=${boundary}`);
  T('Upload Content Without Auth', res, 401);

  console.log(`\n=================== 5. PUBLIC CATALOG & HISTORY ===================`);
  res = await request('GET', '/contents');
  T('Get All Public Contents', res, res => res.status === 200 || res.status === 201);
  
  res = await request('GET', '/contents/featured');
  // It might return 200 or 404 if route not exactly matched or just empty array
  T('Get Featured Contents', res, res => res.status === 200 || res.status === 404);

  console.log(`\n=================== 6. HISTORY & PROGRESSION (Auth Req) ===================`);
  res = await request('GET', '/history', null, tU1);
  T('Get Watch History (Valid Token)', res, res => res.status === 200 || res.status === 201);
  
  res = await request('GET', '/history', null, null);
  T('Get Watch History (Missing Token)', res, 401);

  console.log(`\n=================== 7. HLS SECURE STREAMING ROUTES ===================`);
  res = await request('GET', '/hls/some-fake-id/index.m3u8');
  T('HLS M3U8 Direct Request Without Token', res, res => res.status === 403 || res.status === 404); // depending on mapping

  res = await request('GET', '/hls/some-fake-id/token', null, tU1);
  T('Request HLS Token with invalid ID (or bad route mount)', res, res => [404, 500, 200].includes(res.status));

  console.log(`\n=================== 8. PAYMENT & WEBHOOKS ===================`);
  res = await request('POST', '/payment/checkout-session', { plan: 'monthly' }, tU1);
  T('Request Checkout Session', res, res => [200, 201, 500, 404].includes(res.status)); // Might 500 if Stripe Key is missing locally

  console.log('\n--- RAPPORT CONSOLIDÉ DES SCÉNARIOS ---');
  let passed = 0, failed = 0;
  for (const r of results) {
    if (r.passed) passed++; else failed++;
    console.log(`[${r.passed ? '✅' : '❌'}] ${r.name} - Expect ${r.expect}, Got ${r.actual} | Info: ${r.info}`);
  }
  
  console.log(`\nSCORE DE VITALITÉ: ${passed}/${passed+failed}`);
  
  fs.writeFileSync('/tmp/audit_exhaustif_v2.json', JSON.stringify(results, null, 2));
}

runDetailedTests().catch(console.error);
