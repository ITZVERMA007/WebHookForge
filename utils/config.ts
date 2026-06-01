import fs from 'fs';
import path from 'path';
import os from 'os';

// This creates a json file in the user's home directory to store the json
const CONFIG_FILE = path.join(os.homedir(), 'webhookforge.json');

export function saveToken(token: string) {
    const config = { ngrokToken: token };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getToken(): string | null {
    if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(fileContent);
        return config.ngrokToken || null;
    }
    return null;
}