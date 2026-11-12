import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function htmlFiles() {
  return fs
    .readdirSync(projectRoot)
    .filter((file) => file.endsWith(".html"))
    .sort();
}

function localPathFromReference(reference) {
  if (
    !reference ||
    reference.startsWith("#") ||
    /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(reference)
  ) {
    return null;
  }

  return reference.split(/[?#]/, 1)[0];
}

test("seluruh tautan, stylesheet, dan script lokal memiliki target", () => {
  for (const htmlFile of htmlFiles()) {
    const html = read(htmlFile);
    const references = [
      ...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)
    ].map((match) => match[1]);

    for (const reference of references) {
      if (reference.startsWith("#") && reference.length > 1) {
        const anchor = reference.slice(1);
        assert.match(
          html,
          new RegExp(`\\bid=["']${anchor}["']`),
          `${htmlFile}: anchor ${reference} tidak ditemukan`
        );
        continue;
      }

      const localPath = localPathFromReference(reference);
      if (!localPath) continue;

      assert.equal(
        (fs.existsSync(path.join(projectRoot, localPath)) || fs.existsSync(path.join(projectRoot, "public", localPath))),
        true,
        `${htmlFile}: target lokal ${reference} tidak ditemukan`
      );
    }
  }
});

test("semua tombol HTML memiliki tipe yang eksplisit", () => {
  for (const htmlFile of htmlFiles()) {
    const html = read(htmlFile);
    const buttons = [...html.matchAll(/<button\b([^>]*)>/gi)];

    for (const button of buttons) {
      assert.match(
        button[1],
        /\btype=["'](?:button|submit|reset)["']/i,
        `${htmlFile}: tombol tanpa atribut type ditemukan`
      );
    }
  }
});

test("kontrol utama terhubung ke penangan interaksi", () => {
  const contracts = [
    ["js/app.js", /menuButton\.addEventListener\(["']click["']/],
    ["js/app.js", /profileForm\.addEventListener\(["']submit["']/],
    ["js/app.js", /careerStageForm\.addEventListener\(["']submit["']/],
    ["public/password-toggle.js", /button\.addEventListener\(["']click["']/],
    ["js/auth/login.js", /form\.addEventListener\(["']submit["']/],
    ["js/auth/signup.js", /form\.addEventListener\(["']submit["']/],
    ["js/auth/forgot-password.js", /form\.addEventListener\(["']submit["']/],
    ["js/auth/reset-password.js", /form\.addEventListener\(["']submit["']/],
    ["js/career-page.js", /dreamCareerForm\.addEventListener\(["']submit["']/],
    ["js/career-page.js", /unsureCareerButton\.addEventListener\(["']click["']/],
    ["js/career-page.js", /writeAnotherCareerButton\.addEventListener/],
    ["js/career-page.js", /continueButton\.addEventListener\(["']click["']/],
    ["js/assessment.js", /nextButton\.addEventListener\(["']click["']/],
    ["js/assessment.js", /previousButton\.addEventListener\(["']click["']/],
    ["js/readiness.js", /adaptabilityForm\.addEventListener/],
    ["js/readiness.js", /roadmapButton\.addEventListener/],
    ["js/my-path.js", /tab\.addEventListener/],
    ["js/my-path.js", /checkbox\.addEventListener\(["']change["']/],
    ["js/auth/session-ui.js", /logoutButton\.addEventListener\(["']click["']/],
    ["js/auth/session-ui.js", /resetButton\.addEventListener\(["']click["']/],
    ["js/page-state.js", /addEventListener\(["']click["']/]
  ];

  for (const [file, pattern] of contracts) {
    assert.match(read(file), pattern, `${file}: penangan interaksi utama tidak ditemukan`);
  }
});

test("konfigurasi publik Supabase tersedia tanpa file env", () => {
  const source = read("js/lib/supabase.js");

  assert.match(source, /https:\/\/bolvnsrlwmekjiuhmkqm\.supabase\.co/);
  assert.match(source, /sb_publishable_[A-Za-z0-9_-]+/);
  assert.match(source, /import\.meta\.env\.VITE_SUPABASE_URL\s*\|\|\s*defaultSupabaseUrl/);
});

test("landing page tidak menampilkan statistik dari satu skripsi", () => {
  const publicCopy = `${read("index.html")}\n${read("README.md")}`;

  assert.doesNotMatch(publicCopy, /54,5%|unmuhjember|research-highlight/i);
});

test("tombol password hanya menampilkan ikon mata", () => {
  for (const htmlFile of ["login.html", "signup.html", "reset-password.html"]) {
    const html = read(htmlFile);
    const toggles = [
      ...html.matchAll(/<button\b([^>]*\bclass=["'][^"']*password-toggle[^"']*["'][^>]*)>([\s\S]*?)<\/button>/gi)
    ];

    assert.ok(toggles.length > 0, `${htmlFile}: tombol password tidak ditemukan`);

    for (const toggle of toggles) {
      assert.equal(toggle[2].replace(/<[^>]*>/g, "").trim(), "", `${htmlFile}: tombol password masih memuat teks terlihat`);
      assert.match(toggle[1], /\baria-label=["'][^"']+["']/i);
    }
  }
});

test("halaman login dan daftar memiliki tombol kembali ke beranda", () => {
  for (const htmlFile of ["login.html", "signup.html"]) {
    assert.match(
      read(htmlFile),
      /<a\s+href=["']index\.html["']\s+class=["']auth-back-link["']>← Home<\/a>/i,
      `${htmlFile}: tombol kembali ke beranda tidak ditemukan`
    );
  }
});

test("landing page hanya memiliki satu tombol mulai jalur", () => {
  const html = read("index.html");
  const journeyLinks = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((label) => /Start My Path/i.test(label));

  assert.deepEqual(journeyLinks, ["Start My Path"]);
});

test("landing page hanya memiliki satu tautan jelajahi karier", () => {
  const html = read("index.html");
  const exploreLinks = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((label) => label === "Explore Careers");

  assert.deepEqual(exploreLinks, ["Explore Careers"]);
});

test("navbar menandai bagian beranda yang sedang dibaca", () => {
  const app = read("js/app.js");
  const styles = read("css/polish.css");

  assert.match(app, /querySelectorAll\(['"]a\[href\^=[^\]]+\]["']\)/);
  assert.match(app, /classList\.toggle\(["']is-active["']/);
  assert.match(app, /aria-current["'],\s*["']location/);
  assert.match(styles, /\.is-active\s*\{[^}]*color:\s*#3478f6/is);
});

test("navbar desktop memakai ruang layar yang lebih seimbang", () => {
  const styles = read("css/visual-upgrade.css");

  assert.match(styles, /@media\s*\(min-width:\s*901px\)[\s\S]*?\.navbar-content\s*\{[\s\S]*?1680px/);
});

test("navbar tidak membuat pintasan perjalanan ganda", () => {
  const sessionUi = read("js/auth/session-ui.js");

  assert.doesNotMatch(sessionUi, /session-journey-link|journey-shortcut/);
});

test("navbar beranda membuka hasil tersimpan atau melanjutkan langkah terakhir", () => {
  const sessionUi = read("js/auth/session-ui.js");

  assert.match(sessionUi, /authContext\s*===\s*["']public["']/);
  assert.match(sessionUi, /destination\s*===\s*["']my-path\.html["']/);
  assert.match(sessionUi, /["']Open My Path["']/);
  assert.match(sessionUi, /["']Continue My Path["']/);
  assert.doesNotMatch(sessionUi, /["']Jalur Saya["'],\s*["']profile-menu-item["']/);
});

test("tahap dua kembali langsung ke beranda bukan ke profil", () => {
  const html = read("career-stage.html");

  assert.doesNotMatch(html, /href=["']onboarding\.html["']/);
  assert.equal((html.match(/href=["']index\.html["']/g) || []).length, 3);
});

test("profil mewajibkan pilihan experience termasuk opsi belum memiliki", () => {
  const html = read("onboarding.html");
  const app = read("js/app.js");

  assert.match(html, /value=["']No Experience["'][^>]*data-no-experience/);
  assert.match(html, />No Experience Yet</);
  assert.match(app, /key:\s*["']experience["']/);
  assert.match(app, /experienceInputs\.some\(function \(input\) \{ return input\.checked; \}\)/);
  assert.match(app, /otherInput\.checked\s*=\s*false/);
  assert.match(app, /noExperienceInput\.checked\s*=\s*false/);
});

test("edit profil kembali ke beranda setelah simpan atau batal", () => {
  const app = read("js/app.js");
  const sessionUi = read("js/auth/session-ui.js");

  assert.match(app, /const profileReturnPage = ["']index\.html["']/);
  assert.match(sessionUi, /onboarding\.html\?edit=profile/);
  assert.doesNotMatch(sessionUi, /edit=profile&return=/);
});

test("jalur saya memiliki jalan kembali ke beranda tanpa tombol buka tugas", () => {
  const html = read("my-path.html");

  assert.match(html, /href=["']index\.html["'] class=["']back-link["']>← Home</);
  assert.doesNotMatch(html, /Buka tugas/i);
});

test("pencarian karier tidak mengaku mendukung semua pekerjaan", () => {
  const html = read("career.html");
  const page = read("js/career-page.js");

  assert.doesNotMatch(html, /Bebas pilih pekerjaan/i);
  assert.match(html, /supports careers that match its available catalog/i);
  assert.match(page, /This career is not yet in the Pathly catalog/);
  assert.match(page, /findBroadGroup\(input\)\s*\|\|\s*customCareerEngine\.inferGroup\(input\)/);
});

test("mode perbandingan langsung menampilkan hasil tanpa tombol tambahan", () => {
  const page = read("js/career-page.js");

  assert.doesNotMatch(page, /Bandingkan Karier Terpilih/);
  assert.match(page, /continueButton\.hidden\s*=\s*careerMode\s*===\s*["']validate["']/);
  assert.match(
    page,
    /function updateValidationSelection\(\)[\s\S]*?if \(count >= 2\)[\s\S]*?renderComparison\(\)/
  );
});
