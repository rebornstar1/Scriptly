export const authConfig = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    
    passwordMinLength: 6,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    
    usernameMinLength: 3,
    usernameMaxLength: 20,
    usernamePattern: /^[a-zA-Z0-9_]+$/,
    
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000,
    
    sessionTimeout: 24 * 60 * 60 * 1000,
    
    defaultUserRole: 'user',
    defaultDocumentPermission: 'write'
};

export const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction && authConfig.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT secret! Please set JWT_SECRET environment variable in production.');
}