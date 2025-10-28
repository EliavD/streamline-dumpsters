/*
================================================================================
REVIEWS.JS - Streamline Dumpsters Ltd. Customer Reviews
================================================================================

PURPOSE:
Manages customer review display and Google Reviews API integration via backend proxy.
Handles fetching, displaying, and carousel navigation for customer testimonials.

SECURITY NOTE:
This script uses a backend proxy (/api/reviews) to securely fetch Google Reviews
without exposing API keys to the frontend.
================================================================================
*/

document.addEventListener('DOMContentLoaded', function() {
    const reviewsGrid = document.querySelector('.reviews-grid');
    const leftBtn = document.querySelector('.carousel-btn-left');
    const rightBtn = document.querySelector('.carousel-btn-right');

    if (!reviewsGrid) {
        console.log('Reviews grid not found');
        return;
    }

    // Configuration
    const config = {
        autoScrollDelay: 8000, // 8 seconds per review set
        animationDuration: 500, // 0.5 seconds for slide transition
        reviewsPerView: {
            mobile: 1,
            tablet: 2,
            desktop: 3
        }
    };

    // State management
    let reviews = [];
    let currentIndex = 0;
    let autoScrollInterval;
    let reviewsPerView = 1;

    // Real Google reviews (manually updated)
    const fallbackReviews = [
        {
            author_name: "Dan Gore",
            rating: 5,
            text: "We had a great experience - Responsive, On time, easy to work with.",
            time: new Date('2025-08-20').getTime()
        },
        {
            author_name: "Nick Fire",
            rating: 5,
            text: "Amazing service! Thank you very much",
            time: new Date('2025-06-26').getTime()
        },
        {
            author_name: "Rebecca Levings",
            rating: 5,
            text: "Eli was very helpful explaining the dumpster process to me. Very pr...",
            time: new Date('2025-06-25').getTime()
        }
    ];

    // Initialize reviews system
    function init() {
        updateReviewsPerView();
        setupEventListeners();

        // Clear old cache on init to force fresh fetch (comment out after first load)
        // localStorage.removeItem('streamline_reviews');

        loadReviews();

        console.log('Reviews system initialized');
    }

    // Update reviews per view based on screen size
    function updateReviewsPerView() {
        const width = window.innerWidth;
        if (width >= 768) {
            // Desktop: show all 3, no carousel
            reviewsPerView = 3;
        } else {
            // Mobile: show 1 at a time with carousel
            reviewsPerView = 1;
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                prevReviews();
                resetAutoScroll();
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                nextReviews();
                resetAutoScroll();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!reviewsGrid.contains(document.activeElement)) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    prevReviews();
                    resetAutoScroll();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextReviews();
                    resetAutoScroll();
                    break;
            }
        });

        // Pause auto-scroll on hover
        if (reviewsGrid) {
            reviewsGrid.addEventListener('mouseenter', pauseAutoScroll);
            reviewsGrid.addEventListener('mouseleave', startAutoScroll);
        }

        // Handle resize
        window.addEventListener('resize', () => {
            updateReviewsPerView();
            updateCarouselPosition();
        });

        // Pause when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAutoScroll();
            } else {
                startAutoScroll();
            }
        });
    }

    // Load reviews - using manual reviews (no API needed)
    function loadReviews() {
        // Use the manually curated reviews
        reviews = fallbackReviews;
        displayReviews();
        startAutoScroll();
        console.log(`Loaded ${reviews.length} reviews from manual data`);
    }

    // Filter and sort reviews
    function filterAndSortReviews(rawReviews) {
        return rawReviews
            .filter(review => review.text && review.text.length > 20) // Only reviews with text
            .filter(review => review.rating >= 4) // Only 4+ star reviews
            .sort((a, b) => b.time - a.time) // Sort by most recent
            .slice(0, 10); // Limit to 10 reviews
    }

    // Cache reviews in localStorage
    function cacheReviews(reviewsData) {
        try {
            const cacheData = {
                reviews: reviewsData,
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            localStorage.setItem('streamline_reviews', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache reviews:', error);
        }
    }

    // Get cached reviews
    function getCachedReviews() {
        try {
            const cached = localStorage.getItem('streamline_reviews');
            if (!cached) return null;

            const data = JSON.parse(cached);
            if (Date.now() > data.expires) {
                localStorage.removeItem('streamline_reviews');
                return null;
            }

            return data.reviews;
        } catch (error) {
            console.warn('Failed to load cached reviews:', error);
            return null;
        }
    }

    // Display reviews in the carousel
    function displayReviews() {
        if (!reviews || reviews.length === 0) return;

        reviewsGrid.innerHTML = reviews.map(review => createReviewCard(review)).join('');
        updateCarouselPosition();
        updateNavigationButtons();
    }

    // Create a single review card
    function createReviewCard(review) {
        const stars = generateStarRating(review.rating);
        const timeAgo = formatTimeAgo(review.time);
        const truncatedText = review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text;
        const initial = review.author_name.charAt(0).toUpperCase();
        const googleMapsUrl = 'https://maps.app.goo.gl/pGpHk9GPgeypMW2z7';

        return `
            <div class="review-card">
                <div class="review-rating">
                    ${stars}
                </div>
                <p class="review-text">"${escapeHtml(truncatedText)}"</p>
                <a href="${googleMapsUrl}" class="review-link" target="_blank" rel="noopener noreferrer">Read full review ›</a>
                <div class="review-author">
                    <div class="author-img">${initial}</div>
                    <div class="author-info">
                        <p class="author-name">${escapeHtml(review.author_name)}</p>
                        <p class="author-source"><a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${timeAgo}</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate star rating HTML
    function generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<span class="star">⭐</span>';
        }

        if (hasHalfStar) {
            stars += '<span class="star">⭐</span>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<span class="star" style="opacity: 0.3;">⭐</span>';
        }

        return stars;
    }

    // Format time ago
    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        if (days < 60) return '1 month ago';
        return `${Math.floor(days / 30)} months ago`;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Navigate to previous reviews
    function prevReviews() {
        if (reviews.length <= reviewsPerView) return;

        currentIndex = currentIndex > 0 ? currentIndex - 1 : Math.max(0, reviews.length - reviewsPerView);
        updateCarouselPosition();
        updateNavigationButtons();
    }

    // Navigate to next reviews
    function nextReviews() {
        if (reviews.length <= reviewsPerView) return;

        const maxIndex = Math.max(0, reviews.length - reviewsPerView);
        currentIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        updateCarouselPosition();
        updateNavigationButtons();
    }

    // Update carousel position
    function updateCarouselPosition() {
        const reviewCards = reviewsGrid.querySelectorAll('.review-card');
        if (reviewCards.length === 0) return;

        const cardWidth = reviewCards[0].offsetWidth;
        const gap = 32; // 2rem gap
        const offset = -(currentIndex * (cardWidth + gap));

        reviewsGrid.style.transform = `translateX(${offset}px)`;
    }

    // Update navigation button states
    function updateNavigationButtons() {
        if (!leftBtn || !rightBtn) return;

        const maxIndex = Math.max(0, reviews.length - reviewsPerView);

        leftBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        rightBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';

        leftBtn.disabled = currentIndex === 0;
        rightBtn.disabled = currentIndex >= maxIndex;

        updateNavigationDots();
    }

    // Create and update navigation dots
    function updateNavigationDots() {
        const dotsContainer = document.getElementById('reviewDots');
        if (!dotsContainer || reviews.length <= reviewsPerView) return;

        const totalPages = Math.ceil(reviews.length / reviewsPerView);
        const currentPage = Math.floor(currentIndex / reviewsPerView);

        // Create dots if they don't exist
        if (dotsContainer.children.length !== totalPages) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Go to page ${i + 1}`);
                dot.addEventListener('click', () => {
                    currentIndex = i * reviewsPerView;
                    updateCarouselPosition();
                    updateNavigationButtons();
                    resetAutoScroll();
                });
                dotsContainer.appendChild(dot);
            }
        }

        // Update active state
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentPage);
        });
    }

    // Start auto-scroll (only on mobile)
    function startAutoScroll() {
        if (reviews.length <= reviewsPerView) return;
        if (window.innerWidth >= 768) return; // No auto-scroll on desktop

        clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            nextReviews();
        }, config.autoScrollDelay);
    }

    // Pause auto-scroll
    function pauseAutoScroll() {
        clearInterval(autoScrollInterval);
    }

    // Reset auto-scroll timer
    function resetAutoScroll() {
        pauseAutoScroll();
        setTimeout(startAutoScroll, 2000); // Resume after 2 seconds
    }

    // Initialize the reviews system
    init();

    // Expose public API for debugging
    if (window.DEBUG) {
        window.reviewsCarousel = {
            nextReviews,
            prevReviews,
            getCurrentIndex: () => currentIndex,
            getReviews: () => reviews,
            getReviewsPerView: () => reviewsPerView,
            reloadReviews: loadReviews
        };
    }
});