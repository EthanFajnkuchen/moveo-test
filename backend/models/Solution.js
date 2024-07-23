const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  codeBlockId: mongoose.Schema.Types.ObjectId,
  solution: String,
});

module.exports = mongoose.model('Solution', solutionSchema);
