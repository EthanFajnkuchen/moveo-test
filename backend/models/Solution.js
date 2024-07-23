const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SolutionSchema = new Schema({
  codeBlockId: {
    type: Schema.Types.ObjectId,
    ref: 'CodeBlock',
    required: true
  },
  solution: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Solution', SolutionSchema);
