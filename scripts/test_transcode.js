const path = require('path');
const fs = require('fs');
const { transcodeToHls, getVideoDuration } = require('../src/services/ffmpegService');

async function run() {
  console.log('🧪 Testing transcode path fix...');
  
  // 1. Create a dummy mp4 file
  const testDir = path.join(__dirname, '../uploads/private');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  
  const dummyInput = path.join(testDir, 'test_dummy.mp4');
  
  // If we don't have a real mp4, ffmpeg will fail. 
  // Let's rely on the terminal to generate one before running this script, or we try with whatever is in there.
  
  // Actually, we'll just check if any mp4 exists in uploads/private
  const files = fs.readdirSync(testDir);
  const mp4Files = files.filter(f => f.endsWith('.mp4'));
  
  if (mp4Files.length === 0) {
    console.error('❌ No mp4 file found in uploads/private to test with.');
    console.log('Please put a dummy MP4 in uploads/private or upload one.');
    process.exit(1);
  }
  
  const inputPath = path.join(testDir, mp4Files[0]);
  const dummyContentId = '111122223333444455556666';
  
  console.log(`Using input file: ${inputPath}`);
  
  try {
    const duration = await getVideoDuration(inputPath);
    console.log(`Duration verified: ${duration}s`);
    
    console.log('Calling transcodeToHls...');
    const resultPath = await transcodeToHls(inputPath, dummyContentId);
    
    console.log(`✅ Success! Manifest path returned: ${resultPath}`);
    
    // Verify files were actually created in the right place
    const expectedManifest = path.join(__dirname, `../uploads/hls/${dummyContentId}/index.m3u8`);
    if (fs.existsSync(expectedManifest)) {
      console.log(`✅ Verified manifest exists on disk at ${expectedManifest}`);
    } else {
      console.error(`❌ Manifest not found on disk at ${expectedManifest}!`);
    }
    
  } catch (err) {
    console.error('❌ Transcode failed:', err);
    process.exit(1);
  }
  
  process.exit(0);
}

run();
