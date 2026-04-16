const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const FormData = require('form-data');

const BASE_URL = 'http://127.0.0.1:3001';
const API_URL = `${BASE_URL}/api`;
const EMAIL = `prov_test_down_${Date.now()}@test.mg`;
const PASSWORD = 'Password123!';
const USERNAME = `ProvTesterDown_${Date.now()}`;

// Dossier temporaire pour les dummies
const TMP_DIR = path.join(__dirname, '../TestContenuTmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const DUMMY_IMG = path.join(TMP_DIR, 'fake_thumb.jpg');
const DUMMY_VID = path.join(TMP_DIR, 'fake_video.mp4');
if (!fs.existsSync(DUMMY_IMG)) fs.writeFileSync(DUMMY_IMG, 'FAKE_IMAGE_DATA');
if (!fs.existsSync(DUMMY_VID)) fs.writeFileSync(DUMMY_VID, 'FAKE_VIDEO_DATA_MP4_FORMAT_11111111111');

let token = '';
let contentId = '';
let signedUrl = '';

async function runDownloadTests() {
  console.log('🔐 1. Setup Utilisateur et Contenu...');
  await axios.post(`${API_URL}/auth/register`, { username: USERNAME, email: EMAIL, password: PASSWORD });
  
  // Elevation admin pour bypass checkAccess (puisque "paid" est exigé si non proprietaire ou premium)
  try {
    execSync(`mongosh TestStreamMG --eval 'db.users.updateOne({email: "${EMAIL}"}, {$set: {role: "admin", isPremium: true}})'`);
    let rRes = await axios.post(`${API_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
    token = rRes.data.token;
  } catch(e) {
    console.log('Elevation failed', e);
  }

  // Upload un fichier dummy pour pouvoir le télécharger
  const form = new FormData();
  form.append('title', 'Test Download');
  form.append('description', 'Test Mobile Offline');
  form.append('category', 'film');
  form.append('language', 'mg');
  form.append('type', 'video');
  form.append('accessType', 'free'); // free content pour contourner RÈGLE-05
  form.append('isPublished', 'true');
  form.append('fileSize', '100');
  form.append('thumbnail', fs.createReadStream(DUMMY_IMG));
  form.append('media', fs.createReadStream(DUMMY_VID), {filename: 'v.mp4', contentType: 'video/mp4'});

  let resUpload = await axios.post(`${API_URL}/provider/contents`, form, {
    headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` }
  });
  contentId = resUpload.data.contentId;
  
  // Force published flag in db cause form-data bool sometimes fails
  try {
     execSync(`mongosh TestStreamMG --eval 'db.contents.updateOne({_id: ObjectId("${contentId}")}, {$set: {isPublished: true}})'`);
     
     // Hack: Simulate FFmpeg passing the file to private dir:
     const privateDir = path.resolve(__dirname, '../uploads/private');
     if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir, { recursive: true });
     fs.copyFileSync(DUMMY_VID, path.join(privateDir, `${contentId}_src.mp4`));
  } catch(e) {}

  console.log(`   └─ Contenu Fake créé : ${contentId}`);

  console.log('\n🧪 2. Test Routage Download Protect');
  
  try {
    const resAuthMissing = await axios.post(`${API_URL}/download/${contentId}`, {}, { validateStatus: () => true });
    console.log(`[${resAuthMissing.status === 401 ? '✅' : '❌'}] SCÉNARIO: Bloquage sans Auth (${resAuthMissing.status})`);
  } catch(e) {}

  let aesData;
  try {
    const resD = await axios.post(`${API_URL}/download/${contentId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }, validateStatus: () => true
    });
    console.log(`[${resD.status === 200 ? '✅' : '❌'}] SCÉNARIO: Obtenir URL signée (AES + HMAC) (${resD.status})`);
    if (resD.status === 200) {
      aesData = resD.data;
      signedUrl = resD.data.signedUrl;
      console.log(`   └─ Keys AES 256 reçues : [KeyHex: ${aesData.aesKeyHex.length} | IVHex: ${aesData.ivHex.length}]`);
      console.log(`   └─ Signed URL : ${signedUrl.substring(0, 40)}...`);
    } else {
      console.log('Détail erreur:', resD.data);
    }
  } catch(e) {}

  if (signedUrl) {
    console.log('\n🧪 3. Test de Téléchargement Physique avec URL Signée HMAC');
    
    // Test Sans Signature
    let rawTest = await axios.get(`${BASE_URL}/private/${contentId}`, { validateStatus: () => true });
    console.log(`[${rawTest.status === 403 ? '✅' : '❌'}] SCÉNARIO: Accès Direct /private bloqué sans signatures (${rawTest.status})`);

    let realUrl = signedUrl.startsWith('http') ? signedUrl : `${BASE_URL}${signedUrl}`;

    // Test Avec Signature Modifiée (Hack)
    let badUrl = realUrl.replace('sig=', 'sig=bad');
    let hackTest = await axios.get(badUrl, { validateStatus: () => true });
    console.log(`[${hackTest.status === 403 ? '✅' : '❌'}] SCÉNARIO: Rejet Signature Corrompue (${hackTest.status})`);

    // Test Normal (Code 200)
    let goodTest = await axios.get(realUrl, { validateStatus: () => true });
    console.log(`[${goodTest.status === 200 || goodTest.status === 206 ? '✅' : '❌'}] SCÉNARIO: Téléchargement Express.static valide (${goodTest.status})`);
    
    // Test Range (Pour pause/reprise mobile)
    let rangeTest = await axios.get(realUrl, { 
      headers: { 'Range': 'bytes=0-5' }, validateStatus: () => true 
    });
    console.log(`[${rangeTest.status === 206 ? '✅' : '❌'}] SCÉNARIO: Support Reprise (Range Bytes = 206 Partial Content) (${rangeTest.status})`);
  }

  // Clenaup
  console.log('\n🧹 4. Nettoyage...');
  try {
    fs.unlinkSync(DUMMY_IMG); fs.unlinkSync(DUMMY_VID); fs.rmdirSync(TMP_DIR);
    console.log('✅ Cycle E2E Terminé.');
  } catch(e) {}
}

runDownloadTests().catch(console.error);
