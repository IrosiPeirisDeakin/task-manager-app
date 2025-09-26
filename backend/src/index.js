require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, User, Task } = require('./models');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { authenticate } = require('./middlewares/auth');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', (req, res) => res.json({ ready: true }));

app.use('/auth', authRoutes);
app.use('/tasks', authenticate, taskRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.sync({ alter: true });
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

if (require.main === module) {
  start();
}

module.exports = app;
