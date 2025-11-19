interface ADAuthConfig {
    server: string;
    port: number;
    domain: string;
}
interface ADAuthResponse {
    success: boolean;
    valid: boolean;
}
interface ADAuthRequest {
    username: string;
    password: string;
}
export declare class ADAuthService {
    private config;
    constructor(config: ADAuthConfig);
    private serverConnect;
    authenticateUser(credentials: ADAuthRequest): Promise<ADAuthResponse>;
}
export declare const getADAuthService: () => ADAuthService;
export {};
//# sourceMappingURL=adAuthService.d.ts.map