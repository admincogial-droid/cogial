/**
 * NovaPilot — Central Brand Configuration
 * Change brand identity here without touching other files.
 */

export const brand = {
  name: 'PressLine',
  tagline: 'Create, optimize and automate your content with AI.',
  description:
    'One intelligent workspace for content creation, SEO, affiliate marketing and automated publishing.',
  shortDescription: 'Your AI workspace for content, SEO and growth.',
  supportEmail: 'support@pressline.ai',
  websiteUrl: 'https://pressline.ai',
  docsUrl: 'https://docs.pressline.ai',
  twitterHandle: '@presslineai',
  githubUrl: 'https://github.com/pressline',
  logoPath: '/logo.svg',
  logoDarkPath: '/logo-dark.svg',
  faviconPath: '/favicon.ico',
  socialLinks: {
    twitter: 'https://twitter.com/presslineai',
    linkedin: 'https://linkedin.com/company/pressline',
    github: 'https://github.com/pressline',
  },
  address: '',
  companyName: 'PressLine Inc.',
} as const;

export type Brand = typeof brand;
