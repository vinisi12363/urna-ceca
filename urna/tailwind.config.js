/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',  // tablet pequeno em landscape
        'md': '768px',  // tablet médio
        'lg': '1024px',
        'xl': '1280px',
      },
      height: {
        'screen-dvh': '100dvh',
      },
      minHeight: {
        'screen-dvh': '100dvh',
      },
      maxHeight: {
        'screen-dvh': '100dvh',
      },
      width: {
        'screen-dvw': '100dvw',
      },
      minWidth: {
        'screen-dvw': '100dvw',
      },
      maxWidth: {
        'screen-dvw': '100dvw',
      },
    },
  },
  plugins: [],
}
