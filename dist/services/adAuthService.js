// src/services/adAuthService.ts
import { Client } from "ldapts";
import * as net from "net";
import * as fs from 'fs';
import * as path from 'path';
export class ADAuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    serverConnect(server, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1000);
            socket.on("connect", () => {
                console.log(`✅ Successfully connected to server ${server}:${port}`);
                socket.destroy();
                resolve(true);
            });
            socket.on("timeout", () => {
                console.log(`⏱️ Connection to server ${server}:${port} timed out`);
                socket.destroy();
                resolve(false);
            });
            socket.on("error", (err) => {
                console.log(`❌ Error connecting to server ${server}:${port} - ${err.message}`);
                socket.destroy();
                resolve(false);
            });
            socket.connect(port, server);
        });
    }
    async authenticateUser(credentials) {
        let authenticated = false;
        let serverAvailable = false;
        let serverUrl = "";
        if (await this.serverConnect(this.config.server, this.config.port)) {
            serverUrl = this.config.server;
            serverAvailable = true;
        }
        else {
            console.log(`⚠️ Server ${this.config.server}:${this.config.port} is not reachable`);
        }
        if (serverAvailable) {
            // --- FINAL IMPLEMENTATION START ---
            // 1. Define paths to your Intermediate and Root CA certificate files.
            const pathToIntermediateCert = path.join(process.cwd(), 'certs', 'intermediate-ca.pem');
            const pathToRootCert = path.join(process.cwd(), 'certs', 'root-ca.pem');
            // 2. Verify that both required certificate files exist.
            if (!fs.existsSync(pathToIntermediateCert) || !fs.existsSync(pathToRootCert)) {
                console.error(`❌ FATAL: Full certificate chain not found. Please ensure 'intermediate-ca.pem' and 'root-ca.pem' exist in the 'certs' directory.`);
                return { success: false, valid: false };
            }
            // 3. Read both the intermediate and root certificate files into buffers.
            const intermediateCa = fs.readFileSync(pathToIntermediateCert);
            const rootCa = fs.readFileSync(pathToRootCert);
            console.log('✅ Successfully loaded intermediate and root CA certificates.');
            // --- FINAL IMPLEMENTATION END ---
            const client = new Client({
                url: `ldaps://${serverUrl}:${this.config.port}`,
                timeout: 5000,
                connectTimeout: 5000,
                tlsOptions: {
                    // 4. Provide an array containing BOTH the intermediate and root CAs.
                    // This allows Node.js to build the complete chain of trust:
                    // Server's Leaf Cert -> Intermediate CA -> Root CA
                    ca: [intermediateCa, rootCa],
                    // This function logs the server's certificate details and bypasses hostname mismatch errors.
                    // It's useful for debugging but for production, you might want to implement proper hostname validation.
                    checkServerIdentity: (host, cert) => {
                        console.log('Server certificate subject:', cert.subject);
                        return undefined;
                    },
                },
            });
            try {
                const userPrincipalName = `${credentials.username}@${this.config.domain}`;
                await client.bind(userPrincipalName, credentials.password);
                authenticated = true;
                console.log(`✅ User ${credentials.username} authenticated successfully`);
                await client.unbind();
            }
            catch (error) {
                authenticated = false;
                console.error(`❌ Authentication failed for user ${credentials.username}. Reason:`, error);
                try {
                    // Attempt to clean up the connection even if bind fails
                    await client.unbind();
                }
                catch (e) {
                    // Ignore any errors during this secondary unbind attempt
                }
            }
        }
        return {
            success: true,
            valid: authenticated,
        };
    }
}
// Singleton instance
let adAuthInstance = null;
export const getADAuthService = () => {
    if (!adAuthInstance) {
        const config = {
            server: process.env.AD_SERVER,
            port: parseInt(process.env.AD_PORT),
            domain: process.env.AD_DOMAIN,
        };
        if (!config.server || !config.port || !config.domain) {
            throw new Error("Missing required AD environment variables (AD_SERVER, AD_PORT, AD_DOMAIN)");
        }
        adAuthInstance = new ADAuthService(config);
    }
    return adAuthInstance;
};
//# sourceMappingURL=adAuthService.js.map