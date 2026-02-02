// Preloader Animation
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');

    // The CSS animation for the progress bar is set to 3 seconds (3000ms).
    // We wait for that to finish before hiding the preloader.
    setTimeout(() => {
        if (preloader) {
            // Add the class that sets opacity: 0 (defined in your CSS)
            preloader.classList.add('hide-preloader');

            // Wait for the fade-out transition (0.6s) to finish, then remove from layout
            setTimeout(() => {
                preloader.style.display = 'none';
                // Initialize the rest of the website features
                initializeWebsite();
            }, 600);
        } else {
            // Fallback if preloader is missing
            initializeWebsite();
        }
    }, 3000); // Matches the 3s CSS animation duration
});

// Initialize main website functionality
function initializeWebsite() {
    // Custom Cursor
    const cursor = document.querySelector('.cursor');

    if (cursor) {
        let mouseX = 0,
            mouseY = 0;
        let cursorX = 0,
            cursorY = 0;

        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Add hover effect on interactive elements
            const target = e.target;
            const isInteractive = target.matches('a, button, .cta-button, .nav-link, .marquee-item');

            if (isInteractive) {
                cursor.classList.add('hover');
            } else {
                cursor.classList.remove('hover');
            }
        });

        // Hide cursor on mobile
        if (window.innerWidth <= 768) {
            cursor.style.display = 'none';
        }

        window.addEventListener('resize', () => {
            cursor.style.display = window.innerWidth <= 768 ? 'none' : 'block';
        });

        animateCursor();
    }

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize Marquee Effects
    initializeMarqueeEffects();
}

// Marquee hover effects
function initializeMarqueeEffects() {
    const marqueeItems = document.querySelectorAll('.marquee-item');

    marqueeItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const badge = item.querySelector('.marquee-badge');
            if (badge) {
                badge.style.transform = 'scale(1.05)';
                badge.style.boxShadow = '0 4px 12px rgba(74, 111, 255, 0.4)';
            }
        });

        item.addEventListener('mouseleave', () => {
            const badge = item.querySelector('.marquee-badge');
            if (badge) {
                badge.style.transform = 'scale(1)';
                badge.style.boxShadow = 'none';
            }
        });
    });

    // Adjust marquee speed based on screen size
    function adjustMarqueeSpeed() {
        const marqueeContent = document.querySelector('.marquee-content');
        if (!marqueeContent) return;

        if (window.innerWidth <= 768) {
            marqueeContent.style.animationDuration = '25s';
        } else if (window.innerWidth <= 992) {
            marqueeContent.style.animationDuration = '30s';
        } else {
            marqueeContent.style.animationDuration = '40s';
        }
    }

    // Adjust speed on load and resize
    adjustMarqueeSpeed();
    window.addEventListener('resize', adjustMarqueeSpeed);

    // Pause on hover (desktop only)
    const marqueeSection = document.querySelector('.marquee-section');
    if (marqueeSection && window.innerWidth > 768) {
        marqueeSection.addEventListener('mouseenter', () => {
            const marqueeContent = marqueeSection.querySelector('.marquee-content');
            if (marqueeContent) {
                marqueeContent.style.animationPlayState = 'paused';
            }
        });

        marqueeSection.addEventListener('mouseleave', () => {
            const marqueeContent = marqueeSection.querySelector('.marquee-content');
            if (marqueeContent) {
                marqueeContent.style.animationPlayState = 'running';
            }
        });
    }

    // Handle reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const marqueeContent = document.querySelector('.marquee-content');
        if (marqueeContent) {
            marqueeContent.style.animation = 'none';
            marqueeContent.style.justifyContent = 'flex-start';
            marqueeContent.style.flexWrap = 'wrap';
            marqueeContent.style.gap = '1rem';
        }
    }
}