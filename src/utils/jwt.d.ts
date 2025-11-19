export interface TokenPayload {
    employeeNumber: string;
    username: string;
    empClass: string;
    iat?: number;
    exp?: number;
}
export declare const generateToken: (payload: Omit<TokenPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export declare const decodeToken: (token: string) => TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map