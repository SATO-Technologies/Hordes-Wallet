/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      black: '#303030',
      white: '#ffffff',
      green: '#2adca8',
      red: '#fc1953',
      orange: '#fea048',
      'light-gray': '#eaeaea',
      'gray': '#bebebe',
      'dark-gray': '#777777'
    },
    fontFamily: {
      gilroy: ['Gilroy-Light'],
      'gilroy-bold': ['Gilroy-Bold'],
    },
    extend: {

    },
  },
  plugins: [],
}
