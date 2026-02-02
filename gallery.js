// Preloader functionality
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');
    // FIX: Changed selector to match your HTML class 'progress-bar-fill'
    const progressFill = document.querySelector('.progress-bar-fill');

    // Check if preloader exists
    if (!preloader || !progressFill) {
        console.error('Preloader elements not found');
        return;
    }

    // FIX: Reset CSS animation so JS can control the progress bar width
    progressFill.style.animation = 'none';
    progressFill.style.width = '0%';

    // Make preloader visible
    preloader.style.display = 'flex';

    // Pause animations on the page background during loading
    document.querySelectorAll('.scrolling-content').forEach(content => {
        content.style.animationPlayState = 'paused';
    });

    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        // Randomize loading speed for a more realistic "calculating" feel
        progress += Math.random() * 5;

        if (progress > 100) {
            progress = 100;
            clearInterval(loadingInterval);

            // Ensure bar is full before hiding
            progressFill.style.width = '100%';

            // Hide preloader after completion
            setTimeout(() => {
                // This class matches your CSS line 576 (.preloader.hide)
                preloader.classList.add('hide');

                setTimeout(() => {
                    preloader.style.display = 'none';
                    // Start animations after preloader is hidden
                    document.querySelectorAll('.scrolling-content').forEach(content => {
                        content.style.animationPlayState = 'running';
                    });
                }, 1000); // Wait for the fade out transition
            }, 500);
        } else {
            progressFill.style.width = `${progress}%`;
        }
    }, 50); // Speed of updates
});

// Mobile navigation toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Enhanced Custom Cursor
const cursor = document.querySelector('.cursor');
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let animationId = null;

// Check if device supports hover
const hasHover = window.matchMedia('(hover: hover)').matches;

if (hasHover && cursor) {
    // Initialize cursor as visible
    cursor.classList.add('visible');

    // Smooth cursor animation
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        animationId = requestAnimationFrame(animateCursor);
    }

    // Start animation
    animateCursor();

    // Update mouse position
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Mouse down effect
    document.addEventListener('mousedown', () => {
        cursor.classList.add('click');
    });

    // Mouse up effect
    document.addEventListener('mouseup', () => {
        cursor.classList.remove('click');
    });

    // Add hover effect to interactive elements
    const hoverElements = document.querySelectorAll('a, button, .card__article, .social-link, .love, .nav-link');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
} else if (cursor) {
    // Hide custom cursor on touch devices
    cursor.style.display = 'none';
}

// Pause animation on hover for scrolling tracks
document.querySelectorAll('.scrolling-track').forEach(track => {
    track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
    });
});

// Love button functionality
document.querySelectorAll('.love').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        this.textContent = this.classList.contains('active') ? '♥' : '♡';
    });
});

// Handle mobile touch events for cards
document.querySelectorAll('.card__article').forEach(card => {
    let touchStartX = 0;
    let touchStartY = 0;

    card.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, {
        passive: true
    });

    card.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        // Check if it's a tap (not a swipe)
        if (Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10) {
            // Simulate hover effect on mobile tap
            this.classList.add('mobile-tap');
            setTimeout(() => {
                this.classList.remove('mobile-tap');
            }, 300);

            // Toggle card data visibility on mobile
            const cardData = this.querySelector('.card__data');
            if (cardData) {
                cardData.classList.toggle('mobile-visible');
            }
        }
    }, {
        passive: true
    });
});

// Clean up animation on page unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

// Add CSS for mobile tap effect
const style = document.createElement('style');
style.textContent = `
            @media (hover: none) and (pointer: coarse) {
                .card__article.mobile-tap {
                    transform: translateY(-5px);
                    transition: transform 0.3s ease;
                }
                
                .card__data.mobile-visible {
                    bottom: 1rem !important;
                    opacity: 1 !important;
                }
                
                .card__article {
                    cursor: pointer;
                }
            }
            
            /* Disable hover effects on mobile */
            @media (max-width: 768px) {
                .card__article:hover {
                    transform: none;
                }
                
                .card__article:hover .card__img {
                    transform: none;
                }
                
                .scrolling-track:hover .scrolling-content {
                    animation-play-state: running;
                }
            }
        `;
document.head.appendChild(style);