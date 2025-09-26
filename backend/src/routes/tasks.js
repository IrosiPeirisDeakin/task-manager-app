const express = require('express');
const { Task } = require('../models');

const router = express.Router();

// Create task
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  const task = await Task.create({ title, description, UserId: req.user.id });
  res.status(201).json(task);
});

// Read all tasks for user
router.get('/', async (req, res) => {
  const tasks = await Task.findAll({ where: { UserId: req.user.id }});
  res.json(tasks);
});

// Read single
router.get('/:id', async (req, res) => {
  const t = await Task.findOne({ where: { id: req.params.id, UserId: req.user.id }});
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

// Update
router.put('/:id', async (req, res) => {
  const t = await Task.findOne({ where: { id: req.params.id, UserId: req.user.id }});
  if (!t) return res.status(404).json({ error: 'not found' });
  const { title, description, completed } = req.body;
  await t.update({ title, description, completed });
  res.json(t);
});

// Delete
router.delete('/:id', async (req, res) => {
  const t = await Task.findOne({ where: { id: req.params.id, UserId: req.user.id }});
  if (!t) return res.status(404).json({ error: 'not found' });
  await t.destroy();
  res.status(204).end();
});

module.exports = router;
