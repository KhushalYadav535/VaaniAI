import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/settings/', '/super-admin/'],
    },
    sitemap: 'https://vocred.com/sitemap.xml',
  }
}
