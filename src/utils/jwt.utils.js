const jwt = require('jsonwebtoken');

exports.generateJWT = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

exports.verifyJWT = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
