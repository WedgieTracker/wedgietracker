import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
      },
      fontSize: {
        "big-number": "clamp(8rem, 8rem + 10vw, 20rem)",
        "big-number-mobile": "clamp(7rem, 6rem + 16vw, 18rem)",
        "big-number-medium": "clamp(4rem, 1rem + 16vw, 12rem)",
        "button-text": "clamp(1rem, 0.8rem + 0.5vw, 2rem)",
        "wedgies-text": "clamp(1.5rem, 1rem + 2vw, 5rem)",
        "wedgies-text-mobile": "clamp(1.5rem, 0.5rem + 7vw, 3rem)",
        "pace-text-mobile": "clamp(2rem, 1rem + 2vw, 2.5rem)",
        "pace-text": "clamp(2rem, 0.2rem + 2vw, 2.5rem)",
        "pace-number-mobile": "clamp(4.5rem, 3rem + 2vw, 5rem)",
        "pace-number": "clamp(5rem, 4rem + 2vw, 6rem)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        yellow: {
          DEFAULT: "hsl(var(--yellow))",
          light: "hsl(var(--yellow) / 0.8)",
          lighter: "hsl(var(--yellow) / 0.6)",
          dark: "hsl(65 100% 40%)",
          darker: "hsl(65 100% 30%)",
        },
        pink: {
          DEFAULT: "hsl(var(--pink))",
          light: "hsl(var(--pink) / 0.8)",
          lighter: "hsl(var(--pink) / 0.6)",
          dark: "hsl(300 100% 40%)",
          darker: "hsl(300 100% 30%)",
        },
        darkpurple: {
          DEFAULT: "hsl(var(--darkpurple))",
          light: "hsl(264 100% 15%)",
          lighter: "hsl(264 100% 20%)",
          dark: "hsl(264 100% 7%)",
          darker: "hsl(264 100% 5%)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      animation: {
        "color-shift": "colorShift 1s infinite",
        "color-shift-delayed": "colorShift 1s infinite .5s",
        blink: "blink 1s step-end infinite",
        gradient: "gradient 3s ease infinite",
      },
      keyframes: {
        colorShift: {
          "0%, 100%": {
            color: "hsl(var(--yellow))",
          },
          "50%": {
            color: "hsl(var(--pink))",
          },
        },
        blink: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0",
          },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: "white",
            a: {
              color: "hsl(var(--pink))",
              "&:hover": {
                color: "hsl(var(--pink))",
                opacity: 0.8,
              },
            },
            h1: {
              color: "hsl(var(--yellow))",
            },
            h2: {
              color: "hsl(var(--yellow))",
            },
            h3: {
              color: "hsl(var(--yellow))",
            },
            h4: {
              color: "hsl(var(--yellow))",
            },
            strong: {
              color: "white",
            },
            blockquote: {
              color: "hsl(var(--yellow))",
              borderLeftColor: "hsl(var(--yellow))",
            },
            code: {
              color: "hsl(var(--pink))",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
} satisfies Config;
