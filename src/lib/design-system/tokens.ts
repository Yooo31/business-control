export const spacingTokens = {
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
} as const;

export const radiusTokens = {
  sm: "0.5rem",
  md: "0.875rem",
  lg: "1.25rem",
  xl: "1.75rem",
  full: "999px",
} as const;

export const shadowTokens = {
  sm: "0 10px 24px -18px rgb(15 23 42 / 0.18)",
  md: "0 24px 60px -32px rgb(15 23 42 / 0.28)",
  lg: "0 36px 90px -40px rgb(15 23 42 / 0.34)",
} as const;

export const typographyTokens = {
  hero: {
    fontSize: "clamp(3rem, 8vw, 5.5rem)",
    lineHeight: "0.98",
    letterSpacing: "-0.05em",
  },
  pageTitle: {
    fontSize: "clamp(2rem, 4vw, 3.5rem)",
    lineHeight: "1.02",
    letterSpacing: "-0.04em",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    lineHeight: "1.15",
    letterSpacing: "-0.03em",
  },
  body: {
    fontSize: "1rem",
    lineHeight: "1.7",
    letterSpacing: "-0.01em",
  },
} as const;

export const semanticColorTokens = {
  canvas: "var(--canvas)",
  panel: "var(--card)",
  primary: "var(--primary)",
  neutral: "var(--muted)",
  info: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
} as const;

export const designSystemTokens = {
  spacing: spacingTokens,
  radius: radiusTokens,
  shadow: shadowTokens,
  typography: typographyTokens,
  colors: semanticColorTokens,
} as const;
