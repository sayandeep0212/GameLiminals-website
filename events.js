// ==============================================
// COMBINED SCRIPT FOR EVENTS PAGE - UPDATED FOR RESPONSIVE
// ==============================================

// Global variables
let allEvents = [];
let filteredEvents = [];
let currentFilter = 'all';
let searchTerm = '';
let eventsPerPage = 6;
let currentPage = 1;
let hasMoreEvents = true;

// ========== INITIALIZE ON PAGE LOAD ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Events page loaded');

    // 1. Start loading data immediately (Background)
    // We check if 'db' exists from firebase-config.js
    if (typeof db !== 'undefined') {
        loadEvents();
    } else {
        console.error('Firebase DB not initialized');
    }

    // 2. Initialize UI features
    initializeWebsite();

    // 3. Handle Preloader Animation
    const preloader = document.getElementById('preloader');

    if (preloader) {
        // The CSS animation takes 3 seconds. We wait for it.
        setTimeout(() => {
            // Fade out
            preloader.classList.add('hide-preloader');

            // Remove from display after fade completes
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        }, 3000);
    }
});

// ========== BASIC FUNCTIONALITY ==========

function initializeWebsite() {
    initializeCustomCursor();
    initializeMobileNavigation();
    initializeSmoothScrolling();
    setActiveNavLink();
    setupEventListeners();
    checkURLParameters();
}

// ========== CUSTOM CURSOR ==========

function initializeCustomCursor() {
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

            const target = e.target;
            const isInteractive = target.matches('a, button, .cta-button, .event-card, .filter-tab, .btn-details, .btn-register, .modal-btn, .reset-filters, .load-more-btn, .clear-search');

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
}

// ========== MOBILE NAVIGATION ==========

function initializeMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ========== SMOOTH SCROLLING ==========

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
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
}

// ========== ACTIVE NAV LINK ==========

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage ||
            (currentPage === '' && link.getAttribute('href') === 'index.html') ||
            (link.getAttribute('href').includes('events') && currentPage.includes('events'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ========== EVENTS LOGIC ==========

function setupEventListeners() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            handleFilterChange(tab.dataset.filter);
        });
    });

    const eventSearch = document.getElementById('eventSearch');
    if (eventSearch) {
        eventSearch.addEventListener('input', handleSearch);
    }

    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreEvents);
    }

    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeEventModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEventModal();
        }
    });
}

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

async function loadEvents() {
    try {
        showLoading(true);

        const querySnapshot = await db.collection('events')
            .orderBy('date', 'desc')
            .get();

        if (querySnapshot.empty) {
            showNoEvents();
            updateStats([]);
            showLoading(false);
            return;
        }

        allEvents = [];
        querySnapshot.forEach(doc => {
            const eventData = doc.data();
            const event = {
                id: doc.id,
                ...eventData,
                date: eventData.date ? eventData.date.toDate() : new Date(),
                isClosed: eventData.isClosed || false
            };
            allEvents.push(event);
        });

        console.log(`Loaded ${allEvents.length} events from Firebase`);
        updateStats(allEvents);
        filterEvents();
        checkFeaturedEvent();

    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events. Please try again.');
    } finally {
        showLoading(false);
    }
}

function filterEvents() {
    const now = new Date();
    let filtered = [...allEvents];

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            (event.category && event.category.toLowerCase().includes(searchLower))
        );
    }

    switch (currentFilter) {
        case 'upcoming':
            filtered = filtered.filter(event => event.date > now && !event.isClosed);
            break;
        case 'ongoing':
            filtered = filtered.filter(event => {
                const eventDate = event.date;
                const eventEnd = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
                return eventDate <= now && eventEnd > now && !event.isClosed;
            });
            break;
        case 'workshop':
            filtered = filtered.filter(event => event.category && event.category.toLowerCase().includes('workshop'));
            break;
        case 'hackathon':
            filtered = filtered.filter(event => event.category && event.category.toLowerCase().includes('hackathon'));
            break;
        case 'gamejam':
            filtered = filtered.filter(event => event.category && (event.category.toLowerCase().includes('gamejam') || event.category.toLowerCase().includes('game jam')));
            break;
        case 'closed':
            filtered = filtered.filter(event => event.isClosed || event.date < now);
            break;
    }

    filtered.sort((a, b) => {
        const aIsUpcoming = a.date > now && !a.isClosed;
        const bIsUpcoming = b.date > now && !b.isClosed;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        return b.date - a.date;
    });

    filteredEvents = filtered;
    currentPage = 1;
    hasMoreEvents = filteredEvents.length > eventsPerPage;

    displayEvents();
    updateURL();
}

function displayEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);

    if (currentPage === 1) {
        eventsGrid.innerHTML = '';
    }

    if (eventsToShow.length === 0) {
        showNoEvents();
        return;
    }

    const noEventsMessage = document.getElementById('noEvents');
    if (noEventsMessage) noEventsMessage.style.display = 'none';

    eventsToShow.forEach((event, index) => {
        const eventCard = createEventCard(event, index);
        eventsGrid.appendChild(eventCard);
    });

    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        loadMoreContainer.style.display = (hasMoreEvents && filteredEvents.length > eventsPerPage) ? 'block' : 'none';
    }
}

function createEventCard(event, index) {
    const now = new Date();
    const eventDate = event.date;
    const isUpcoming = eventDate > now && !event.isClosed;
    const isOngoing = eventDate <= now && new Date(eventDate.getTime() + 24 * 60 * 60 * 1000) > now && !event.isClosed;

    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('default', { month: 'short' });
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let statusClass = 'closed';
    let statusText = 'Past';

    if (event.isClosed) { statusClass = 'closed';
        statusText = 'Closed'; } else if (isOngoing) { statusClass = 'ongoing';
        statusText = 'Ongoing'; } else if (isUpcoming) { statusClass = 'upcoming';
        statusText = 'Upcoming'; }

    const card = document.createElement('div');
    card.className = `event-card ${statusClass}`;
    card.style.animationDelay = `${index * 0.1}s`;

    const imageUrl = event.imageUrl || getDefaultEventImage(event.category);

    card.innerHTML = `
        <div class="event-image-container">
            <img src="${imageUrl}" alt="${event.title}" class="event-image" onerror="this.src='${getDefaultEventImage('default')}'">
            <div class="event-overlay">
                <div class="event-status-badge ${statusClass}">${statusText}</div>
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
                <div class="meta-item"><i class="far fa-calendar"></i><span>${formattedDate}</span></div>
                <div class="meta-item"><i class="far fa-clock"></i><span>${event.time || 'TBA'}</span></div>
                <div class="meta-item"><i class="fas fa-map-marker-alt"></i><span>${event.location || 'Adamas University'}</span></div>
            </div>
            <div class="event-actions">
                <button class="btn-details" onclick="viewEventDetails('${event.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                ${!event.isClosed && (isUpcoming || isOngoing) ? 
                    `<a href="eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}" class="btn-register"><i class="fas fa-user-plus"></i> Register</a>` :
                    `<button class="btn-register disabled" disabled><i class="fas fa-lock"></i> Closed</button>`
                }
            </div>
        </div>
    `;
    return card;
}

function getDefaultEventImage(category) {
    const categoryLower = (category || '').toLowerCase();
    if (categoryLower.includes('workshop')) return 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    if (categoryLower.includes('hackathon')) return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    if (categoryLower.includes('gamejam') || categoryLower.includes('game jam')) return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    return 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
}

function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const eventDate = event.date;
    const now = new Date();
    const isUpcoming = eventDate > now && !event.isClosed;
    const isOngoing = eventDate <= now && new Date(eventDate.getTime() + 24 * 60 * 60 * 1000) > now && !event.isClosed;
    
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalRegisterBtn = document.getElementById('modalRegisterBtn');
    
    if (!modalTitle || !modalBody || !modalRegisterBtn) return;
    
    modalTitle.textContent = event.title;
    modalBody.innerHTML = `
        <div class="modal-event-image">
            <img src="${event.imageUrl || getDefaultEventImage(event.category)}" alt="${event.title}" onerror="this.src='${getDefaultEventImage('default')}'">
        </div>
        <div class="modal-event-info">
            <div class="modal-event-category">${event.category || 'General'}</div>
            <div class="modal-event-details">
                <div class="detail-item"><i class="far fa-calendar"></i><div><strong>Date:</strong><span>${formattedDate}</span></div></div>
                <div class="detail-item"><i class="far fa-clock"></i><div><strong>Time:</strong><span>${event.time || 'To be announced'}</span></div></div>
                <div class="detail-item"><i class="fas fa-map-marker-alt"></i><div><strong>Location:</strong><span>${event.location || 'Adamas University'}</span></div></div>
                ${event.maxParticipants ? `<div class="detail-item"><i class="fas fa-users"></i><div><strong>Max Participants:</strong><span>${event.maxParticipants}</span></div></div>` : ''}
            </div>
            <div class="modal-event-description"><h4>Event Description</h4><p>${event.description || 'No description available.'}</p></div>
            ${event.requirements ? `<div class="modal-event-requirements"><h4>Requirements</h4><p>${event.requirements}</p></div>` : ''}
            ${event.prizes ? `<div class="modal-event-prizes"><h4>Prizes & Rewards</h4><p>${event.prizes}</p></div>` : ''}
        </div>
    `;
    
    if (!event.isClosed && (isUpcoming || isOngoing)) {
        modalRegisterBtn.href = `eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}`;
        modalRegisterBtn.style.display = 'flex';
    } else {
        modalRegisterBtn.style.display = 'none';
    }
    
    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeEventModal() {
    const modalOverlay = document.getElementById('eventModal');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function updateStats(events) {
    const now = new Date();
    const totalEventsEl = document.getElementById('totalEvents');
    const upcomingEventsEl = document.getElementById('upcomingEvents');
    const hackathonEventsEl = document.getElementById('hackathonEvents');
    const workshopEventsEl = document.getElementById('workshopEvents');
    
    if (totalEventsEl) totalEventsEl.textContent = events.length;
    
    const upcoming = events.filter(event => event.date > now && !event.isClosed).length;
    if (upcomingEventsEl) upcomingEventsEl.textContent = upcoming;
    
    const hackathons = events.filter(event => event.category && event.category.toLowerCase().includes('hackathon')).length;
    if (hackathonEventsEl) hackathonEventsEl.textContent = hackathons;
    
    const workshops = events.filter(event => event.category && event.category.toLowerCase().includes('workshop')).length;
    if (workshopEventsEl) workshopEventsEl.textContent = workshops;
}

function checkFeaturedEvent() {
    const now = new Date();
    const upcomingEvents = allEvents.filter(event => event.date > now && !event.isClosed);
    
    if (upcomingEvents.length > 0) {
        showFeaturedEvent(upcomingEvents[0]);
    } else {
        const featuredBanner = document.getElementById('featuredBanner');
        if (featuredBanner) featuredBanner.style.display = 'none';
    }
}

function showFeaturedEvent(event) {
    const featuredBanner = document.getElementById('featuredBanner');
    if (!featuredBanner) return;
    
    const eventDate = event.date;
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    document.getElementById('featuredTitle').textContent = event.title;
    document.getElementById('featuredDescription').textContent = event.description || 'Join us for this exciting event!';
    document.getElementById('featuredDate').textContent = formattedDate;
    document.getElementById('featuredTime').textContent = event.time || 'TBA';
    document.getElementById('featuredLocation').textContent = event.location || 'Adamas University';
    document.getElementById('featuredRegisterBtn').href = `eventreg.html?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}`;
    
    featuredBanner.style.display = 'block';
}

function handleFilterChange(filter) {
    currentFilter = filter;
    filterEvents();
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            const eventsSection = document.querySelector('.events-grid-section');
            if (eventsSection) eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

function handleSearch() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    searchTerm = eventSearch.value.trim();
    
    if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);
    }
    
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => filterEvents(), 500);
}

function clearSearch() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    if (eventSearch) {
        eventSearch.value = '';
        searchTerm = '';
        if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
        filterEvents();
    }
}

function loadMoreEvents() {
    if (filteredEvents.length > currentPage * eventsPerPage) {
        currentPage++;
        const startIndex = (currentPage - 1) * eventsPerPage;
        const endIndex = Math.min(currentPage * eventsPerPage, filteredEvents.length);
        const eventsToAdd = filteredEvents.slice(startIndex, endIndex);
        const eventsGrid = document.getElementById('eventsGrid');
        
        eventsToAdd.forEach((event, index) => {
            const eventCard = createEventCard(event, index);
            eventsGrid.appendChild(eventCard);
        });
        
        hasMoreEvents = filteredEvents.length > currentPage * eventsPerPage;
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer && !hasMoreEvents) {
            loadMoreContainer.style.display = 'none';
        }
    }
}

function resetFilters() {
    const eventSearch = document.getElementById('eventSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    if (eventSearch) {
        eventSearch.value = '';
        searchTerm = '';
    }
    if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
    
    currentFilter = 'all';
    filterTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === 'all') tab.classList.add('active');
    });
    
    filterEvents();
}

function scrollToEvents() {
    const eventsSection = document.querySelector('.events-grid-section');
    if (eventsSection) eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateURL() {
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.set('filter', currentFilter);
    if (searchTerm) params.set('search', searchTerm);
    const newURL = params.toString() ? `?${params.toString()}` : 'events.html';
    window.history.replaceState({}, '', newURL);
}

function showLoading(show) {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEvents');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (show) {
        if (eventsGrid) eventsGrid.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Loading events...</p></div>';
        if (noEventsMessage) noEventsMessage.style.display = 'none';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    } else {
        const loadingEl = eventsGrid ? eventsGrid.querySelector('.loading-container') : null;
        if (loadingEl) loadingEl.remove();
    }
}

function showNoEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEvents');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (eventsGrid) eventsGrid.innerHTML = '';
    if (noEventsMessage) noEventsMessage.style.display = 'block';
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
}

function showError(message) {
    const eventsGrid = document.getElementById('eventsGrid');
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
}

// Export functions for HTML onclick events
window.viewEventDetails = viewEventDetails;
window.closeEventModal = closeEventModal;
window.resetFilters = resetFilters;
window.scrollToEvents = scrollToEvents;