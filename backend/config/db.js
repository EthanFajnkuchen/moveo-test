const mongoose = require('mongoose');


const MONGO_URI = process.env.MONGO_URI + 'testMoveo';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));