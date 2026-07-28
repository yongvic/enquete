export function getSiteConfig() {
  return {
    authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Young Vic",
    whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || "",
    linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://linkedin.com/in/yongvic",
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/yongvic",
  };
}
