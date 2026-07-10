import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== ENV LOADED ===');
console.log('JWT_SECRET exists?', !!process.env.JWT_SECRET);
console.log('==================');