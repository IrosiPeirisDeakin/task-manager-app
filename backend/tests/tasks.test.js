const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/models');

let token;
beforeAll(async () => {
  await sequelize.sync({ force: true });
  await request(app).post('/auth/register').send({ username: 'test', password: 'test' });
  const r = await request(app).post('/auth/login').send({ username: 'test', password: 'test' });
  token = r.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Tasks API', () => {
  test('create and read tasks', async () => {
    const create = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ title: 't1', description: 'd1' });
    expect(create.statusCode).toBe(201);
    const list = await request(app).get('/tasks').set('Authorization', `Bearer ${token}`);
    expect(list.statusCode).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });
});
