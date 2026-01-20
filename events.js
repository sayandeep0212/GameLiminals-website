// ==============================================
// COMBINED SCRIPT FOR EVENTS PAGE
// ==============================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAe13QXrLdAG0g4Xd98FiaMeyoJCRYi5lM",
    authDomain: "gameliminals.firebaseapp.com",
    projectId: "gameliminals",
    storageBucket: "gameliminals.firebasestorage.app",
    messagingSenderId: "262478638152",
    appId: "1:262478638152:web:fd01af842dc2fbaa70fc7d",
    measurementId: "G-6HSEQ5RZ6P"
};

// Global variables
let db;
let allEvents = [];
let filteredEvents = [];
let currentFilter = 'all';
let searchTerm = '';
let eventsPerPage = 9;
let currentPage = 1;
let hasMoreEvents = true;

// ========== PRELOADER & BASIC FUNCTIONALITY ==========

// Preloader Animation
function initializePreloader() {
    const preloader = document.querySelector('.preloader');
    const progressBar = document.querySelector('.progress-bar');
    const titleChars = document.querySelectorAll('.title-char');
    const taglineChars = document.querySelectorAll('.tagline-char');

    if (preloader) {
        // Animate title characters with delay
        titleChars.forEach((char, index) => {
            setTimeout(() => {
                char.style.animationDelay = `${index * 0.1}s`;
                char.style.animation = 'titleReveal 0.5s forwards cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 100);
        });

        // Animate tagline characters with delay
        taglineChars.forEach((char, index) => {
            setTimeout(() => {
                char.style.animationDelay = `${index * 0.05}s`;
                char.style.animation = 'taglineReveal 0.4s forwards cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 800 + titleChars.length * 100);
        });

        // Simulate loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) {
                progress = 100;
                clearInterval(progressInterval);

                // Remove preloader after completion
                setTimeout(() => {
                    preloader.classList.add('loaded');
                    setTimeout(() => {
                        preloader.style.display = 'none';
                        // Initialize main website functionality
                        initializeWebsite();
                    }, 800);
                }, 500);
            }
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }, 100);
    } else {
        // If no preloader, initialize website immediately
        initializeWebsite();
    }
}

// ========== CUSTOM CURSOR ==========

function initializeCustomCursor() {
    const cursor = document.querySelector('.cursor');

    if (cursor && window.innerWidth > 768) {
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
            const isInteractive = target.matches('a, button, .cta-button, .nav-link, .filter-tab, .btn-details, .btn-register, .modal-btn, .reset-filters, .load-more-btn, .clear-search');

            if (isInteractive) {
                cursor.classList.add('hover');
            } else {
                cursor.classList.remove('hover');
            }
        });

        animateCursor();
    } else if (cursor) {
        cursor.style.display = 'none';
    }

    // Hide cursor on mobile
    window.addEventListener('resize', () => {
        const cursor = document.querySelector('.cursor');
        if (cursor) {
            cursor.style.display = window.innerWidth <= 768 ? 'none' : 'block';
        }
    });
}

// ========== MOBILE NAVIGATION ==========

function initializeMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            // Toggle body scroll
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });

        // Close menu when clicking links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') &&
                !e.target.closest('.nav-menu') &&
                !e.target.closest('.hamburger')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// ========== SMOOTH SCROLLING ==========

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Only handle internal links that start with #
            if (href === '#' || href.startsWith('http')) return;

            e.preventDefault();
            const targetId = href;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========== MAIN INITIALIZATION ==========

function initializeWebsite() {
    initializeCustomCursor();
    initializeMobileNavigation();
    initializeSmoothScrolling();

    // Initialize Firebase and events functionality
    initializeFirebase();
    setupEventListeners();
    loadEvents();
    checkURLParameters();
}

// ========== FIREBASE & EVENTS FUNCTIONALITY ==========

// Initialize Firebase
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');
        }

        // Get Firestore instance
        db = firebase.firestore();

    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Failed to connect to database. Please refresh the page.');
    }
}

// Setup event listeners for events functionality
function setupEventListeners() {
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            // Filter events
            handleFilterChange(tab.dataset.filter);
        });
    });

    // Search input
    const eventSearch = document.getElementById('eventSearch');
    if (eventSearch) {
        eventSearch.addEventListener('input', handleSearch);
    }

    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreEvents);
    }

    // Modal close
    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeEventModal();
            }
        });
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEventModal();
        }
    });
}

// Check URL parameters for filters
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');

    if (filter) {
        const filterTab = document.querySelector(`.filter-tab[data-filter="${filter}"]`);
        if (filterTab) {
            filterTab.click();
        }
    }
}

// Load events from Firebase
async function loadEvents() {
    if (!db) {
        showError('Database not connected');
        return;
    }

    try {
        // Show loading state
        showLoading(true);

        // Query events ordered by date (newest first)
        const querySnapshot = await db.collection('events')
            .orderBy('date', 'desc')
            .get();

        if (querySnapshot.empty) {
            showNoEvents();
            updateStats([]);
            return;
        }

        // Process events
        allEvents = [];
        querySnapshot.forEach(doc => {
            const eventData = doc.data();
            const event = {
                id: doc.id,
                ...eventData,
                // Convert Firestore timestamp to Date
                date: eventData.date ? eventData.date.toDate() : new Date(),
                // Ensure isClosed is boolean
                isClosed: eventData.isClosed || false
            };
            allEvents.push(event);
        });

        console.log(`Loaded ${allEvents.length} events from Firebase`);

        // Update statistics
        updateStats(allEvents);

        // Filter and display events
        filterEvents();

        // Check for featured event
        checkFeaturedEvent();

    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Filter events based on current filter and search
function filterEvents() {
    const now = new Date();

    // Start with all events
    let filtered = [...allEvents];

    // Apply search filter
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            (event.category && event.category.toLowerCase().includes(searchLower))
        );
    }

    // Apply category filter
    switch (currentFilter) {
        case 'upcoming':
            filtered = filtered.filter(event =>
                event.date > now && !event.isClosed
            );
            break;

        case 'ongoing':
            filtered = filtered.filter(event => {
                const eventDate = event.date;
                const eventEnd = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
                return eventDate <= now && eventEnd > now && !event.isClosed;
            });
            break;

        case 'workshop':
            filtered = filtered.filter(event =>
                event.category && event.category.toLowerCase().includes('workshop')
            );
            break;

        case 'tournament':
            filtered = filtered.filter(event =>
                event.category && event.category.toLowerCase().includes('tournament')
            );
            break;

        case 'gamejam':
            filtered = filtered.filter(event =>
                event.category && (event.category.toLowerCase().includes('gamejam') ||
                    event.category.toLowerCase().includes('game jam'))
            );
            break;

        case 'closed':
            filtered = filtered.filter(event =>
                event.isClosed || event.date < now
            );
            break;

            // 'all' shows all events
    }

    // Sort events: upcoming first, then by date
    filtered.sort((a, b) => {
        const aIsUpcoming = a.date > now && !a.isClosed;
        const bIsUpcoming = b.date > now && !b.isClosed;

        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        return b.date - a.date; // Newest first
    });

    filteredEvents = filtered;
    currentPage = 1;
    hasMoreEvents = filteredEvents.length > eventsPerPage;

    // Display events
    displayEvents();

    // Update URL with current filter
    updateURL();
}

// Display events in grid
function displayEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    // Calculate events to show for current page
    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);

    // Clear grid if first page
    if (currentPage === 1) {
        eventsGrid.innerHTML = '';
    }

    if (eventsToShow.length === 0) {
        showNoEvents();
        return;
    }

    // Hide no events message
    const noEventsMessage = document.getElementById('noEvents');
    if (noEventsMessage) {
        noEventsMessage.style.display = 'none';
    }

    // Create event cards
    eventsToShow.forEach((event, index) => {
        const eventCard = createEventCard(event, index);
        eventsGrid.appendChild(eventCard);
    });

    // Show/hide load more button
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        if (hasMoreEvents && filteredEvents.length > eventsPerPage) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
}

// Create event card element
function createEventCard(event, index) {
    const now = new Date();
    const eventDate = event.date;
    const isUpcoming = eventDate > now && !event.isClosed;
    const isOngoing = eventDate <= now && new Date(eventDate.getTime() + 24 * 60 * 60 * 1000) > now && !event.isClosed;

    // Format date
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('default', { month: 'short' });
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Determine status
    let statusClass = 'closed';
    let statusText = 'Past';

    if (event.isClosed) {
        statusClass = 'closed';
        statusText = 'Closed';
    } else if (isOngoing) {
        statusClass = 'ongoing';
        statusText = 'Ongoing';
    } else if (isUpcoming) {
        statusClass = 'upcoming';
        statusText = 'Upcoming';
    }

    // Create card element
    const card = document.createElement('div');
    card.className = `event-card ${statusClass}`;
    card.style.animationDelay = `${index * 0.1}s`;

    // Get image URL or use default
    const imageUrl = event.imageUrl || getDefaultEventImage(event.category);

    // Card HTML
    card.innerHTML = `
        <div class="event-image-container">
            <img src="${imageUrl}" 
                 alt="${event.title}" 
                 class="event-image"
                 onerror="this.src='${getDefaultEventImage('default')}'">
            <div class="event-overlay">
                <div class="event-status-badge ${statusClass}">
                    ${statusText}
                </div>
            </div>
            <div class="event-date-badge">
                <span class="date-day">${day}</span>
                <span class="date-month">${month}</span>
            </div>
        </div>
        
        <div class="event-content">
            <div class="event-category">${event.category || 'General'}</div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-description">${event.description || 'Join us for an exciting event!'}</p>
            
            <div class="event-meta">
                <div class="meta-item">
                    <i class="far fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="meta-item">
                    <i class="far fa-clock"></i>
                    <span>${event.time || 'TBA'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location || 'Adamas University'}</span>
                </div>
            </div>
            
            <div class="event-actions">
                <button class="btn-details" onclick="viewEventDetails('${event.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                
                ${!event.isClosed && (isUpcoming || isOngoing) ? 
                    `<a href="eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}" 
                       class="btn-register">
                        <i class="fas fa-user-plus"></i> Register
                    </a>` :
                    `<button class="btn-register disabled" disabled>
                        <i class="fas fa-lock"></i> Closed
                    </button>`
                }
            </div>
        </div>
    `;
    
    return card;
}

// Get default event image based on category
function getDefaultEventImage(category) {
    const categoryLower = (category || '').toLowerCase();
    
    if (categoryLower.includes('workshop')) {
        return 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    } else if (categoryLower.includes('tournament')) {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    } else if (categoryLower.includes('gamejam') || categoryLower.includes('game jam')) {
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    } else {
        return 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
}

// View event details in modal
function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const eventDate = event.date;
    const now = new Date();
    const isUpcoming = eventDate > now && !event.isClosed;
    const isOngoing = eventDate <= now && new Date(eventDate.getTime() + 24 * 60 * 60 * 1000) > now && !event.isClosed;
    
    // Format date
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create modal content
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalRegisterBtn = document.getElementById('modalRegisterBtn');
    
    if (!modalTitle || !modalBody || !modalRegisterBtn) return;
    
    modalTitle.textContent = event.title;
    
    modalBody.innerHTML = `
        <div class="modal-event-image">
            <img src="${event.imageUrl || getDefaultEventImage(event.category)}" 
                 alt="${event.title}"
                 onerror="this.src='${getDefaultEventImage('default')}'">
        </div>
        
        <div class="modal-event-info">
            <div class="modal-event-category">${event.category || 'General'}</div>
            
            <div class="modal-event-details">
                <div class="detail-item">
                    <i class="far fa-calendar"></i>
                    <div>
                        <strong>Date:</strong>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="far fa-clock"></i>
                    <div>
                        <strong>Time:</strong>
                        <span>${event.time || 'To be announced'}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>Location:</strong>
                        <span>${event.location || 'Adamas University'}</span>
                    </div>
                </div>
                
                ${event.maxParticipants ? `
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <div>
                        <strong>Max Participants:</strong>
                        <span>${event.maxParticipants}</span>
                    </div>
                </div>` : ''}
            </div>
            
            <div class="modal-event-description">
                <h4>Event Description</h4>
                <p>${event.description || 'No description available.'}</p>
            </div>
            
            ${event.requirements ? `
            <div class="modal-event-requirements">
                <h4>Requirements</h4>
                <p>${event.requirements}</p>
            </div>` : ''}
            
            ${event.prizes ? `
            <div class="modal-event-prizes">
                <h4>Prizes & Rewards</h4>
                <p>${event.prizes}</p>
            </div>` : ''}
        </div>
    `;
    
    // Set up register button
    if (!event.isClosed && (isUpcoming || isOngoing)) {
        modalRegisterBtn.href = `eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}`;
        modalRegisterBtn.style.display = 'flex';
    } else {
        modalRegisterBtn.style.display = 'none';
    }
    
    // Show modal
    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close event modal
function closeEventModal() {
    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Update statistics
function updateStats(events) {
    const now = new Date();
    
    // Update DOM elements
    const totalEventsEl = document.getElementById('totalEvents');
    const upcomingEventsEl = document.getElementById('upcomingEvents');
    const tournamentEventsEl = document.getElementById('tournamentEvents');
    const workshopEventsEl = document.getElementById('workshopEvents');
    
    if (totalEventsEl) totalEventsEl.textContent = events.length;
    
    // Upcoming events
    const upcoming = events.filter(event => {
        return event.date > now && !event.isClosed;
    }).length;
    if (upcomingEventsEl) upcomingEventsEl.textContent = upcoming;
    
    // Tournament events
    const tournaments = events.filter(event => 
        event.category && event.category.toLowerCase().includes('tournament')
    ).length;
    if (tournamentEventsEl) tournamentEventsEl.textContent = tournaments;
    
    // Workshop events
    const workshops = events.filter(event => 
        event.category && event.category.toLowerCase().includes('workshop')
    ).length;
    if (workshopEventsEl) workshopEventsEl.textContent = workshops;
}

// Check for featured event (most recent upcoming event)
function checkFeaturedEvent() {
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => 
        event.date > now && !event.isClosed
    );
    
    if (upcomingEvents.length > 0) {
        const featuredEvent = upcomingEvents[0];
        showFeaturedEvent(featuredEvent);
    } else {
        const featuredBanner = document.getElementById('featuredBanner');
        if (featuredBanner) {
            featuredBanner.style.display = 'none';
        }
    }
}

// Show featured event banner
function showFeaturedEvent(event) {
    const featuredBanner = document.getElementById('featuredBanner');
    if (!featuredBanner) return;
    
    const eventDate = event.date;
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('featuredTitle').textContent = event.title;
    document.getElementById('featuredDescription').textContent = event.description || 'Join us for this exciting event!';
    document.getElementById('featuredDate').textContent = formattedDate;
    document.getElementById('featuredTime').textContent = event.time || 'TBA';
    document.getElementById('featuredLocation').textContent = event.location || 'Adamas University';
    document.getElementById('featuredRegisterBtn').href = `eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}`;
    
    featuredBanner.style.display = 'block';
}

// Handle filter change
function handleFilterChange(filter) {
    currentFilter = filter;
    filterEvents();
    
    // Scroll to events grid
    setTimeout(() => {
        const eventsSection = document.querySelector('.events-grid-section');
        if (eventsSection) {
            eventsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 300);
}

// Handle search
function handleSearch() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    searchTerm = eventSearch.value.trim();
    
    // Show/hide clear button
    if (clearSearchBtn) {
        if (searchTerm.length > 0) {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
    }
    
    // Filter events with debounce
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
        filterEvents();
    }, 500);
}

// Clear search
function clearSearch() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (eventSearch) {
        eventSearch.value = '';
        searchTerm = '';
        
        if (clearSearchBtn) {
            clearSearchBtn.classList.remove('visible');
        }
        
        filterEvents();
    }
}

// Load more events
function loadMoreEvents() {
    if (filteredEvents.length > currentPage * eventsPerPage) {
        currentPage++;
        const startIndex = (currentPage - 1) * eventsPerPage;
        const endIndex = Math.min(currentPage * eventsPerPage, filteredEvents.length);
        const eventsToAdd = filteredEvents.slice(startIndex, endIndex);
        
        const eventsGrid = document.getElementById('eventsGrid');
        if (!eventsGrid) return;
        
        // Add new events with animation
        eventsToAdd.forEach((event, index) => {
            const eventCard = createEventCard(event, index);
            eventsGrid.appendChild(eventCard);
        });
        
        // Check if there are more events to load
        hasMoreEvents = filteredEvents.length > currentPage * eventsPerPage;
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer && !hasMoreEvents) {
            loadMoreContainer.style.display = 'none';
        }
    }
}

// Reset all filters
function resetFilters() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    if (eventSearch) {
        eventSearch.value = '';
        searchTerm = '';
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.classList.remove('visible');
    }
    
    currentFilter = 'all';
    
    // Reset active tab
    filterTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === 'all') {
            tab.classList.add('active');
        }
    });
    
    filterEvents();
}

// Scroll to events grid
function scrollToEvents() {
    const eventsSection = document.querySelector('.events-grid-section');
    if (eventsSection) {
        eventsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Update URL with current filter
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentFilter !== 'all') {
        params.set('filter', currentFilter);
    }
    
    if (searchTerm) {
        params.set('search', searchTerm);
    }
    
    const newURL = params.toString() ? `?${params.toString()}` : 'events.html';
    window.history.replaceState({}, '', newURL);
}

// Show loading state
function showLoading(show) {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEvents');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (show) {
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading events...</p>
                </div>
            `;
        }
        if (noEventsMessage) noEventsMessage.style.display = 'none';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    } else {
        const loadingEl = eventsGrid ? eventsGrid.querySelector('.loading-container') : null;
        if (loadingEl) {
            loadingEl.remove();
        }
    }
}

// Show no events message
function showNoEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEvents');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (eventsGrid) eventsGrid.innerHTML = '';
    if (noEventsMessage) noEventsMessage.style.display = 'block';
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
}

// Show error message
function showError(message) {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEvents');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (eventsGrid) {
        eventsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1.5rem;"></i>
                <h3 style="color: #333; margin-bottom: 1rem;">Error Loading Events</h3>
                <p style="color: #666; margin-bottom: 2rem;">${message}</p>
                <button onclick="location.reload()" style="padding: 0.8rem 2rem; background: #4a6fff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
    if (noEventsMessage) noEventsMessage.style.display = 'none';
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
}

// ========== INITIALIZE ON PAGE LOAD ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Events page loaded');
    initializePreloader();
});

// Export functions for HTML onclick events
window.viewEventDetails = viewEventDetails;
window.closeEventModal = closeEventModal;
window.resetFilters = resetFilters;
window.scrollToEvents = scrollToEvents;