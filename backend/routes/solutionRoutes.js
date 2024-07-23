const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const Solution = db.model('Solution', new mongoose.Schema({
    codeBlockId: mongoose.Schema.Types.ObjectId,
    solution: String
  }));

  router.get('/:codeBlockId', async (req, res) => {
    try {
      const solution = await Solution.findOne({ codeBlockId: req.params.codeBlockId });
      if (!solution) return res.status(404).json({ message: 'Solution not found' });
      res.json(solution);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
