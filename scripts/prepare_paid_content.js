require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Content = require(path.join(__dirname, '../src/models/Content.model'));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const content = await Content.findOneAndUpdate(
    {}, 
    { accessType: 'paid', price: 3000 }, 
    { new: true }
  );
  if (content) {
    console.log(content._id.toString());
  } else {
    console.log("NONE");
  }
  process.exit(0);
});
