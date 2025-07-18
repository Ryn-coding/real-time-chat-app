const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    return mongoose.connection.db.dropCollection('messages');
  })
  .then(() => {
    console.log('Messages collection dropped');
    mongoose.disconnect();
  })
  .catch((err) => {
    if (err.code === 26) {
      console.log('Collection does not exist');
    } else {
      console.error('Error:', err);
    }
    mongoose.disconnect();
  });
