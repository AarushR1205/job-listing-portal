import admin from '../config/firebase.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token with Firebase Admin
      const decoded = await admin.auth().verifyIdToken(token);

      // Get user from MongoDB using firebaseUid or email
      req.user = await User.findOne({ 
        $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }]
      });

      if (!req.user) {
        return res.status(401).json({ message: 'User profile not found in database.' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
