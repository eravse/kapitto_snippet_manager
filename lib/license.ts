
import fs from 'fs';
import path from 'path';

export async function checkProLicense(): Promise<boolean> {
    try {
        const proFolderPath = path.join(process.cwd(), 'pro', 'LICENSE.check');
        const rootLicensePath = path.join(process.cwd(), 'LICENSE.check');
        const rootLicencePath = path.join(process.cwd(), 'licence.check'); // Support user's specific casing

        return fs.existsSync(proFolderPath) || fs.existsSync(rootLicensePath) || fs.existsSync(rootLicencePath);
    } catch (error) {
        console.warn('License check failed:', error);
        return false;
    }
}
