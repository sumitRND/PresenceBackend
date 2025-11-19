import fs from 'fs';
import path from 'path';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
export const createUserFolder = (username) => {
    const userDir = path.join(UPLOAD_DIR, username);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`Created user folder: ${userDir}`);
    }
};
export const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
//# sourceMappingURL=folderUtils.js.map