const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeBlockSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('CodeBlock', CodeBlockSchema);
