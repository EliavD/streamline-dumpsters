/**
 * Service Area Location Carousel
 * Interactive carousel for displaying service locations with touch support
 */

class LocationCarousel {
    constructor(carouselElement) {
        this.carousel = carouselElement;
        this.track = this.carousel.querySelector('#carouselTrack');
        this.cards = [...this.carousel.querySelectorAll('.location-card')];
        this.prevBtn = this.carousel.querySelector('#carouselPrev');
        this.nextBtn = this.carousel.querySelector('#carouselNext');
        this.indicatorsContainer = this.carousel.querySelector('#carouselIndicators');

        this.currentIndex = 0;
        this.cardWidth = 220; // Card width + gap
        this.cardsPerView = this.getCardsPerView();
        this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
        this.autoPlayInterval = null;
        this.autoPlayDelay = 4000;
        this.isAutoPlaying = true;

        // Touch/swipe properties
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDragging = false;
        this.startTime = 0;
        this.minSwipeDistance = 50;

        this.init();
    }

    init() {
        this.createIndicators();
        this.updateCarouselView();
        this.attachEventListeners();
        this.handleResize();
        this.startAutoPlay();
    }

    getCardsPerView() {
        const containerWidth = this.carousel.querySelector('.carousel-container').clientWidth;
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1024) return 3;
        return Math.floor(containerWidth / this.cardWidth);
    }

    createIndicators() {
        this.indicatorsContainer.innerHTML = '';
        const totalSlides = this.maxIndex + 1;

        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(dot);
        }
    }

    updateCarouselView() {
        // Update transform
        const offset = -this.currentIndex * this.cardWidth;
        this.track.style.transform = `translateX(${offset}px)`;

        // Update navigation buttons
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex >= this.maxIndex;

        // Update indicators
        const dots = this.indicatorsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        // Update ARIA live region for screen readers
        this.announceSlide();
    }

    announceSlide() {
        const currentCard = this.cards[this.currentIndex];
        if (currentCard) {
            const cardTitle = currentCard.querySelector('h3').textContent;
            const announcement = `Showing ${cardTitle}, slide ${this.currentIndex + 1} of ${this.maxIndex + 1}`;

            // Create or update aria-live region
            let liveRegion = document.querySelector('#carousel-live-region');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'carousel-live-region';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.style.position = 'absolute';
                liveRegion.style.left = '-10000px';
                liveRegion.style.width = '1px';
                liveRegion.style.height = '1px';
                liveRegion.style.overflow = 'hidden';
                document.body.appendChild(liveRegion);
            }

            liveRegion.textContent = announcement;
        }
    }

    goToSlide(index) {
        if (index < 0 || index > this.maxIndex) return;

        this.currentIndex = index;
        this.updateCarouselView();
        this.resetAutoPlay();
    }

    nextSlide() {
        if (this.currentIndex < this.maxIndex) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0; // Loop back to start
        }
        this.updateCarouselView();
    }

    prevSlide() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.maxIndex; // Loop to end
        }
        this.updateCarouselView();
    }

    startAutoPlay() {
        if (!this.isAutoPlaying) return;

        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        if (this.isAutoPlaying) {
            setTimeout(() => this.startAutoPlay(), 1000); // Resume after 1 second
        }
    }

    attachEventListeners() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.prevSlide();
            this.resetAutoPlay();
        });

        this.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.nextSlide();
            this.resetAutoPlay();
        });

        // Keyboard navigation
        this.carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
                this.resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
                this.resetAutoPlay();
            }
        });

        // Touch events for swipe
        this.track.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: true });

        this.track.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        this.track.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: true });

        // Mouse events for drag (desktop)
        this.track.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });

        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });

        // Pause auto-play on hover
        this.carousel.addEventListener('mouseenter', () => {
            this.stopAutoPlay();
        });

        this.carousel.addEventListener('mouseleave', () => {
            if (this.isAutoPlaying) {
                this.startAutoPlay();
            }
        });

        // Pause auto-play when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoPlay();
            } else if (this.isAutoPlaying) {
                this.startAutoPlay();
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.startTime = Date.now();
        this.isDragging = true;
        this.stopAutoPlay();
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;

        // Prevent vertical scrolling during horizontal swipe
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaX = Math.abs(touchX - this.touchStartX);
        const deltaY = Math.abs(touchY - (e.touches[0].clientY || touchY));

        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;

        this.touchEndX = e.changedTouches[0].clientX;
        this.handleSwipe();
        this.isDragging = false;
        this.resetAutoPlay();
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.touchStartX = e.clientX;
        this.startTime = Date.now();
        this.isDragging = true;
        this.stopAutoPlay();
        this.track.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.touchEndX = e.clientX;
        this.handleSwipe();
        this.isDragging = false;
        this.resetAutoPlay();
        this.track.style.cursor = 'grab';
    }

    handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const swipeTime = Date.now() - this.startTime;
        const velocity = Math.abs(swipeDistance) / swipeTime;

        // Minimum swipe distance or sufficient velocity
        if (Math.abs(swipeDistance) > this.minSwipeDistance || velocity > 0.5) {
            if (swipeDistance > 0) {
                this.prevSlide();
            } else {
                this.nextSlide();
            }
        }
    }

    handleResize() {
        // Recalculate cards per view and max index
        const newCardsPerView = this.getCardsPerView();
        const newMaxIndex = Math.max(0, this.cards.length - newCardsPerView);

        if (newCardsPerView !== this.cardsPerView) {
            this.cardsPerView = newCardsPerView;
            this.maxIndex = newMaxIndex;

            // Adjust current index if necessary
            if (this.currentIndex > this.maxIndex) {
                this.currentIndex = this.maxIndex;
            }

            this.createIndicators();
            this.updateCarouselView();
        }
    }

    destroy() {
        this.stopAutoPlay();

        // Remove event listeners
        this.prevBtn.removeEventListener('click', this.prevSlide);
        this.nextBtn.removeEventListener('click', this.nextSlide);

        // Clean up DOM
        const liveRegion = document.querySelector('#carousel-live-region');
        if (liveRegion) {
            liveRegion.remove();
        }
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const carouselElement = document.querySelector('#locationCarousel');
    if (carouselElement) {
        new LocationCarousel(carouselElement);
    }
});

// Handle reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Disable auto-play for users who prefer reduced motion
    document.addEventListener('DOMContentLoaded', function() {
        const carousel = document.querySelector('#locationCarousel');
        if (carousel && carousel.carouselInstance) {
            carousel.carouselInstance.isAutoPlaying = false;
            carousel.carouselInstance.stopAutoPlay();
        }
    });
}