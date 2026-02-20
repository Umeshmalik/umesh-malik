#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
require("dotenv").config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const DOMAINS = ["umesh-malik.com", "umesh-malik.in"];

const URL_PATHS = [
  "/about",
  "/ai-summary",
  "/blog",
  "/contact",
  "/faq",
  "/press",
  "/projects",
  "/resources",
  "/resume",
  "/uses",
  "/projects/retro-portfolio",
  "/projects/retro-portfolio/about",
  "/projects/retro-portfolio/experience",
  "/projects/retro-portfolio/projects",
  "/projects/retro-portfolio/skills",
  "/projects/retro-portfolio/contact",
  "/blog/category/node-js",
  "/blog/category/ai-open-source",
  "/blog/category/devops-infrastructure",
  "/blog/category/ai-entertainment",
  "/blog/category/career",
  "/blog/category/performance",
  "/blog/category/productivity",
  "/blog/category/testing",
  "/blog/category/css",
  "/blog/category/javascript",
  "/blog/category/typescript",
  "/blog/category/react",
  "/blog/category/sveltekit",
  "/blog/tag/developer-experience",
  "/blog/tag/software-engineering",
  "/blog/tag/cost-optimization",
  "/blog/tag/cloud-computing",
  "/blog/tag/core-web-vitals",
  "/blog/tag/infrastructure",
  "/blog/tag/productivity",
  "/blog/tag/performance",
  "/blog/tag/open-source",
  "/blog/tag/tailwindcss",
  "/blog/tag/type-safety",
  "/blog/tag/javascript",
  "/blog/tag/kubernetes",
  "/blog/tag/typescript",
  "/blog/tag/next-js",
  "/blog/tag/devops",
  "/blog/tag/docker",
  "/blog/tag/react",
  "/blog/tag/testing",
  "/blog/tag/ai",
  "/blog/nodejs-memory-cut-in-half-pointer-compression",
  "/blog/agents-md-ai-coding-agents-study",
  "/blog/docker-swarm-vs-kubernetes-166-dollar-reality-check",
  "/blog/nodejs-backend-for-frontend-developers",
  "/blog/frontend-career-growth-junior-to-senior",
  "/blog/core-web-vitals-optimization-guide",
  "/blog/developer-productivity-tools-senior-engineers",
  "/blog/frontend-testing-strategies-2025",
  "/blog/tailwindcss-v4-migration-guide",
  "/blog/javascript-es2024-features-you-should-know",
  "/blog/typescript-utility-types-complete-guide",
  "/blog/react-performance-optimization-techniques",
  "/blog/sveltekit-vs-nextjs-comparison",
];

// ============================================================================
// GOOGLE AUTHENTICATOR
// ============================================================================

class GoogleAuthenticator {
  constructor() {
    this.credentials = null;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  loadCredentials() {
    // 1. CI: SERVICE_ACCOUNT env var contains the JSON string
    if (process.env.SERVICE_ACCOUNT) {
      try {
        this.credentials = JSON.parse(process.env.SERVICE_ACCOUNT);
        console.log("✅ Credentials loaded from SERVICE_ACCOUNT env var");
        return true;
      } catch (error) {
        console.error("❌ Failed to parse SERVICE_ACCOUNT env var:", error.message);
        return false;
      }
    }

    // 2. Local: credentials.json file
    const credentialsPath = process.env.CREDENTIALS_PATH || "./credentials.json";
    if (fs.existsSync(credentialsPath)) {
      try {
        const data = fs.readFileSync(credentialsPath, "utf8");
        this.credentials = JSON.parse(data);
        console.log(`✅ Credentials loaded from ${credentialsPath}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to load ${credentialsPath}:`, error.message);
        return false;
      }
    }

    console.error("❌ No credentials found.");
    console.error("   Set SERVICE_ACCOUNT env var (JSON string) or place credentials.json in this directory.");
    return false;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const jwt = this.generateJWT();
    const postData = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: "oauth2.googleapis.com",
        port: 443,
        path: "/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": postData.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.access_token) {
              this.accessToken = response.access_token;
              this.tokenExpiry = Date.now() + 3500 * 1000;
              console.log("🔑 Access token obtained");
              resolve(this.accessToken);
            } else {
              reject(new Error("No access token in response"));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  generateJWT() {
    const header = this.base64UrlEncode(
      JSON.stringify({ alg: "RS256", typ: "JWT" }),
    );
    const now = Math.floor(Date.now() / 1000);
    const payload = this.base64UrlEncode(
      JSON.stringify({
        iss: this.credentials.client_email,
        scope: "https://www.googleapis.com/auth/indexing",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    );

    const signature = crypto
      .createSign("RSA-SHA256")
      .update(`${header}.${payload}`)
      .sign(this.credentials.private_key, "base64");

    return `${header}.${payload}.${this.base64UrlEncode(signature, true)}`;
  }

  base64UrlEncode(data, isBuffer = false) {
    const base64 = isBuffer ? data : Buffer.from(data).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

// ============================================================================
// BATCH INDEXER
// ============================================================================

class BatchIndexer {
  constructor(authenticator) {
    this.authenticator = authenticator;
    this.results = {};
  }

  async submitUrl(url, accessToken) {
    const postData = JSON.stringify({
      url: url,
      type: "URL_UPDATED",
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: "indexing.googleapis.com",
        port: 443,
        path: "/v3/urlNotifications:publish",
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": postData.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              url,
              status: "success",
              statusCode: res.statusCode,
              timestamp: new Date().toISOString(),
            });
          } else {
            try {
              const error = JSON.parse(data);
              resolve({
                url,
                status: "failed",
                error: error.error?.message || `HTTP ${res.statusCode}`,
                statusCode: res.statusCode,
                timestamp: new Date().toISOString(),
              });
            } catch (e) {
              resolve({
                url,
                status: "failed",
                error: `HTTP ${res.statusCode}`,
                statusCode: res.statusCode,
                timestamp: new Date().toISOString(),
              });
            }
          }
        });
      });

      req.on("error", (error) => {
        resolve({
          url,
          status: "failed",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      });

      req.write(postData);
      req.end();
    });
  }

  async processBatch(domain, urls) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🌐 Domain: ${domain}`);
    console.log(`📝 URLs: ${urls.length}`);
    console.log(`${"=".repeat(70)}\n`);

    const results = {
      domain,
      totalUrls: urls.length,
      success: [],
      failed: [],
      startTime: new Date().toISOString(),
    };

    const accessToken = await this.authenticator.getAccessToken();
    const startTime = Date.now();

    for (let i = 0; i < urls.length; i++) {
      const result = await this.submitUrl(urls[i], accessToken);

      const emoji = result.status === "success" ? "✅" : "❌";
      const percentage = (((i + 1) / urls.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(
        `${emoji} [${i + 1}/${urls.length}] (${percentage}%) [${elapsed}s] ${urls[i]}`,
      );

      if (result.status === "success") {
        results.success.push(result);
      } else {
        results.failed.push(result);
      }

      await this.sleep(200);
    }

    results.endTime = new Date().toISOString();
    results.duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    this.results[domain] = results;
    return results;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printSummary(domainResults) {
    console.log(`\n📊 Summary for ${domainResults.domain}:`);
    console.log(
      `   ✅ Success: ${domainResults.success.length}/${domainResults.totalUrls}`,
    );
    console.log(
      `   ❌ Failed: ${domainResults.failed.length}/${domainResults.totalUrls}`,
    );
    console.log(`   ⏱️  Duration: ${domainResults.duration}`);
    console.log(
      `   📈 Success Rate: ${((domainResults.success.length / domainResults.totalUrls) * 100).toFixed(2)}%`,
    );

    if (domainResults.failed.length > 0 && domainResults.failed.length <= 10) {
      console.log(`\n⚠️  Failed URLs:`);
      domainResults.failed.forEach((r) => {
        console.log(`   ❌ ${r.url}`);
        console.log(`      ${r.error}`);
      });
    }
  }

  saveResults() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `indexing-results-${timestamp}.json`;

    const report = {
      executedAt: new Date().toISOString(),
      totalDomains: Object.keys(this.results).length,
      results: Object.values(this.results).map((r) => ({
        domain: r.domain,
        totalUrls: r.totalUrls,
        successCount: r.success.length,
        failedCount: r.failed.length,
        successRate: ((r.success.length / r.totalUrls) * 100).toFixed(2) + "%",
        duration: r.duration,
        failedUrls: r.failed.map((f) => ({ url: f.url, error: f.error })),
      })),
    };

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Results saved: ${filename}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("\n🚀 GOOGLE INDEXING API - BATCH SUBMITTER");
  console.log("=".repeat(70));
  console.log(
    `📅 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
  );
  console.log(`🌍 Domains: ${DOMAINS.join(", ")}`);
  console.log(`📊 URLs per domain: ${URL_PATHS.length}`);
  console.log(`🔄 Total: ${DOMAINS.length * URL_PATHS.length} requests`);
  console.log("=".repeat(70));

  const authenticator = new GoogleAuthenticator();

  if (!authenticator.loadCredentials()) {
    process.exit(1);
  }

  const indexer = new BatchIndexer(authenticator);

  for (const domain of DOMAINS) {
    const fullUrls = URL_PATHS.map((path) => `https://${domain}${path}`);
    const results = await indexer.processBatch(domain, fullUrls);
    indexer.printSummary(results);
  }

  indexer.saveResults();

  console.log("\n✨ All domains processed!\n");
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
