import { nextui } from '@nextui-org/theme'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    colors: {
      'bg': '#F3F6FE',
      'white': '#FFFFFF',
      'white-1': '#F5F5F5',
      'black': '#1E1E1E',
      'black-1': '#2F3639',
      'purple': '#5C07ED',
      'transparent': 'transparent',
    },
    // extend: {
    //   colors: {
    //     'bg': '#F3F6FE',
    //     'white': '#FFFFFF',
    //     // 'white-1': '#F5F5F5',
    //     'black': '#1E1E1E',
    //     'black-1': '#2F3639',
    //     'purple': '#5C07ED'
    //   },
    // },
  },
  darkMode: "class",
  plugins: [nextui()],
}
