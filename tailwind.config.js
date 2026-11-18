import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Palet Warna Kustom
                // Primary/Hero: Emerald Blue #0F5A5E
                // Dark Accent / Text / Footer: Deep Teal #083336
                // Secondary / Interactive: Soft Mint / Aqua #4DB6AC (#7ED957)
                // Warm Cream / Ivory Background: #F9F8F3
                // Crisp White Card / Container: #FFFFFF
                brand: {
                    primary: '#0F5A5E',
                    dark: '#083336',
                    secondary: '#4DB6AC',
                    mint: '#7ED957',
                    cream: '#F9F8F3',
                    card: '#FFFFFF',
                },
                // Memetakan indigo ke nuansa Emerald Blue & Teal agar seluruh komponen otomatis sinkron
                indigo: {
                    50: '#F0F7F7',
                    100: '#D9ECEC',
                    200: '#B6DCDC',
                    300: '#89C5C6',
                    400: '#4DB6AC', // Soft Mint / Aqua secondary accent
                    500: '#237B80',
                    600: '#0F5A5E', // Primary / Hero Emerald Blue
                    700: '#0A4447',
                    800: '#083336', // Deep Teal Dark Accent
                    900: '#052224',
                    950: '#031415',
                },
            },
        },
    },

    plugins: [],
};
