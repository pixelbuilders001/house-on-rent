import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#18332d', forest: '#176b58', mint: '#e8f4ee', cream: '#faf9f5', muted: '#78857f' }, boxShadow: { soft: '0 8px 28px rgba(24,51,45,.07)' } } }, plugins: [] };
export default config;
