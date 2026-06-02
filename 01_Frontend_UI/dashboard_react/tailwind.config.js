/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ── Primary Green palette ──────────────────────────────────
                green: {
                    50:  '#f0fdf6',
                    100: '#dcfce9',
                    200: '#a0e8af',
                    300: '#67e499',
                    400: '#3dd678',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                // ── Primary Purple palette ─────────────────────────────────
                purple: {
                    50:  '#faf5ff',
                    100: '#eae8ff',
                    200: '#caa8f5',
                    300: '#b084f0',
                    400: '#9d60f6',
                    500: '#8f63f4',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },
                // ── Surface tokens ─────────────────────────────────────────
                surface: {
                    base:    '#0d0f1a',
                    raised:  '#131625',
                    overlay: '#1a1d30',
                    border:  'rgba(103,228,153,0.12)',
                },
            },
            fontFamily: {
                sans:    ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                'spin-slow':   'spin 8s linear infinite',
                'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
                'float':       'float 6s ease-in-out infinite',
                'glow-pulse':  'glowPulse 3s ease-in-out infinite',
                'slide-up':    'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
                'slide-in':    'slideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
                'fade-in':     'fadeIn 0.4s ease-out',
                'shimmer':     'shimmer 2s infinite',
                'neural':      'neuralFlow 4s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%,100%': { transform: 'translateY(0px)' },
                    '50%':     { transform: 'translateY(-12px)' },
                },
                glowPulse: {
                    '0%,100%': { boxShadow: '0 0 20px rgba(103,228,153,0.2)' },
                    '50%':     { boxShadow: '0 0 40px rgba(103,228,153,0.5)' },
                },
                slideUp: {
                    '0%':   { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%':   { opacity: '0', transform: 'translateX(-24px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-400% 0' },
                    '100%': { backgroundPosition: '400% 0' },
                },
                neuralFlow: {
                    '0%,100%': { strokeDashoffset: '0' },
                    '50%':     { strokeDashoffset: '100' },
                },
            },
            backdropBlur: { xs: '2px' },
            boxShadow: {
                'glass':        '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                'glow-green':   '0 0 30px rgba(103,228,153,0.25)',
                'glow-purple':  '0 0 30px rgba(143,99,244,0.25)',
                'panel':        '0 4px 24px rgba(0,0,0,0.5)',
                'card-hover':   '0 8px 40px rgba(103,228,153,0.15)',
            },
        },
    },
    plugins: [],
}
