const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.POSTGRES_URL || 'postgres://postgres:postgres@db:5432/tasks', {
  logging: false,
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING
});

const Task = sequelize.define('Task', {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  completed: { type: DataTypes.BOOLEAN, defaultValue: false }
});

User.hasMany(Task);
Task.belongsTo(User);

module.exports = { sequelize, User, Task };
