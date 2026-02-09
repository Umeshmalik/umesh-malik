import { personalInfo, experiences, projects } from "../data/resume";
import { getYearsOfExperience } from "../data/dynamic";

export async function GET() {
  const siteUrl = "https://umesh-malik.com";
  const years = getYearsOfExperience();
  const now = new Date().toUTCString();

  const items = [
    {
      title: "Umesh Malik — Senior Frontend Engineer Portfolio",
      link: `${siteUrl}/`,
      description: `Explore the interactive portfolio of Umesh Malik, Senior Frontend Engineer at Expedia Group with ${years}+ years of experience in React, TypeScript, and JavaScript.`,
      pubDate: now,
    },
    {
      title: `About Umesh Malik — ${years}+ Years in Frontend Engineering`,
      link: `${siteUrl}/about/`,
      description: `Learn about Umesh Malik's professional journey from Associate Engineer to SDE-2 at Expedia Group, including education, awards, and expertise.`,
      pubDate: now,
    },
    {
      title: `Work Experience — Expedia Group, Tekion Corp, BYJU'S`,
      link: `${siteUrl}/experience/`,
      description: `${years}+ years of professional experience: ${experiences.map(e => `${e.role} at ${e.company}`).join(', ')}.`,
      pubDate: now,
    },
    {
      title: "Portfolio Projects by Umesh Malik",
      link: `${siteUrl}/projects/`,
      description: `Browse ${projects.length} projects: ${projects.map(p => p.name).join(', ')}. Built with React, TypeScript, Node.js, and more.`,
      pubDate: now,
    },
    {
      title: "Technical Skills — React, TypeScript, JavaScript & More",
      link: `${siteUrl}/skills/`,
      description: "Comprehensive technical skills spanning React, TypeScript, JavaScript, Node.js, and 25+ other technologies visualized as an interactive 3D galaxy.",
      pubDate: now,
    },
    {
      title: "Contact Umesh Malik — Hire Me",
      link: `${siteUrl}/contact/`,
      description: `Get in touch with Umesh Malik via email (${personalInfo.email}), LinkedIn, or GitHub for collaboration, freelance, or career opportunities.`,
      pubDate: now,
    },
  ];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Umesh Malik — Senior Frontend Engineer</title>
    <link>${siteUrl}</link>
    <description>Portfolio and professional updates from Umesh Malik, Senior Frontend Engineer at Expedia Group specializing in React, TypeScript, and modern web development.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <managingEditor>${personalInfo.email} (Umesh Malik)</managingEditor>
    <webMaster>${personalInfo.email} (Umesh Malik)</webMaster>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/og-image.png</url>
      <title>Umesh Malik — Senior Frontend Engineer</title>
      <link>${siteUrl}</link>
    </image>
    ${items.map(item => `
    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${item.link}</guid>
      <dc:creator>Umesh Malik</dc:creator>
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
