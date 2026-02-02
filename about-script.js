// Preloader Animation
document.addEventListener('DOMContentLoaded', function() {
    // Target the ID defined in your HTML
    const preloader = document.getElementById('preloader');

    if (preloader) {
        // The CSS progress bar takes 3 seconds (3000ms) to fill.
        // We wait for that, then fade out.
        setTimeout(() => {
            // Add the class that sets opacity to 0
            preloader.classList.add('hide-preloader');

            // Wait for the fade transition (0.6s) to finish, then hide completely
            setTimeout(() => {
                preloader.style.display = 'none';

                // Start the main site animations
                initializeAboutPage();
            }, 600);
        }, 3000);
    } else {
        // If preloader is missing, load immediately
        initializeAboutPage();
    }
});

// Initialize main page functionality
// (This section remains exactly as you had it)
function initializeAboutPage() {
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
            const isInteractive = target.matches('a, button, .cta-button, .value-card, .wwd-card, .community-feature, .achievement-card, .skill-item, .game-element, .wwd-icon-item, .nav-link');

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

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;

            // Check if it's a same-page anchor
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement && !this.getAttribute('href').includes('.html')) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Set active navigation link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage ||
            (currentPage === '' && link.getAttribute('href') === 'index.html') ||
            (link.getAttribute('href').includes('#about') && currentPage.includes('about'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Initialize animated counters
    initializeAnimatedCounters();

    // Initialize animations on scroll
    initializeScrollAnimations();

    // Start floating animations
    startFloatingAnimations();

    // Initialize network animation
    initializeNetworkAnimation();

    // Add interactive effects
    addInteractiveEffects();
}

// Initialize animated counters
function initializeAnimatedCounters() {
    // Set target values
    const counters = {
        yearsCount: 2,
        membersCount: 150,
        projectsCount: 0,
        awardsCount: 1,
        eventsCount: 1,
        alumniCount: 0,
        publishedGamesCount: 0
    };

    // Animate each counter
    Object.keys(counters).forEach(counterId => {
        const element = document.getElementById(counterId);
        if (element) {
            animateCounter(element, counters[counterId]);
        }
    });
}

// Animate counter from 0 to target value
function animateCounter(element, targetValue) {
    const duration = 2000; // 2 seconds
    const increment = targetValue / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Initialize scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');

                // Add staggered animation for What We Do cards
                if (entry.target.classList.contains('wwd-card')) {
                    const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.mission-card-large, .value-card, .wwd-card, .community-feature, .achievement-card, .skill-item').forEach(el => {
        observer.observe(el);
    });
}

// Start floating animations
function startFloatingAnimations() {
    const gameElements = document.querySelectorAll('.game-element');

    gameElements.forEach((element, index) => {
        // Randomize animation duration and delay
        const duration = 6 + Math.random() * 4; // 6-10 seconds
        const delay = Math.random() * 2; // 0-2 seconds delay

        element.style.animationDuration = `${duration}s`;
        element.style.animationDelay = `${delay}s`;
    });

    // What We Do icon animations
    const wwdIcons = document.querySelectorAll('.wwd-icons');
    wwdIcons.forEach((icons, index) => {
        const duration = 6 + (index * 2);
        icons.style.animationDuration = `${duration}s`;
    });
}

// Initialize network animation
function initializeNetworkAnimation() {
    const networkNodes = document.querySelectorAll('.network-node');

    networkNodes.forEach((node, index) => {
        // Add animation to each node
        node.style.animationDelay = `${index * 0.5}s`;

        // Add hover effect
        node.addEventListener('mouseenter', () => {
            node.style.zIndex = '20';
            const icon = node.querySelector('.node-icon');
            if (icon) {
                icon.style.transform = 'scale(1.3)';
                icon.style.boxShadow = '0 10px 30px rgba(74, 111, 255, 0.5)';
            }
        });

        node.addEventListener('mouseleave', () => {
            node.style.zIndex = '1';
            const icon = node.querySelector('.node-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = 'var(--shadow-light)';
            }
        });
    });
}

// Add interactive effects
function addInteractiveEffects() {
    // Add hover effects to cards
    document.querySelectorAll('.wwd-card, .value-card, .achievement-card, .community-feature, .skill-item').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.zIndex = '10';
        });

        card.addEventListener('mouseleave', () => {
            card.style.zIndex = '1';
        });
    });

    // Add click effects to skill tags
    document.querySelectorAll('.skill-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            tag.style.transform = 'scale(0.95)';
            setTimeout(() => {
                tag.style.transform = 'scale(1)';
            }, 200);
        });
    });

    // Add click effects to game elements
    document.querySelectorAll('.game-element, .wwd-icon-item').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            element.style.transform = 'scale(1.3)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        });
    });
}