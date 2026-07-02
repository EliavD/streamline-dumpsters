/* commercial.js v5 — Commercial Dumpster Program page scripts */

const APPLY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwBwz3OWB1uabgTJabPCSHDQW8LeaAnXAj6yQNBYj8JldOZJsywuBZ_i4GrYXNhFDTo/exec';

document.addEventListener('DOMContentLoaded', function () {

    // --- Apply form ---
    var applyForm   = document.getElementById('contractorApplyForm');
    var applyStatus = document.getElementById('contractor-form-status');

    if (applyForm) {

        // Mark fields as touched on blur so validation styling only appears after interaction
        applyForm.querySelectorAll('input, select, textarea').forEach(function (field) {
            field.addEventListener('blur', function () {
                field.closest('.form-group').classList.add('touched');
            });
        });

        applyForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            applyForm.classList.add('was-validated');

            // Collect only apply-form fields by name (sign-in card is not inside this form)
            var els = applyForm.elements;
            var data = {
                businessName: (els.businessName || {}).value || '',
                contactName:  (els.contactName  || {}).value || '',
                email:        (els.email        || {}).value || '',
                phone:        (els.phone        || {}).value || '',
                address:      (els.address      || {}).value || '',
                size:         (els.size         || {}).value || '',
                frequency:    (els.frequency    || {}).value || '',
                notes:        (els.notes        || {}).value || '',
            };

            if (!data.email || !data.phone) {
                showStatus('Please fill in your email and phone number.', 'error');
                return;
            }

            var submitBtn = applyForm.querySelector('button[type="submit"]');
            setSubmitting(submitBtn, true);
            showStatus('Submitting your application…', 'loading');

            try {
                var response = await fetch(APPLY_ENDPOINT, {
                    method:   'POST',
                    headers:  { 'Content-Type': 'text/plain' },
                    body:     JSON.stringify(data),
                    redirect: 'follow'
                });

                var result;
                try { result = await response.json(); } catch (_) { result = {}; }

                if (result.result === 'success' || response.ok || response.status === 0) {
                    showStatus("Thanks — application received! We'll be in touch shortly.", "success");
                    applyForm.reset();
                    applyForm.classList.remove('was-validated');
                    applyForm.querySelectorAll('.form-group').forEach(function (g) {
                        g.classList.remove('touched');
                    });

                    // Analytics
                    if (window.dataLayer) {
                        window.dataLayer.push({ event: 'contractor_application_submitted' });
                    }
                    if (typeof gtag === 'function') {
                        gtag('event', 'contractor_application_submitted');
                    }
                } else {
                    throw new Error('Unexpected server response');
                }
            } catch (err) {
                var msg = 'Something went wrong — please try again or call (614) 636-2343.';
                if (err.name === 'AbortError') {
                    msg = 'Request timed out. Please check your connection and try again.';
                }
                showStatus(msg, 'error');
            } finally {
                setSubmitting(submitBtn, false);
            }
        });
    }

    function showStatus(message, type) {
        if (!applyStatus) return;
        applyStatus.className = 'form-message ' + type;
        applyStatus.textContent = message;
    }

    function setSubmitting(btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        btn.textContent = loading ? 'Submitting…' : 'Apply to join';
    }

    // --- Who it's for: flip tiles on click ---
    document.querySelectorAll('.ctr-who__tile').forEach(function (tile) {
        tile.addEventListener('click', function () {
            var flipped = tile.classList.toggle('flipped');
            tile.setAttribute('aria-expanded', flipped ? 'true' : 'false');
        });
    });

    // --- Photo carousel prev/next ---
    var track = document.getElementById('ctr-carousel-track');
    if (track) {
        var prevBtn = track.closest('.ctr-carousel__wrapper').querySelector('.ctr-carousel__btn--prev');
        var nextBtn = track.closest('.ctr-carousel__wrapper').querySelector('.ctr-carousel__btn--next');
        var slideWidth = function () {
            var slide = track.querySelector('.ctr-carousel__slide');
            return slide ? slide.offsetWidth + 12 : 332;
        };
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                track.scrollBy({ left: -slideWidth(), behavior: 'smooth' });
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                track.scrollBy({ left: slideWidth(), behavior: 'smooth' });
            });
        }
    }

    // --- Sign-in card now links straight to /portal (no JS needed). ---

});
