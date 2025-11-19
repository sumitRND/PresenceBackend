import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '30d';
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY
    });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
};
export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    }
    catch {
        return null;
    }
};
//# sourceMappingURL=jwt.js.map