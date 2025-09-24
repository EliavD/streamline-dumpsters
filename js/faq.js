/*
================================================================================
FAQ.JS - Streamline Dumpsters Ltd. FAQ Accordion Functionality
================================================================================

PURPOSE:
Handles interactive accordion functionality for the FAQ page, including smooth
expand/collapse animations, keyboard navigation, and accessibility features.

FUNCTIONALITY:
- Toggle FAQ answers on question click
- Smooth expand/collapse animations
- Keyboard navigation support (Enter, Space, Arrow keys)
- ARIA attribute management for accessibility
- Close other panels when opening new one (optional accordion behavior)
- Focus management for screen readers

ACCESSIBILITY:
- Proper ARIA state management (aria-expanded, aria-hidden)
- Keyboard navigation support
- Screen reader announcements
- Focus management on expand/collapse
- Reduced motion support

BROWSER SUPPORT:
- Modern browsers (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)
- Graceful degradation for older browsers
================================================================================
*/

document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const config = {
        closeOthersOnOpen: false, // Set to true for traditional accordion behavior
        animationDuration: 300, // Should match CSS transition duration
        enableKeyboardNavigation: true,
        announceStateChanges: true
    };

    // Get all FAQ elements
    const faqQuestions = document.querySelectorAll('.faq-question');
    const faqAnswers = document.querySelectorAll('.faq-answer');

    // Verify elements exist
    if (faqQuestions.length === 0) {
        console.log('FAQ: No question elements found');
        return;
    }

    // Initialize FAQ accordion
    initializeFAQ();

    /**
     * Initialize the FAQ accordion functionality
     */
    function initializeFAQ() {
        // Set up click listeners for each question
        faqQuestions.forEach((question, index) => {
            // Add click event listener
            question.addEventListener('click', function(e) {
                e.preventDefault();
                toggleFAQItem(question, index);
            });

            // Add keyboard event listeners
            if (config.enableKeyboardNavigation) {
                question.addEventListener('keydown', function(e) {
                    handleKeyboardNavigation(e, question, index);
                });
            }

            // Ensure proper initial ARIA states
            setupInitialAriaStates(question, index);
        });

        console.log(`FAQ: Initialized ${faqQuestions.length} accordion items`);
    }

    /**
     * Set up initial ARIA states for accessibility
     * @param {Element} question - The question button element
     * @param {number} index - The index of the FAQ item
     */
    function setupInitialAriaStates(question, index) {
        const answer = document.getElementById(question.getAttribute('aria-controls'));

        if (answer) {
            // Ensure question has proper attributes
            if (!question.hasAttribute('aria-expanded')) {
                question.setAttribute('aria-expanded', 'false');
            }

            // Ensure answer has proper attributes
            if (!answer.hasAttribute('aria-hidden')) {
                answer.setAttribute('aria-hidden', 'true');
            }

            // Add tabindex for keyboard navigation
            question.setAttribute('tabindex', '0');
        }
    }

    /**
     * Toggle an FAQ item open or closed
     * @param {Element} question - The clicked question button
     * @param {number} index - The index of the FAQ item
     */
    function toggleFAQItem(question, index) {
        const answerId = question.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);

        if (!answer) {
            console.warn(`FAQ: Answer element with id "${answerId}" not found`);
            return;
        }

        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        const newExpandedState = !isExpanded;

        // Close other items if configured to do so
        if (config.closeOthersOnOpen && newExpandedState) {
            closeAllFAQItems(index);
        }

        // Toggle current item
        setFAQItemState(question, answer, newExpandedState);

        // Announce state change to screen readers
        if (config.announceStateChanges) {
            announceStateChange(question, newExpandedState);
        }

        // Log action for debugging
        console.log(`FAQ: ${newExpandedState ? 'Opened' : 'Closed'} item ${index + 1}`);
    }

    /**
     * Set the state of an FAQ item (open or closed)
     * @param {Element} question - The question button element
     * @param {Element} answer - The answer content element
     * @param {boolean} isExpanded - Whether the item should be expanded
     */
    function setFAQItemState(question, answer, isExpanded) {
        // Update ARIA attributes
        question.setAttribute('aria-expanded', isExpanded.toString());
        answer.setAttribute('aria-hidden', (!isExpanded).toString());

        // Add/remove expanded class for CSS styling
        if (isExpanded) {
            question.classList.add('expanded');
            answer.classList.add('expanded');
        } else {
            question.classList.remove('expanded');
            answer.classList.remove('expanded');
        }

        // Handle focus management
        if (isExpanded) {
            // Keep focus on the question button when opening
            question.focus();
        }
    }

    /**
     * Close all FAQ items except the specified index
     * @param {number} excludeIndex - Index of item to keep open (optional)
     */
    function closeAllFAQItems(excludeIndex = -1) {
        faqQuestions.forEach((question, index) => {
            if (index !== excludeIndex) {
                const answerId = question.getAttribute('aria-controls');
                const answer = document.getElementById(answerId);

                if (answer) {
                    setFAQItemState(question, answer, false);
                }
            }
        });
    }

    /**
     * Handle keyboard navigation for accessibility
     * @param {KeyboardEvent} e - The keyboard event
     * @param {Element} question - The current question element
     * @param {number} index - The index of the current FAQ item
     */
    function handleKeyboardNavigation(e, question, index) {
        switch (e.key) {
            case 'Enter':
            case ' ': // Space key
                e.preventDefault();
                toggleFAQItem(question, index);
                break;

            case 'ArrowDown':
                e.preventDefault();
                focusNextFAQItem(index);
                break;

            case 'ArrowUp':
                e.preventDefault();
                focusPreviousFAQItem(index);
                break;

            case 'Home':
                e.preventDefault();
                focusFAQItem(0);
                break;

            case 'End':
                e.preventDefault();
                focusFAQItem(faqQuestions.length - 1);
                break;

            case 'Escape':
                // Close current item if open
                const isExpanded = question.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    e.preventDefault();
                    toggleFAQItem(question, index);
                }
                break;

            default:
                // No action for other keys
                break;
        }
    }

    /**
     * Focus the next FAQ item in the list
     * @param {number} currentIndex - Current item index
     */
    function focusNextFAQItem(currentIndex) {
        const nextIndex = (currentIndex + 1) % faqQuestions.length;
        focusFAQItem(nextIndex);
    }

    /**
     * Focus the previous FAQ item in the list
     * @param {number} currentIndex - Current item index
     */
    function focusPreviousFAQItem(currentIndex) {
        const prevIndex = currentIndex === 0 ? faqQuestions.length - 1 : currentIndex - 1;
        focusFAQItem(prevIndex);
    }

    /**
     * Focus a specific FAQ item by index
     * @param {number} index - Index of item to focus
     */
    function focusFAQItem(index) {
        if (index >= 0 && index < faqQuestions.length) {
            faqQuestions[index].focus();
        }
    }

    /**
     * Announce state changes to screen readers
     * @param {Element} question - The question element
     * @param {boolean} isExpanded - Whether the item is now expanded
     */
    function announceStateChange(question, isExpanded) {
        const questionText = question.textContent.replace(/\s+/g, ' ').trim();
        const action = isExpanded ? 'expanded' : 'collapsed';

        // Create a temporary announcement element
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';

        // Set the announcement text
        announcement.textContent = `FAQ item "${questionText}" ${action}`;

        // Add to DOM, then remove after announcement
        document.body.appendChild(announcement);

        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Handle window resize events
     */
    function handleResize() {
        // Recalculate any dynamic heights if needed
        // This is a placeholder for potential future responsive adjustments
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Expose public API for debugging
    if (window.DEBUG) {
        window.faq = {
            toggleItem: (index) => {
                if (index >= 0 && index < faqQuestions.length) {
                    toggleFAQItem(faqQuestions[index], index);
                }
            },
            closeAll: () => closeAllFAQItems(),
            openAll: () => {
                faqQuestions.forEach((question, index) => {
                    const answerId = question.getAttribute('aria-controls');
                    const answer = document.getElementById(answerId);
                    if (answer) {
                        setFAQItemState(question, answer, true);
                    }
                });
            },
            getState: () => {
                return Array.from(faqQuestions).map((question, index) => ({
                    index,
                    question: question.textContent.trim(),
                    expanded: question.getAttribute('aria-expanded') === 'true'
                }));
            }
        };
    }

    console.log('✓ FAQ accordion functionality initialized');
});