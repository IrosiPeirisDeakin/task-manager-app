const request = require('supertest');
const app = require('../src/index');
const { sequelize, User } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth routes', () => {
  test('register and login', async () => {
    const reg = await request(app).post('/auth/register').send({ username: 'alice', password: 'pass' });
    expect(reg.statusCode).toBe(200);
    const login = await request(app).post('/auth/login').send({ username: 'alice', password: 'pass' });
    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeDefined();
  });
});
