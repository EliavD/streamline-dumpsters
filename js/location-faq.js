/**
 * ============================================================================
 * LOCATION FAQ ACCORDION - Streamline Dumpsters Ltd.
 * ============================================================================
 *
 * Handles FAQ accordion functionality for location pages
 * - Smooth expand/collapse animations
 * - Keyboard accessibility
 * - ARIA attributes
 * - Single active item (closes others when opening)
 *
 * Author: Streamline Dumpsters Ltd.
 * Updated: 2024
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all FAQ buttons
    const faqButtons = document.querySelectorAll('.faq-question');

    if (faqButtons.length === 0) return;

    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const answer = document.getElementById(this.getAttribute('aria-controls'));
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Close all other FAQs
            faqButtons.forEach(otherButton => {
                if (otherButton !== this) {
                    otherButton.setAttribute('aria-expanded', 'false');
                    const otherAnswer = document.getElementById(otherButton.getAttribute('aria-controls'));
                    if (otherAnswer) {
                        otherAnswer.setAttribute('aria-hidden', 'true');
                    }
                }
            });

            // Toggle current FAQ
            this.setAttribute('aria-expanded', !isExpanded);
            answer.setAttribute('aria-hidden', isExpanded);
        });

        // Keyboard navigation
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});
