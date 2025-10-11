/**
 * Spendless - Main JavaScript
 * Handles interactions, animations, analytics, and PWA features
 */

(function() {
  'use strict';

  // ================================
  // 1. Smooth Scrolling
  // ================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') {
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Track CTA clicks
          trackCTAClick(this.textContent, href);
        }
      });
    });
  }

  // ================================
  // 2. Scroll Animations
  // ================================

  function initScrollAnimations() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all cards, steps, and sections
    const animatedElements = document.querySelectorAll(
      '.card, .step, .category-card, .philosophy-item, .pricing-card, .problem-box, .solution-box'
    );

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  // ================================
  // 3. PWA Install Prompt
  // ================================

  let deferredPrompt;

  function initPWAInstall() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Store the event for later use
      deferredPrompt = e;

      // Track that install prompt was shown
      trackEvent('pwa_install_prompt_shown', {
        event_category: 'PWA',
        event_label: 'Install Prompt Available'
      });

      // Optionally show custom install button
      // showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      trackEvent('pwa_install_success', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
      deferredPrompt = null;
    });
  }

  // ================================
  // 4. CTA Click Tracking
  // ================================

  function trackCTAClick(buttonText, destination) {
    trackEvent('cta_click', {
      event_category: 'engagement',
      event_label: buttonText,
      destination: destination
    });
  }

  function initCTATracking() {
    // Track all button clicks
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', function() {
        const buttonText = this.textContent.trim();
        const destination = this.getAttribute('href') || 'button_action';
        trackCTAClick(buttonText, destination);
      });
    });
  }

  // ================================
  // 5. Scroll Depth Tracking
  // ================================

  function initScrollDepthTracking() {
    const milestones = {
      25: false,
      50: false,
      75: false,
      100: false
    };

    function checkScrollDepth() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

      // Check each milestone
      Object.keys(milestones).forEach(milestone => {
        if (scrollPercent >= parseInt(milestone) && !milestones[milestone]) {
          milestones[milestone] = true;
          trackEvent('scroll_depth', {
            event_category: 'engagement',
            event_label: `${milestone}%`,
            value: parseInt(milestone)
          });
        }
      });
    }

    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ================================
  // 6. Section Visibility Tracking
  // ================================

  function initSectionTracking() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId) {
            trackEvent('section_view', {
              event_category: 'engagement',
              event_label: sectionId
            });
          }
        }
      });
    }, observerOptions);

    // Observe key sections
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => sectionObserver.observe(section));
  }

  // ================================
  // 7. Exit Intent Modal (Optional)
  // ================================

  function initExitIntent() {
    let exitIntentShown = false;

    document.addEventListener('mouseleave', (e) => {
      // Only trigger if mouse leaves from top of page
      if (e.clientY < 10 && !exitIntentShown) {
        exitIntentShown = true;

        // Track exit intent
        trackEvent('exit_intent', {
          event_category: 'engagement',
          event_label: 'Mouse Leave Top'
        });

        // Show exit modal (implement your modal here)
        // For now, just scroll to email signup
        const emailSection = document.getElementById('email-signup');
        if (emailSection && window.scrollY < emailSection.offsetTop) {
          // Optionally show a subtle prompt
          console.log('Exit intent detected - consider showing modal');
        }
      }
    });
  }

  // ================================
  // 8. Analytics Helper Functions
  // ================================

  /**
   * Generic event tracking function
   * Works with both Google Analytics 4 and Facebook Pixel
   */
  function trackEvent(eventName, params = {}) {
    // Google Analytics 4
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }

    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('trackCustom', eventName, params);
    }

    // Console log for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Event tracked:', eventName, params);
    }
  }

  /**
   * Track page view (called automatically on load)
   */
  function trackPageView() {
    trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }

  // ================================
  // 9. Performance Monitoring
  // ================================

  function trackPerformance() {
    // Wait for page to fully load
    window.addEventListener('load', () => {
      // Use Performance API if available
      if ('performance' in window && 'getEntriesByType' in performance) {
        const perfData = performance.getEntriesByType('navigation')[0];

        if (perfData) {
          trackEvent('performance', {
            event_category: 'technical',
            dom_load_time: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
            page_load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            event_label: 'Page Performance'
          });
        }
      }

      // Track Core Web Vitals if available
      if ('PerformanceObserver' in window) {
        try {
          // Largest Contentful Paint (LCP)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            trackEvent('web_vitals_lcp', {
              event_category: 'technical',
              value: Math.round(lastEntry.renderTime || lastEntry.loadTime)
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              trackEvent('web_vitals_fid', {
                event_category: 'technical',
                value: Math.round(entry.processingStart - entry.startTime)
              });
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.log('Performance monitoring not fully supported');
        }
      }
    });
  }

  // ================================
  // 10. Lazy Loading Images (Fallback)
  // ================================

  function initLazyLoading() {
    // Native lazy loading is used in HTML, but add fallback for older browsers
    if ('loading' in HTMLImageElement.prototype) {
      return; // Native lazy loading is supported
    }

    // Fallback for older browsers
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // ================================
  // 11. Dark Mode Detection (Optional)
  // ================================

  function initDarkMode() {
    // Detect user's color scheme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      trackEvent('dark_mode_detected', {
        event_category: 'user_preference',
        event_label: 'Dark Mode Active'
      });
    }

    // Listen for changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const newColorScheme = e.matches ? 'dark' : 'light';
      trackEvent('color_scheme_change', {
        event_category: 'user_preference',
        event_label: newColorScheme
      });
    });
  }

  // ================================
  // 12. Initialize All Features
  // ================================

  function init() {
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }
  }

  function initializeApp() {
    // Initialize all features
    initSmoothScroll();
    initScrollAnimations();
    initPWAInstall();
    initCTATracking();
    initScrollDepthTracking();
    initSectionTracking();
    initExitIntent();
    initLazyLoading();
    initDarkMode();
    trackPerformance();
    trackPageView();

    console.log('Spendless landing page initialized');
  }

  // Start the app
  init();

})();
