/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
     "./node_modules/flowbite/**/*.js"
  ],
  theme: {
		extend: {
			colors: {
				// UIAP Theme single color
				primary: {
					50: '#00888A',
					100: '#F4FAF9',
					200: '#00888A',
					300: '#00888A',
					400: '#ebf9fa',
					500: '#f4f6f5',
					600: '#00888A',
					700: '#00888A',
					800: '#00888A',
					900: '#00888A'
				}
      }
    }
  },
  plugins: [
    require('flowbite/plugin')
  ],
}