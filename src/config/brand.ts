/**
 * NovaPilot — Central Brand Configuration
 * Change brand identity here without touching other files.
 */

export const brand = {
  name: 'NovaPilot',
  tagline: 'Create, optimize and automate your content with AI.',
  description:
    'One intelligent workspace for content creation, SEO, affiliate marketing and automated publishing.',
  shortDescription: 'Your AI workspace for content, SEO and growth.',
  supportEmail: 'support@novapilot.ai',
  websiteUrl: 'https://novapilot.ai',
  docsUrl: 'https://docs.novapilot.ai',
  twitterHandle: '@novapilotai',
  githubUrl: 'https://github.com/novapilot',
  logoPath: '/logo.svg',
  logoDarkPath: '/logo-dark.svg',
  faviconPath: '/favicon.ico',
  socialLinks: {
    twitter: 'https://twitter.com/novapilotai',
    linkedin: 'https://linkedin.com/company/novapilot',
    github: 'https://github.com/novapilot',
  },
  address: '',
  companyName: 'NovaPilot Inc.',
} as const;

export type Brand = typeof brand;
