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
        this.cardWidth = this.getCardWidth(); // Dynamic card width + gap
        this.cardsPerView = this.getCardsPerView();
        this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
        this.autoPlayInterval = null;
        this.autoPlayDelay = 6000; // Slower: 6 seconds instead of 4
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
        // Wait for layout to settle before initializing
        setTimeout(() => {
            this.cardWidth = this.getCardWidth();
            this.cardsPerView = this.getCardsPerView();
            this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);

            // Debug info for mobile
            if (window.innerWidth <= 480) {
                console.log('Mobile carousel init:', {
                    cardWidth: this.cardWidth,
                    cardsPerView: this.cardsPerView,
                    maxIndex: this.maxIndex,
                    totalCards: this.cards.length
                });
            }

            this.createIndicators();
            this.updateCarouselView();
            this.attachEventListeners();
            this.startAutoPlay();
        }, 200); // Increased timeout for better layout settling
    }

    getCardWidth() {
        // Calculate actual card width including gap
        if (this.cards.length > 0) {
            const card = this.cards[0];
            const cardRect = card.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(this.track);
            const gap = parseInt(computedStyle.gap) || 16;
            return cardRect.width + gap;
        }

        // Fallback values based on screen size
        if (window.innerWidth <= 480) return 166; // 150px + 16px gap
        if (window.innerWidth <= 768) return 196; // 180px + 16px gap
        return 216; // 200px + 16px gap
    }

    getCardsPerView() {
        const containerWidth = this.carousel.querySelector('.carousel-container').clientWidth;
        const padding = window.innerWidth <= 480 ? 90 : (window.innerWidth <= 768 ? 100 : 120); // Account for nav buttons
        const availableWidth = containerWidth - padding;

        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1024) return 3;
        return Math.floor(availableWidth / this.cardWidth);
    }

    createIndicators() {
        this.indicatorsContainer.innerHTML = '';
        const totalSlides = this.maxIndex + 1;

        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-indicator');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(dot);
        }
    }

    updateCarouselView() {
        // Update transform
        const offset = -this.currentIndex * this.cardWidth;
        this.track.style.transform = `translateX(${offset}px)`;

        // Navigation buttons always enabled for infinite loop
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;

        // Update indicators
        const dots = this.indicatorsContainer.querySelectorAll('.carousel-indicator');
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
        this.currentIndex++;
        if (this.currentIndex > this.maxIndex) {
            this.currentIndex = 0; // Loop back to start
        }
        this.updateCarouselView();
    }

    prevSlide() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
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

        // Window resize handler with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
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
        // Recalculate card width, cards per view and max index
        this.cardWidth = this.getCardWidth();
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
        } else {
            // Even if cards per view didn't change, card width might have
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

/**
 * ================================================================================
 * GALLERY CAROUSEL
 * Service Gallery Photo Carousel on Service Area Page
 * ================================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.gallery-track');
  const items = document.querySelectorAll('.gallery-item');
  const prevButton = document.querySelector('.gallery-nav-prev');
  const nextButton = document.querySelector('.gallery-nav-next');
  const dotsContainer = document.getElementById('galleryDots');

  if (!track || !items.length) return;

  let currentIndex = 0;
  const totalItems = items.length;

  // Create dots
  function createDots() {
    for (let i = 0; i < totalItems; i++) {
      const dot = document.createElement('button');
      dot.classList.add('gallery-dot');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === 0) dot.classList.add('active');

      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  // Update dots
  function updateDots() {
    const dots = document.querySelectorAll('.gallery-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  // Go to specific slide
  function goToSlide(index) {
    currentIndex = index;
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
    updateDots();
  }

  // Next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalItems;
    goToSlide(currentIndex);
  }

  // Previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    goToSlide(currentIndex);
  }

  // Event listeners
  if (nextButton) nextButton.addEventListener('click', nextSlide);
  if (prevButton) prevButton.addEventListener('click', prevSlide);

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });

  // Touch/Swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].clientX;
    isSwiping = true;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchmove', function(e) {
    if (!isSwiping) return;
    touchEndX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', function(e) {
    if (!isSwiping) return;
    isSwiping = false;
    handleSwipe();
    startAutoplay();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX = 0;
    touchEndX = 0;
  }

  // Auto-play (optional - 5 second interval)
  let autoplayInterval = setInterval(nextSlide, 5000);

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  // Pause on hover
  const galleryWrapper = document.querySelector('.gallery-carousel-wrapper');
  if (galleryWrapper) {
    galleryWrapper.addEventListener('mouseenter', stopAutoplay);
    galleryWrapper.addEventListener('mouseleave', startAutoplay);
  }

  // Initialize
  createDots();
});