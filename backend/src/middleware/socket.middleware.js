import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Use the same JWT_SECRET handling as auth.middleware.js
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            console.log('No token provided in socket connection');
            return next(new Error('Authentication token required'));
        }

        console.log('Socket auth - JWT_SECRET available:', !!JWT_SECRET);
        console.log('Socket auth - Token received:', token.substring(0, 20) + '...');

        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find the user in the database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.log('User not found for token:', decoded.userId);
            return next(new Error('User not found'));
        }

        if (!user.isActive) {
            console.log('User is not active:', user.username);
            return next(new Error('User account is not active'));
        }

        // Attach user to socket
        socket.user = user;
        console.log(`Socket authenticated for user: ${user.username} (${user._id})`);
        next();
        
    } catch (error) {
        console.error('Socket authentication error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Token expired'));
        }
        return next(new Error('Authentication failed'));
    }
};