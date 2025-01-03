const jwt = require('jsonwebtoken');

module.exports.validateJwtToken = (requiredUserType) => {
  return async (req, res, next) => {
    try {
      // Retrieve the token from the Authorization header (Bearer <token>)
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      // Check if the user type matches the required type for the route
      if (requiredUserType && decoded.userType !== requiredUserType) {
        return res.status(403).json({ message: 'Forbidden: Insufficient role' });
      }
      
      // Store the user details in the request object for use in the route
      req.user = decoded;
      console.log('Decoded user:', req.user);

      next();  // Allow the request to proceed to the route handler

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      console.error('Error during token validation:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};
