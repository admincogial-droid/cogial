/**
 * Feature flags — enable/disable features from a central location.
 * In production these are also stored in the database (feature_flags table)
 * and can be toggled by admin without a deploy.
 */

export const features = {
  bulkGeneration: true,
  wordpressIntegration: true,
  bloggerIntegration: true,
  affiliateTracking: true,
  advancedSeo: true,
  teamWorkspaces: true,
  apiAccess: true,
  automation: true,
  demoMode: false,
  googleOAuth: true,
  magicLink: false,
  darkMode: true,
  contentVersioning: true,
  aiStreaming: true,
} as const;

export type Features = typeof features;
