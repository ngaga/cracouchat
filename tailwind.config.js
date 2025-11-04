/** @type {import('tailwindcss').Config} */
let colors = require("tailwindcss/colors"); // eslint-disable-line @typescript-eslint/no-var-requires

// Remove unused deprecated colors
delete colors.lightBlue;
delete colors.warmGray;
delete colors.trueGray;
delete colors.coolGray;
delete colors.blueGray;

// Custom color definitions
const customColors = {
  gray: {
    950: "#111418",
    900: "#1C222D",
    850: "#232A37",
    800: "#2A3241",
    700: "#364153",
    600: "#545D6C",
    500: "#7B818D",
    400: "#969CA5",
    300: "#B2B6BD",
    200: "#D3D5D9",
    150: "#DFE0E2",
    100: "#EEEEEF",
    50: "#F7F7F7",
  },
  blue: {
    950: "#041728",
    900: "#07355F",
    800: "#085092",
    700: "#0A6CC6",
    600: "#137FE3",
    500: "#1C91FF",
    400: "#4BABFF",
    300: "#7AC6FF",
    200: "#9FDBFF",
    100: "#CAEBFF",
    50: "#E9F7FF",
  },
  green: {
    950: "#04140A",
    900: "#0A361A",
    800: "#105B2B",
    700: "#277644",
    600: "#418B5C",
    500: "#6AA668",
    400: "#91C174",
    300: "#BCDE81",
    200: "#E2F78C",
    100: "#F0FBBD",
    50: "#FEFFF0",
  },
};

Object.assign(colors, {
  green: customColors.green,
  blue: customColors.blue,
  gray: customColors.gray,
});

module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    screens: {
      xxs: "384px",
      xs: "512px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    fontFamily: {
      sans: ["Geist", "sans-serif"],
      mono: ["Geist Mono", "monospace"],
    },
    fontSize: {
      xs: [
        "12px",
        {
          lineHeight: "16px",
          letterSpacing: "normal",
        },
      ],
      sm: [
        "14px",
        {
          lineHeight: "20px",
          letterSpacing: "-0.28px",
        },
      ],
      base: [
        "16px",
        {
          lineHeight: "24px",
          letterSpacing: "-0.32px",
        },
      ],
      lg: [
        "18px",
        {
          lineHeight: "26px",
          letterSpacing: "-0.36px",
        },
      ],
      xl: [
        "20px",
        {
          lineHeight: "28px",
          letterSpacing: "-0.4px",
        },
      ],
      "2xl": [
        "24px",
        {
          lineHeight: "30px",
          letterSpacing: "-0.96px",
        },
      ],
      "3xl": [
        "32px",
        {
          lineHeight: "36px",
          letterSpacing: "-1.28px",
        },
      ],
      "4xl": [
        "40px",
        {
          lineHeight: "42px",
          letterSpacing: "-2.4px",
        },
      ],
    },
    extend: {
      borderRadius: {
        "4xl": "2rem",
      },
      colors: {
        border: {
          DEFAULT: colors.gray[100],
          dark: colors.gray[100],
        },
        background: { DEFAULT: colors.white },
        foreground: {
          DEFAULT: colors.gray[950],
        },
        primary: {
          DEFAULT: colors.gray[800],
          light: colors.gray[600],
          dark: colors.gray[950],
        },
        highlight: {
          DEFAULT: colors.blue[500],
          light: colors.blue[400],
          dark: colors.blue[600],
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate"),
  ],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
};

