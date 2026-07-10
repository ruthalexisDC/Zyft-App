// // import jwt from 'jsonwebtoken';



// // // Unified: accepts Passport session OR JWT Bearer
// // export const authenticate = (req, res, next) => {
// //   // 1. Check Passport session first (browser Google OAuth)
// //   if (req.isAuthenticated && req.isAuthenticated()) {
// //     return next(); // req.user already set by Passport
// //   }

// //   // 2. Fallback to JWT Bearer (Postman, mobile, SPA)
// //   const authHeader = req.headers.authorization;
  
// //   if (authHeader?.startsWith('Bearer ')) {
// //     const token = authHeader.split(' ')[1];
    
// //     try {
// //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //       console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
// // console.log('Token received:', token);
// //       console.log('Decoded token:', decoded);
// //       // ✅ Normalize to always expose _id regardless of token shape
// //       req.user = { ...decoded, _id: decoded._id || decoded.userId };
// //       return next();
// //     } catch (error) {
// //       return res.status(401).json({ message: 'Invalid token' });
// //     }
// //   }

// //   // 3. Neither auth method found
// //   return res.status(401).json({ message: 'Unauthorized — please log in' });
// // };

// // // Keep for specific use cases
// // export const isAuthenticated = (req, res, next) => {
// //   if (req.isAuthenticated && req.isAuthenticated()) return next();
// //   res.status(401).json({ message: 'Unauthorized — session required' });
// // };

// // export const verifyToken = (req, res, next) => {
// //   const authHeader = req.headers.authorization;
  
// //   if (!authHeader?.startsWith('Bearer ')) {
// //     return res.status(401).json({ message: 'No token provided' });
// //   }

// //   const token = authHeader.split(' ')[1];
  
// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     // ✅ Same normalization here
// //     req.user = { ...decoded, _id: decoded._id || decoded.userId };
// //     next();
// //   } catch (error) {
// //     res.status(401).json({ message: 'Invalid token' });
// //   }
// // };

// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const auth = async (req, res, next) => {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   const token = header.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // Fix: use decoded.userId instead of decoded.id
//     req.user = await User.findById(decoded.userId).select("-password");
//     if (!req.user) return res.status(401).json({ message: "User not found" });
//     next();
//   } catch {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// export default auth;

// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default auth;