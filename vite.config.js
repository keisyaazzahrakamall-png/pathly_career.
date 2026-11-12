import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");

const securityHeaders = {
  "Content-Security-Policy": contentSecurityPolicy,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function securityMetaPlugin() {
  return {
    name: "pathly-security-meta",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: contentSecurityPolicy.replace("; frame-ancestors 'none'", "")
          },
          injectTo: "head-prepend"
        },
        {
          tag: "meta",
          attrs: {
            name: "referrer",
            content: "strict-origin-when-cross-origin"
          },
          injectTo: "head-prepend"
        }
      ];
    }
  };
}

export default defineConfig({
  plugins: [securityMetaPlugin()],
  server: {
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(projectRoot, "index.html"),
        login: resolve(projectRoot, "login.html"),
        signup: resolve(projectRoot, "signup.html"),
        confirmEmail: resolve(projectRoot, "confirm-email.html"),
        forgotPassword: resolve(projectRoot, "forgot-password.html"),
        resetPassword: resolve(projectRoot, "reset-password.html"),
        privacy: resolve(projectRoot, "privacy.html"),
        onboarding: resolve(projectRoot, "onboarding.html"),
        careerStage: resolve(projectRoot, "career-stage.html"),
        career: resolve(projectRoot, "career.html"),
        assessment: resolve(projectRoot, "assessment.html"),
        results: resolve(projectRoot, "results.html"),
        readiness: resolve(projectRoot, "readiness.html"),
        roadmap: resolve(projectRoot, "roadmap.html"),
        myPath: resolve(projectRoot, "my-path.html"),
        studentDashboard: resolve(projectRoot, "student-dashboard.html"),
        supervisorDashboard: resolve(projectRoot, "supervisor-dashboard.html"),
        adminDashboard: resolve(projectRoot, "admin-dashboard.html")
      }
    }
  }
});
