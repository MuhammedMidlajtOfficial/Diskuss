const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports.isUser = (req, res, next) => {
  if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
  } else {
      next();
  }
};

module.exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    req.user = user;
    next();
  });
};
