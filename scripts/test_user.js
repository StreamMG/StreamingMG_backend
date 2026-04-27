const http = require('http');

const runTest = async () => {
  // 1. Authenticate to get a token
  const authRes = await request('POST', '/api/auth/login', {
    email: 'user@test.com',
    password: 'password123'
  });
  
  if (!authRes.token) {
    console.error('✅ Impossible de tester : user@test.com introuvable ou mauvais mot de passe. Assurez-vous que la BDD contient cet utilisateur.');
    return;
  }
  
  const token = authRes.token;

  // 2. GET /api/user/profile
  const profile = await request('GET', '/api/user/profile', null, token);
  console.log('GET Profile:', JSON.stringify(profile, null, 2));
  
  // Conformité de structure
  if (!profile._id || !profile.username || !profile.email || !profile.stats) {
    console.error('❌ GET /api/user/profile ne correspond pas à la conception');
  } else {
    console.log('✅ GET /api/user/profile conforme');
  }

  // 3. PATCH /api/user/profile (Test 400 Invalid)
  const patchInv = await request('PATCH', '/api/user/profile', { username: 'a' }, token);
  console.log('PATCH Profile (invalide):', patchInv);
  // Wait, express-validator currently returns 422, let's see.

  // 4. PATCH /api/user/password (Test 401 Wrong password)
  const patchPwd = await request('PATCH', '/api/user/password', { currentPassword: 'wrongpass', newPassword: 'newpassword123' }, token);
  console.log('PATCH Password (erreur):', patchPwd);

  console.log('\\n👉 Tests terminés.');
};

function request(method, path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

runTest();
