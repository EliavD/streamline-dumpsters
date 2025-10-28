/**
 * Modal Loader Utility
 * Dynamically loads modal components into pages
 * Eliminates HTML duplication across multiple pages
 */

(function() {
  'use strict';


const log = console.log;
const warn = console.warn;
const error = console.error;
  /**
   * Loads an HTML component and injects it before a reference element
   * @param {string} componentPath - Path to the HTML component file
   * @param {string} referenceSelector - CSS selector for reference element
   * @returns {Promise<void>}
   */
  async function loadComponent(componentPath, referenceSelector) {
    try {
      const response = await fetch(componentPath);

      if (!response.ok) {
        throw new Error(`Failed to load ${componentPath}: ${response.statusText}`);
      }

      const html = await response.text();
      const referenceElement = document.querySelector(referenceSelector);

      if (!referenceElement) {
        warn(`Reference element "${referenceSelector}" not found for ${componentPath}`);
        // Fallback: append to body
        document.body.insertAdjacentHTML('beforeend', html);
        return;
      }

      referenceElement.insertAdjacentHTML('beforebegin', html);
      log(`✓ Loaded component: ${componentPath}`);

      // Verify it's in the DOM
      setTimeout(() => {
        if (componentPath.includes('booking-modal')) {
          const modal = document.getElementById('bookingModal');
          log(`  - Modal in DOM after insert:`, !!modal);
        }
      }, 10);

    } catch (err) {
      error(`Error loading component ${componentPath}:`, err);
    }
  }

  /**
   * Loads all required modals for the current page
   */
  async function loadModals() {
    // Look for bundled scripts or individual scripts
    const scripts = document.querySelector('script[src*="core.min.js"]') ||
                   document.querySelector('script[src*="features.min.js"]') ||
                   document.querySelector('script[src*="config.js"]') ||
                   document.querySelector('script[src*="bookNow.js"]') ||
                   document.querySelector('script[src*="index-main"]');

    if (!scripts) {
      warn('Modal loader: Could not find reference element for modal injection');
      return;
    }

    // Determine which modals to load based on page buttons
    const needsBookingModal = document.getElementById('openBookingModal');
    const needsJunkModal = document.getElementById('openJunkModal');

    const loadPromises = [];

    // Use bundled scripts or individual scripts as reference
    const referenceSelector = 'script[src*="features.min.js"], script[src*="core.min.js"], script[src*="config.js"], script[src*="bookNow.js"], script[src*="index-main"]';

    if (needsBookingModal) {
      loadPromises.push(loadComponent('components/booking-modal.html', referenceSelector));
    }

    if (needsJunkModal) {
      loadPromises.push(loadComponent('components/junk-modal.html', referenceSelector));
    }

    // Wait for all modals to load
    await Promise.all(loadPromises);

    log('📦 All modal components loaded, dispatching modalsLoaded event');
    log('  - bookingModal exists:', !!document.getElementById('bookingModal'));
    log('  - openBookingModal button exists:', !!document.getElementById('openBookingModal'));

    // Dispatch event to notify other scripts that modals are loaded
    document.dispatchEvent(new CustomEvent('modalsLoaded'));
  }

  // Load modals when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModals);
  } else {
    // DOM already loaded
    loadModals();
  }

})();
