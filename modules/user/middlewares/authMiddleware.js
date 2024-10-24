const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization; 
  console.log('Auth Header:', authHeader); // Log the authorization header

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Extract token from header
    console.log('Extracted Token:', token); // Log the extracted token

    try {
      console.log('hii 123');
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded Token:', decoded); // Log the decoded token
      req.customerId = decoded.customerId; // Attach customerId to request
    } catch (err) {
      console.error('Token verification error:', err.message); // Log the error message
      return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }
  } else {
    console.log('Unauthorized. Token missing.');
    return res.status(401).json({ error: 'Unauthorized. Token missing.' }); // Token is missing
  }

  next(); // Proceed to the next middleware or route handler
};

module.exports = authenticateJWT;
