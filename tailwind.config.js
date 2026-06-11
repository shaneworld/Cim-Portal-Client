/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: { fontFamily: { sans: ['Inter', 'MiSans', 'system-ui', '-apple-system', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'] }, colors: {
    background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
    border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
    primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
    muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
  } } },
  plugins: [],
}
