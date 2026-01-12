/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Color Theme
        'corporate-blue': '#144A92',    // Primary - Buttons, Navbar, Links
        'soft-blue': '#3F6FB5',         // Secondary - Hover, Cards, Highlights
        'pure-black': '#000000',        // Text - All main text
        'light-bg': '#F4F6F8',          // Background - Pages, Tables

        // Maintain backward compatibility
        primary: {
          DEFAULT: '#144A92',
          hover: '#0F3A7A',
          light: '#3F6FB5',
        },
        secondary: {
          DEFAULT: '#3F6FB5',
          hover: '#2E5A9E',
        },
      },
      boxShadow: {
        // Custom shadow for modals
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
