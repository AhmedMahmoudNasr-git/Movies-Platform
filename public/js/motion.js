/**
 * MoviesHub - Dynamic Modern Motion System
 * Unified, performant, accessible animation engine with 3D Interactive Card Tilt.
 */

(function () {
    'use strict';

    // 1. Motion Tokens
    const MOTION_TOKENS = {
        PRIMARY_EASING: 'cubic-bezier(0.22, 1, 0.36, 1)',
        FAST_DURATION: 280,
        NORMAL_DURATION: 450,
        SLOW_DURATION: 700,
        STAGGER_DELAY: 80,
        MAGNETIC_MAX_OFFSET: 8
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 2. Initialize Page Reveal
    function initPageTransition() {
        if (prefersReducedMotion) return;
        document.body.classList.add('page-entering');
        requestAnimationFrame(() => {
            document.body.classList.add('page-entered');
        });
    }

    // 3. Navbar Motion
    function initNavbarMotion() {
        const navbar = document.querySelector('.navbar-custom');
        if (!navbar) return;

        const onScroll = () => {
            if (window.scrollY > 40) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // 4. Staggered Scroll Reveal for Cards and Sections
    function initScrollReveals() {
        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal-on-scroll, .movie-card, .controls-card, .page-header').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        const revealElements = document.querySelectorAll(
            '.page-header, .controls-card, .movie-card, .card-dark, .list-group-item'
        );

        if (!('IntersectionObserver' in window)) {
            revealElements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const parent = el.parentElement;
                    if (parent && parent.children) {
                        const index = Array.from(parent.children).indexOf(el);
                        const delay = (index % 6) * MOTION_TOKENS.STAGGER_DELAY;
                        el.style.transitionDelay = `${delay}ms`;
                    }
                    el.classList.add('revealed');
                    obs.unobserve(el);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => {
            el.classList.add('reveal-item');
            observer.observe(el);
        });
    }

    // 5. 3D Interactive Edge Tilt for Movie Cards (Apple TV / Luxury 3D Parallax)
    function init3DCardTilt() {
        if (prefersReducedMotion || isTouchDevice) return;

        const cards = document.querySelectorAll('.movie-card');

        cards.forEach(card => {
            let rafId = null;

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, border-color 0.2s ease';
            });

            card.addEventListener('mousemove', (e) => {
                if (rafId) cancelAnimationFrame(rafId);

                rafId = requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rotateX = ((y - centerY) / centerY) * -4;
                    const rotateY = ((x - centerX) / centerX) * 4;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.01)`;

                    // Dynamic light reflection overlay
                    const glare = card.querySelector('.card-glare');
                    if (glare) {
                        const percentX = (x / rect.width) * 100;
                        const percentY = (y / rect.height) * 100;
                        glare.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(124, 58, 237, 0.16) 0%, rgba(37, 99, 235, 0.08) 35%, transparent 75%)`;
                        glare.style.opacity = '0.65';
                    }
                });
            });

            card.addEventListener('mouseleave', () => {
                if (rafId) cancelAnimationFrame(rafId);
                card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.3s ease';
                card.style.transform = '';
                const glare = card.querySelector('.card-glare');
                if (glare) {
                    glare.style.opacity = '0';
                }
            });
        });
    }

    // 6. Magnetic CTA Buttons
    function initMagneticButtons() {
        if (prefersReducedMotion || isTouchDevice) return;

        const magneticButtons = document.querySelectorAll('.btn-primary-custom, .search-submit-btn, .search-neon-btn');

        magneticButtons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const btnCenterX = rect.left + rect.width / 2;
                const btnCenterY = rect.top + rect.height / 2;

                const deltaX = (e.clientX - btnCenterX) * 0.22;
                const deltaY = (e.clientY - btnCenterY) * 0.22;

                const max = MOTION_TOKENS.MAGNETIC_MAX_OFFSET;
                const clampedX = Math.max(-max, Math.min(max, deltaX));
                const clampedY = Math.max(-max, Math.min(max, deltaY));

                btn.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0) scale(1.03)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // 7. Interactive Button Ripples
    function initButtonRipples() {
        document.querySelectorAll('.btn, .btn-custom, .btn-tag').forEach(btn => {
            btn.addEventListener('mousedown', () => {
                if (!prefersReducedMotion) {
                    btn.classList.add('btn-pressed');
                }
            });
            ['mouseup', 'mouseleave'].forEach(evt => {
                btn.addEventListener(evt, () => btn.classList.remove('btn-pressed'));
            });
        });
    }

    // 8. Preserve the exact listing URL and scroll position when opening a movie
    function initMovieNavigation() {
        const scrollStorageKey = 'moviesHub:returnScroll';

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;

            const link = event.target.closest('a[data-movie-navigation]');
            if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const target = new URL(link.href, window.location.href);
            if (target.origin !== window.location.origin) return;

            target.searchParams.set('returnTo', `${window.location.pathname}${window.location.search}${window.location.hash}`);
            target.searchParams.set('returnScroll', String(window.scrollY));
            link.href = `${target.pathname}${target.search}${target.hash}`;
        });

        const returnLink = document.querySelector('[data-movie-return]');
        if (returnLink) {
            returnLink.addEventListener('click', () => {
                const target = new URL(returnLink.href, window.location.href);
                const state = {
                    url: `${target.pathname}${target.search}${target.hash}`,
                    scrollY: Number(returnLink.dataset.returnScroll) || 0
                };
                sessionStorage.setItem(scrollStorageKey, JSON.stringify(state));
            });
        }

        const savedState = sessionStorage.getItem(scrollStorageKey);
        if (!savedState) return;

        sessionStorage.removeItem(scrollStorageKey);
        const state = JSON.parse(savedState);
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (state.url !== currentUrl || !Number.isFinite(state.scrollY) || state.scrollY < 0) return;

        window.setTimeout(() => {
            requestAnimationFrame(() => {
                const previousScrollBehavior = document.documentElement.style.scrollBehavior;
                document.documentElement.style.scrollBehavior = 'auto';
                window.scrollTo(0, state.scrollY);
                document.documentElement.style.scrollBehavior = previousScrollBehavior;
            });
        }, prefersReducedMotion ? 0 : MOTION_TOKENS.NORMAL_DURATION);
    }

    // 9. Branded cursor with an attached glow for mouse-driven devices
    function initCustomCursor() {
        if (isTouchDevice || prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        document.documentElement.append(cursor);
        document.documentElement.classList.add('custom-cursor-enabled');

        document.addEventListener('mousemove', (event) => {
            cursor.style.transform = `translate3d(${event.clientX - 9}px, ${event.clientY - 9}px, 0)`;
            document.documentElement.classList.add('custom-cursor-active');
        }, { passive: true });

        const deactivateCursor = () => {
            document.documentElement.classList.remove('custom-cursor-active');
        };

        document.addEventListener('mouseleave', deactivateCursor);
        window.addEventListener('blur', deactivateCursor);
    }

    // Initialize all modules on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        initPageTransition();
        initNavbarMotion();
        initScrollReveals();
        init3DCardTilt();
        initMagneticButtons();
        initButtonRipples();
        initMovieNavigation();
        initCustomCursor();
    });

})();
