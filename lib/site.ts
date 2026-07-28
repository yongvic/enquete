export function getSiteConfig() {
  return {
    authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Young Vic",
    whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/22891480288",
    linkedinUrl:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ||
      "https://www.linkedin.com/in/edo-yawo-sokpa-06617b333",
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/yongvic",
  };
}
