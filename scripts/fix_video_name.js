require('dotenv').config();
const fs = require('fs');
const connectDB = require('../src/config/database');
const Content = require('../src/models/Content.model');

async function fix() {
  await connectDB();
  const video = await Content.findOne({ title: 'Vidéo de Test' });
  if (video) {
    const newName = `uploads/private/${video._id}_src.mp4`;
    if (fs.existsSync('uploads/private/test-video.mp4')) {
      fs.renameSync('uploads/private/test-video.mp4', newName);
      console.log('Renamed test-video.mp4 to ' + newName);
    } else {
      console.log('test-video.mp4 already renamed: ' + newName);
    }
  }
  process.exit(0);
}
fix();
