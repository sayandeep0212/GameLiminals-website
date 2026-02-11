// Team Page JavaScript with Firebase Integration

// Preloader Animation
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');

    // Start loading Firebase data immediately so it's ready when animation ends
    loadFirebaseData();

    if (preloader) {
        // The CSS animation takes 3 seconds (3000ms).
        // We wait for that to finish before hiding the preloader.
        setTimeout(() => {
            // Add the class that sets opacity: 0
            preloader.classList.add('hide-preloader');

            // Wait for the fade-out transition (0.6s) to finish
            setTimeout(() => {
                preloader.style.display = 'none';
                // Initialize the visual effects
                initializeTeamPage();
            }, 600);
        }, 3000); // Matches the 3s CSS animation
    } else {
        // Fallback if no preloader
        initializeTeamPage();
    }
});

// Load data from Firebase
async function loadFirebaseData() {
    try {
        // Load team categories counts
        await loadCategoryCounts();

        // Load team members
        await loadTeamMembers();

        console.log('Firebase data loaded successfully');
    } catch (error) {
        console.error('Error loading Firebase data:', error);
    }
}

// Load category counts from Firebase
async function loadCategoryCounts() {
    try {
        const categoriesRef = db.collection('teamCategories');
        const snapshot = await categoriesRef.get();

        snapshot.forEach(doc => {
            const data = doc.data();
            const categoryName = data.name;
            const memberCount = data.count || 0;

            // Update the corresponding category badge
            updateCategoryCount(categoryName, memberCount);
        });
    } catch (error) {
        console.error('Error loading category counts:', error);
    }
}

// Update category count in UI
function updateCategoryCount(categoryName, count) {
    const categoryMap = {
        'Leadership': 'leadership-count',
        'Development': 'development-count',
        'Design': 'design-count',
        'Outreach': 'outreach-count',
        'Management': 'management-count'
    };

    const elementId = categoryMap[categoryName];
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${count} Member${count !== 1 ? 's' : ''}`;
            element.setAttribute('data-count', count);
        }
    }
}

// Load team members from Firebase
async function loadTeamMembers() {
    try {
        const teamGrid = document.querySelector('.team-grid');
        if (!teamGrid) return;

        // Clear existing static content
        teamGrid.innerHTML = '';

        // Add loading indicator
        teamGrid.innerHTML = '<div class="loading-members">Loading team members...</div>';

        const membersRef = db.collection('teamMembers').orderBy('order', 'asc');
        const snapshot = await membersRef.get();

        // Clear loading indicator
        teamGrid.innerHTML = '';

        if (snapshot.empty) {
            teamGrid.innerHTML = '<div class="no-members">No team members found.</div>';
            return;
        }

        snapshot.forEach(doc => {
            const member = doc.data();
            createMemberCard(member, teamGrid);
        });

        // Re-initialize animations after loading members
        initializeTeamCardAnimations();

    } catch (error) {
        console.error('Error loading team members:', error);
        const teamGrid = document.querySelector('.team-grid');
        if (teamGrid) {
            teamGrid.innerHTML = '<div class="error-members">Error loading team members. Please try again later.</div>';
        }
    }
}

// Create team member card
function createMemberCard(member, container) {
    const card = document.createElement('div');
    card.className = 'team-member-card';

    // Determine status class
    const statusClass = getStatusClass(member.status || 'offline');

    // Determine level
    const level = member.level || Math.floor(Math.random() * 5) + 5;

    // Create social media links
    const socialLinks = createSocialLinks(member.social || {});

    card.innerHTML = `
        <div class="member-image">
            <div class="member-image-container">
                <img src="${member.imageUrl || getDefaultImage()}" alt="${member.name}" onerror="this.src='${getDefaultImage()}'">
                <div class="member-status ${statusClass}"></div>
            </div>
            <div class="member-level">
                <span>Level ${level}</span>
            </div>
        </div>
        <div class="member-info">
            <h3 class="member-name">${member.name || 'Team Member'}</h3>
            <p class="member-position">${member.position || 'Club Member'}</p>
            <p class="member-quote">"${member.quote || 'Passionate about game development'}"</p>
        </div>
        <div class="member-social">
            ${socialLinks}
        </div>
        <div class="member-tags">
            ${createTagsHTML(member.tags || [])}
        </div>
    `;

    container.appendChild(card);
}

// Get status class based on status string
function getStatusClass(status) {
    const statusMap = {
        'online': 'online',
        'away': 'away',
        'busy': 'busy',
        'offline': 'offline'
    };
    return statusMap[status.toLowerCase()] || 'offline';
}

// Create social media links HTML
function createSocialLinks(social) {
    const socialPlatforms = {
        'github': { icon: 'fab fa-github', prefix: 'https://github.com/' },
        'linkedin': { icon: 'fab fa-linkedin', prefix: 'https://linkedin.com/in/' },
        'twitter': { icon: 'fab fa-twitter', prefix: 'https://twitter.com/' },
        'discord': { icon: 'fab fa-discord', prefix: 'https://discord.com/users/' },
        'instagram': { icon: 'fab fa-instagram', prefix: 'https://instagram.com/' }
    };

    let linksHTML = '';

    Object.entries(socialPlatforms).forEach(([platform, info]) => {
        if (social[platform]) {
            const url = social[platform].startsWith('http') ? social[platform] : info.prefix + social[platform];
            linksHTML += `
                <a href="${url}" target="_blank" class="social-icon">
                    <i class="${info.icon}"></i>
                </a>
            `;
        }
    });

    return linksHTML;
}

// Create tags HTML
function createTagsHTML(tags) {
    if (!tags || tags.length === 0) {
        return '<span class="member-tag"></span>';
    }

    return tags.map(tag => `<span class="member-tag">${tag}</span>`).join('');
}

// Get default image
function getDefaultImage() {
    const defaultImages = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=761&q=80'
    ];

    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

// Initialize main page functionality
function initializeTeamPage() {
    // Custom Cursor - Fixed
    const cursor = document.querySelector('.cursor');

    if (cursor && window.innerWidth > 768) {
        let mouseX = 0,
            mouseY = 0;
        let cursorX = 0,
            cursorY = 0;

        // Initialize cursor position
        cursor.style.left = '0px';
        cursor.style.top = '0px';
        cursor.style.display = 'block';

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
            const isInteractive = target.matches('a, button, .cta-button, .team-member-card, .category-card, .social-icon, .team-element, .character, .item, .power-up, .nav-link');

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
            if (window.innerWidth <= 768) {
                cursor.style.display = 'none';
            } else {
                cursor.style.display = 'block';
            }
        });

        animateCursor();
    } else if (cursor) {
        cursor.style.display = 'none';
    }

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            // Close menu when clicking links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
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
    const setActiveNavLink = () => {
        const currentPath = window.location.pathname.split('/').pop() || '';
        const currentPageNormalized = currentPath.replace('.html', '') || 'index';
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const hrefPath = href.split('/').pop().replace('.html', '');

            // Match if normalized paths are equal
            const isCurrentPage = hrefPath === currentPageNormalized ||
                (currentPageNormalized === 'index' && href === 'index.html') ||
                (currentPageNormalized === 'index' && href === '');

            if (isCurrentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    setActiveNavLink();
    // Re-check on popstate (back/forward button)
    window.addEventListener('popstate', setActiveNavLink);

    // Initialize team member card animations
    initializeTeamCardAnimations();

    // Initialize gaming effects animations
    initializeGamingEffects();

    // Initialize scroll animations
    initializeScrollAnimations();

    // Add interactive effects
    addInteractiveEffects();
}

// Initialize team card animations
function initializeTeamCardAnimations() {
    const teamCards = document.querySelectorAll('.team-member-card');

    teamCards.forEach((card, index) => {
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;

        // Add click effect
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.social-icon')) {
                card.classList.toggle('expanded');
            }
        });

        // Add hover glow effect
        card.addEventListener('mouseenter', () => {
            const status = card.querySelector('.member-status');
            if (status) {
                status.style.transform = 'scale(1.3)';
            }
        });

        card.addEventListener('mouseleave', () => {
            const status = card.querySelector('.member-status');
            if (status) {
                status.style.transform = 'scale(1)';
            }
        });
    });
}

// Initialize gaming effects
function initializeGamingEffects() {
    // Animate team elements
    const teamElements = document.querySelectorAll('.team-element');

    teamElements.forEach((element, index) => {
        const duration = 8 + Math.random() * 4;
        const delay = Math.random() * 2;

        element.style.animationDuration = `${duration}s`;
        element.style.animationDelay = `${delay}s`;

        // Add click effect
        element.addEventListener('click', () => {
            element.style.transform = 'scale(1.3) rotate(20deg)';
            setTimeout(() => {
                element.style.transform = '';
            }, 300);
        });
    });

    // Animate game characters
    const characters = document.querySelectorAll('.character');

    characters.forEach((character, index) => {
        // Randomize animation
        const duration = 6 + Math.random() * 3;
        character.style.animationDuration = `${duration}s`;

        // Add click effect
        character.addEventListener('click', () => {
            character.style.animationPlayState = 'paused';
            setTimeout(() => {
                character.style.animationPlayState = 'running';
            }, 1000);
        });
    });

    // Animate game items
    const items = document.querySelectorAll('.item');

    items.forEach((item, index) => {
        // Randomize animation
        const duration = 8 + Math.random() * 4;
        item.style.animationDuration = `${duration}s`;
    });

    // Add interactive power-ups
    const powerUps = document.querySelectorAll('.power-up');

    powerUps.forEach((powerUp, index) => {
        powerUp.addEventListener('click', () => {
            // Create particle effect
            createParticleEffect(powerUp);

            // Change color temporarily
            const originalColor = powerUp.style.color;
            powerUp.style.color = '#ffffff';
            powerUp.style.textShadow = '0 0 20px #ffffff';

            setTimeout(() => {
                powerUp.style.color = originalColor;
                powerUp.style.textShadow = '';
            }, 500);
        });
    });
}

// Create particle effect for power-ups
function createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = getComputedStyle(element).color;
        particle.style.borderRadius = '50%';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.zIndex = '9999';
        particle.style.pointerEvents = 'none';

        document.body.appendChild(particle);

        // Animate particle
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 2 + Math.random() * 3;

        const animation = particle.animate([{
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * speed * 50}px, ${Math.sin(angle) * speed * 50}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 800 + Math.random() * 400,
            easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
        });

        animation.onfinish = () => {
            particle.remove();
        };
    }
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

                // Add staggered animation for team cards
                if (entry.target.classList.contains('team-member-card')) {
                    const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }

                // Add staggered animation for category cards
                if (entry.target.classList.contains('category-card')) {
                    const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.team-member-card, .category-card, .character, .item, .power-up').forEach(el => {
        observer.observe(el);
    });
}

// Add interactive effects
function addInteractiveEffects() {
    // Add hover effects to social icons
    document.querySelectorAll('.social-icon').forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) rotate(10deg)';
        });

        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotate(0deg)';
        });
    });

    // Add category card click effects
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'translateY(-10px) scale(1)';
            }, 200);
        });
    });

}
