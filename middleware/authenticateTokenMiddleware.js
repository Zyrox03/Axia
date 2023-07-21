const admin = require('firebase-admin');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization ;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - Invalid or missing token.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Missing token after "Bearer".' });
    }
 
    const decodedToken = await admin.auth().verifyIdToken(token); // Verify the token using Firebase Admin SDK

    req.user = decodedToken; // Add the decoded token to the request object
    next();
  } catch (error) {
    console.log(error)
    return res.status(403).json({ message: 'Unauthorized.', error : error.message });
  }
};

module.exports = authenticateToken;
