import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{ink:'var(--ink)',paper:'var(--paper)',surface:'var(--surface)',line:'var(--line)',muted:'var(--muted)',green:'var(--green)',red:'var(--red)',amber:'var(--amber)'}}},plugins:[]} satisfies Config;
