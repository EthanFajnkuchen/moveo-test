const mongoose = require('mongoose');


const MONGO_URI = 'mongodb://127.0.0.1:27017/testMoveo'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));