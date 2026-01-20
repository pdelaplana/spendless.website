#!/usr/bin/env node

/**
 * Blog Build Script
 *
 * Reads markdown files from blog/_articles/, parses frontmatter,
 * converts to HTML, and generates static blog pages.
 *
 * Usage: node scripts/build-blog.js
 */

const fs = require('fs');
const path = require('path');
const frontMatter = require('front-matter');
const { marked } = require('marked');

// Configure marked for safe HTML output
marked.setOptions({
  gfm: true,
  breaks: true
});

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT_DIR, 'blog', '_articles');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');

// Site configuration
const SITE_URL = 'https://spendless.app';
const SITE_NAME = 'Spendless';
const DEFAULT_OG_IMAGE = 'https://spendless.app/images/og-image.png';
const SITE_LOGO = 'https://spendless.app/images/spendless-header-logo.png';

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
}

/**
 * Generate slug from filename
 */
function getSlugFromFilename(filename) {
  return path.basename(filename, '.md');
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for ISO
 */
function formatDateISO(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString();
}

/**
 * Get common header HTML
 * @param {string} rootPath - Path from current file to site root (e.g., '../' or '../../')
 * @param {string} blogPath - Path from current file to blog directory (e.g., '../blog/' or '../')
 */
function getHeaderHTML(rootPath = '', blogPath = 'blog/') {
  return `
  <!-- Header with Logo -->
  <header class="site-header">
    <div class="container">
      <a href="${rootPath || '/'}" class="logo-link">
        <img src="${rootPath}images/spendless-header-logo.png" alt="Spendless" class="site-logo">
      </a>

      <nav class="header-nav">
        <a href="${rootPath}#features" class="nav-link">Features</a>
        <a href="${rootPath}#pricing" class="nav-link">Pricing</a>
        <a href="${blogPath}" class="nav-link">Blog</a>
      </nav>

      <div class="header-cta">
        <a href="https://app.getspendless.com/signup" class="btn btn-primary">Get Started</a>
      </div>
    </div>
  </header>`;
}

/**
 * Get common footer HTML
 * @param {string} rootPath - Path from current file to site root (e.g., '../' or '../../')
 * @param {string} blogPath - Path from current file to blog directory (e.g., '../blog/' or '../')
 */
function getFooterHTML(rootPath = '', blogPath = 'blog/') {
  return `
  <!-- Footer - Minimal -->
  <footer class="footer-modern">
    <div class="container">
      <div class="footer-content-modern">
        <div class="footer-logo-modern">Spendless</div>
        <div class="footer-links">
          <a href="${blogPath}">Blog</a>
          <span>•</span>
          <a href="${rootPath}privacy.html">Privacy</a>
          <span>•</span>
          <a href="${rootPath}terms.html">Terms</a>
          <span>•</span>
          <a href="mailto:patrick@getspendless.com">Contact</a>
        </div>
        <div class="footer-copyright">© 2025 Spendless</div>
      </div>
    </div>
  </footer>`;
}

/**
 * Generate article page HTML
 */
function generateArticlePage(article) {
  const readingTime = calculateReadingTime(article.content);
  const formattedDate = formatDate(article.date);
  const isoDatePublished = formatDateISO(article.date);
  const isoDateModified = article.modified ? formatDateISO(article.modified) : isoDatePublished;
  const ogImage = article.image || DEFAULT_OG_IMAGE;
  const articleTags = article.tags || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${article.title} - ${SITE_NAME} Blog</title>
  <meta name="title" content="${article.title} - ${SITE_NAME} Blog">
  <meta name="description" content="${article.description}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/blog/${article.slug}/">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${article.description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">
  <meta property="article:published_time" content="${isoDatePublished}">
  <meta property="article:modified_time" content="${isoDateModified}">
  <meta property="article:author" content="${article.author}">
  <meta property="article:section" content="Finance">
${articleTags.map(tag => `  <meta property="article:tag" content="${tag}">`).join('\n')}

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${SITE_URL}/blog/${article.slug}/">
  <meta property="twitter:title" content="${article.title}">
  <meta property="twitter:description" content="${article.description}">
  <meta property="twitter:image" content="${ogImage}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Canonical URL -->
  <link rel="canonical" href="${SITE_URL}/blog/${article.slug}/">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="../../css/variables.css">
  <link rel="stylesheet" href="../../css/styles.css">
  <link rel="stylesheet" href="../../css/blog.css">

  <!-- Ionic Icons -->
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>

  <!-- Structured Data - BlogPosting -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${article.title}",
    "description": "${article.description}",
    "image": "${ogImage}",
    "datePublished": "${isoDatePublished}",
    "dateModified": "${isoDateModified}",
    "author": {
      "@type": "Organization",
      "name": "${article.author}",
      "url": "${SITE_URL}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_LOGO}"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${SITE_URL}/blog/${article.slug}/"
    },
    "wordCount": ${article.content.trim().split(/\s+/).length}${articleTags.length > 0 ? `,
    "keywords": "${articleTags.join(', ')}"` : ''}
  }
  </script>

  <!-- Structured Data - Breadcrumb -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "${SITE_URL}/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "${SITE_URL}/blog/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${article.title}",
        "item": "${SITE_URL}/blog/${article.slug}/"
      }
    ]
  }
  </script>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-7Y3PKKQC2F"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-7Y3PKKQC2F');
  </script>
</head>
<body>

  ${getHeaderHTML('../../', '../')}

  <main class="blog-article">
    <div class="blog-container">
      <a href="../" class="back-link">
        <ion-icon name="arrow-back"></ion-icon>
        Back to Blog
      </a>

      <article class="blog-content">
        <header class="blog-article-header">
          <h1>${article.title}</h1>
          <div class="blog-article-meta">
            <span class="blog-date">${formattedDate}</span>
            <span class="blog-separator">•</span>
            <span class="blog-reading-time">${readingTime} min read</span>
          </div>
        </header>

        <div class="blog-body">
          ${article.htmlContent}
        </div>

        <footer class="blog-article-footer">
          <p class="blog-author">— ${article.author}</p>
        </footer>
      </article>

      <div class="blog-cta-section">
        <h3>Ready to track your spending mindfully?</h3>
        <p>Join Spendless and start building financial awareness today.</p>
        <a href="https://app.getspendless.com/signup" class="btn btn-primary">Get Started Free</a>
      </div>
    </div>
  </main>

  ${getFooterHTML('../../', '../')}

  <script src="../../js/main.js"></script>
</body>
</html>`;
}

/**
 * Generate blog listing page HTML
 */
function generateListingPage(articles) {
  // Sort articles by date (newest first)
  const sortedArticles = [...articles].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  const articleCards = sortedArticles.map(article => {
    const readingTime = calculateReadingTime(article.content);
    const formattedDate = formatDate(article.date);

    return `
        <a href="${article.slug}/" class="blog-card">
          <div class="blog-card-content">
            <h2 class="blog-card-title">${article.title}</h2>
            <p class="blog-card-description">${article.description}</p>
            <div class="blog-card-meta">
              <span class="blog-date">${formattedDate}</span>
              <span class="blog-separator">•</span>
              <span class="blog-reading-time">${readingTime} min read</span>
            </div>
          </div>
          <div class="blog-card-arrow">
            <ion-icon name="arrow-forward"></ion-icon>
          </div>
        </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>Blog - ${SITE_NAME} | Mindful Spending Tips & Updates</title>
  <meta name="title" content="Blog - ${SITE_NAME} | Mindful Spending Tips & Updates">
  <meta name="description" content="Tips, updates, and insights about mindful spending, financial wellness, and getting the most from Spendless.">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/blog/">
  <meta property="og:title" content="Blog - ${SITE_NAME}">
  <meta property="og:description" content="Tips, updates, and insights about mindful spending, financial wellness, and getting the most from Spendless.">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${SITE_URL}/blog/">
  <meta property="twitter:title" content="Blog - ${SITE_NAME}">
  <meta property="twitter:description" content="Tips, updates, and insights about mindful spending, financial wellness, and getting the most from Spendless.">
  <meta property="twitter:image" content="${DEFAULT_OG_IMAGE}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Canonical URL -->
  <link rel="canonical" href="${SITE_URL}/blog/">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="stylesheet" href="../css/blog.css">

  <!-- Ionic Icons -->
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>

  <!-- Structured Data - Blog -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "${SITE_NAME} Blog",
    "description": "Tips, updates, and insights about mindful spending and financial wellness",
    "url": "${SITE_URL}/blog/",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_LOGO}"
      }
    }
  }
  </script>

  <!-- Structured Data - Breadcrumb -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "${SITE_URL}/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "${SITE_URL}/blog/"
      }
    ]
  }
  </script>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-7Y3PKKQC2F"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-7Y3PKKQC2F');
  </script>
</head>
<body>

  ${getHeaderHTML('../', './')}

  <main class="blog-listing">
    <div class="blog-container">
      <header class="blog-header">
        <h1>Blog</h1>
        <p class="blog-header-subtitle">Tips, updates, and insights about mindful spending</p>
      </header>

      <div class="blog-grid">
        ${articleCards}
      </div>
    </div>
  </main>

  ${getFooterHTML('../', './')}

  <script src="../js/main.js"></script>
</body>
</html>`;
}

/**
 * Main build function
 */
function build() {
  console.log('🚀 Building blog...\n');

  // Check if articles directory exists
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('📁 Creating articles directory...');
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  // Read all markdown files
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('⚠️  No articles found in blog/_articles/');
    console.log('   Add markdown files with frontmatter to generate blog pages.\n');
    return;
  }

  console.log(`📄 Found ${files.length} article(s)\n`);

  const articles = [];

  // Process each article
  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const { attributes, body } = frontMatter(fileContent);

    // Validate required fields
    if (!attributes.title || !attributes.description || !attributes.date) {
      console.log(`⚠️  Skipping ${file}: Missing required frontmatter (title, description, date)`);
      continue;
    }

    const slug = getSlugFromFilename(file);
    const htmlContent = marked(body);

    const article = {
      slug,
      title: attributes.title,
      description: attributes.description,
      date: attributes.date,
      modified: attributes.modified || null,  // Optional: date last modified
      author: attributes.author || 'The Spendless Team',
      image: attributes.image || null,  // Optional: custom og:image URL
      tags: attributes.tags || [],  // Optional: array of tags for SEO
      content: body,
      htmlContent
    };

    articles.push(article);

    // Create article directory
    const articleDir = path.join(BLOG_DIR, slug);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    // Generate article page
    const articleHTML = generateArticlePage(article);
    const articlePath = path.join(articleDir, 'index.html');
    fs.writeFileSync(articlePath, articleHTML);

    console.log(`   ✅ ${slug}/index.html`);
  }

  // Generate listing page
  if (articles.length > 0) {
    const listingHTML = generateListingPage(articles);
    const listingPath = path.join(BLOG_DIR, 'index.html');
    fs.writeFileSync(listingPath, listingHTML);
    console.log(`   ✅ blog/index.html`);
  }

  console.log(`\n✨ Blog built successfully! Generated ${articles.length} article(s).`);
}

// Run build
build();
