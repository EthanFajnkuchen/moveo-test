const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const CodeBlock = db.model('CodeBlock', new mongoose.Schema({
    title: String,
    code: String
  }));

  router.get('/', async (req, res) => {
    try {
      const codeblocks = await CodeBlock.find();
      res.json(codeblocks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const codeblock = await CodeBlock.findById(req.params.id);
      if (!codeblock) return res.status(404).json({ message: 'Code block not found' });
      res.json(codeblock);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
