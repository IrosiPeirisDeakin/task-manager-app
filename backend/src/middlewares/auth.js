const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'missing authorization header' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { authenticate };
