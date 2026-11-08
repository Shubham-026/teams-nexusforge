import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          lavender: {
            50: "#FAF9FE",
            100: "#F2EFFD",
            200: "#E5DEFC",
            300: "#CEBEF8",
            400: "#A892F0",
            500: "#866CE6",
          },
          mint: {
            50: "#F3FAF6",
            100: "#E5F6EE",
            200: "#C7ECDA",
            300: "#98DAC0",
            400: "#5CBFA0",
            500: "#369E7F",
          },
          peach: {
            50: "#FDF8F5",
            100: "#FBF0E9",
            200: "#F6DDD1",
            300: "#EFC1AD",
            400: "#E29A7F",
            500: "#CE7454",
          },
          sky: {
            50: "#F4F8FD",
            100: "#E6F0FA",
            200: "#CFE3F7",
            300: "#A5CBF0",
            400: "#6FA9E4",
            500: "#4489D0",
          },
        },
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
        'soft-md': '0 4px 16px -4px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;

