/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ── Clinical Warm Palette (Deck Theme) ──────────────────────
                cream: {
                    50:  '#FAF6F3',
                    100: '#F7F1EC',
                    200: '#F0E8E1',
                    300: '#E8DDD4',
                    400: '#D8C9BC',
                },
                maroon: {
                    50:  '#FDF2F4',
                    100: '#F8EAED',
                    200: '#ECC8CF',
                    300: '#D998A4',
                    400: '#B84E60',
                    500: '#8C2433',
                    600: '#7A1F2B', // Main clinical brand maroon
                    700: '#5E1620',
                    800: '#461017',
                    900: '#2E090E',
                },
                slate: {
                    50:  '#F4F7FA',
                    100: '#E8EFF5',
                    200: '#CFDEEB',
                    300: '#A3BFD6',
                    400: '#799EBE',
                    500: '#5B7C99', // Muted secondary slate blue
                    600: '#48647D',
                    700: '#354B5E',
                    800: '#263745',
                    900: '#18232C',
                },
                charcoal: {
                    50:  '#F7F6F5',
                    100: '#EFECE9',
                    200: '#D5D0CB',
                    300: '#ABA49E',
                    400: '#7A756F', // Secondary muted text
                    500: '#5A5550',
                    600: '#443F3B',
                    700: '#332F2C',
                    800: '#282523',
                    900: '#22201F', // Near-black charcoal primary text
                },
                // ── Clinical Status Desaturated Colors ─────────────────────
                sage: {
                    50:  '#F2F7F4',
                    100: '#EDF5F0',
                    200: '#CFE3D5',
                    500: '#4A7C59', // CN status green
                    700: '#2E523A',
                    800: '#1C3624',
                },
                amber: {
                    50:  '#FDF8F0',
                    100: '#FAF3E8',
                    200: '#F0DEC2',
                    500: '#B87326', // MCI status amber
                    700: '#8A5A14',
                    800: '#5E3D0A',
                },
                surface: {
                    card: '#FFFFFF',
                    border: '#E8E2DA',
                    borderLight: '#F0EBE5',
                    hairline: 'rgba(34, 32, 31, 0.08)',
                },
            },
            fontFamily: {
                sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                serif:   ['Fraunces', 'Newsreader', 'Georgia', 'serif'],
                display: ['Fraunces', 'Georgia', 'serif'],
            },
            boxShadow: {
                'clinical-sm': '0 1px 3px rgba(34, 32, 31, 0.04), 0 1px 2px rgba(34, 32, 31, 0.02)',
                'clinical':    '0 2px 8px rgba(34, 32, 31, 0.04), 0 1px 2px rgba(34, 32, 31, 0.02)',
                'clinical-md': '0 4px 16px rgba(34, 32, 31, 0.06), 0 2px 4px rgba(34, 32, 31, 0.03)',
                'clinical-lg': '0 10px 30px rgba(34, 32, 31, 0.08), 0 4px 8px rgba(34, 32, 31, 0.04)',
                'clinical-hover': '0 6px 20px rgba(34, 32, 31, 0.08)',
            },
            borderRadius: {
                'clinical': '14px',
            },
            animation: {
                'fade-in': 'fadeIn 0.25s ease-out',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                subtlePulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.85' },
                },
            },
        },
    },
    plugins: [],
}
