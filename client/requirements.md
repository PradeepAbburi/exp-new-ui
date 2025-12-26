## Packages
framer-motion | Complex animations and page transitions
date-fns | Date formatting for articles
react-syntax-highlighter | Code block syntax highlighting
react-dropzone | File uploads for media/documents
clsx | Class name utility (often needed with tailwind-merge)
tailwind-merge | Class merging utility
lucide-react | Icons (already in base but ensuring version)

## Notes
Tailwind Config - extend colors:
colors: {
  background: "hsl(0 0% 13%)", // #202020
  foreground: "hsl(0 0% 100%)",
  primary: "hsl(174 100% 29%)", // Teal
  "primary-foreground": "hsl(0 0% 100%)",
  card: "hsl(0 0% 16%)", // Slightly lighter than bg
  "card-foreground": "hsl(0 0% 100%)",
  border: "hsl(0 0% 25%)",
  muted: "hsl(0 0% 20%)",
  "muted-foreground": "hsl(0 0% 60%)",
}

Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Outfit'", "sans-serif"],
  body: ["'DM Sans'", "sans-serif"],
  mono: ["'JetBrains Mono'", "monospace"],
}
