// ==============================================
// PROJECTS.JS - FIXED VIDEO AUTOPLAY & STOP LOGIC
// ==============================================

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔥 Projects page initializing...");

    // --- 0. FIREBASE INITIALIZATION ---
    let db;
    try {
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            if (typeof window.firebaseConfig2 !== 'undefined') {
                firebase.initializeApp(window.firebaseConfig2);
                console.log("✅ Firebase initialized with project:", window.firebaseConfig2.projectId);
            } else {
                console.error("❌ firebaseConfig2 is not defined! Check your import order.");
                db = null;
            }
        } else {
             // If already initialized, just log it
             console.log("✅ Firebase was already initialized.");
        }

        if (firebase.apps.length > 0) {
            db = firebase.firestore();
            
            // IMPORTANT: Disable experimentalForceLongPolling to avoid issues
            db.settings({
                experimentalForceLongPolling: false,
                merge: true
            });

            // Enable persistence for offline support
            db.enablePersistence({
                experimentalForceLongPolling: false
            })
            .then(() => console.log("✅ Offline persistence enabled"))
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn("Multiple tabs open - persistence limited");
                } else if (err.code === 'unimplemented') {
                    console.warn("Browser doesn't support persistence");
                }
            });

            console.log("✅ Firestore instance created");
        }
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        db = null;
    }

    // --- 1. STATE MANAGEMENT ---
    let projects = [];
    let currentProjectId = null;
    let userRating = 0;
    let userExcitement = 50;
    let currentProjectData = null;

    // DOM Elements
    const projectGrid = document.getElementById('project-grid');
    const overlay = document.getElementById('project-overlay');
    const closeBtn = document.getElementById('close-overlay');
    const carouselTrack = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');

    // --- VIDEO HELPER: STOP ALL VIDEOS ---
    function stopAllVideos() {
        if (!carouselTrack) return;
        const videos = carouselTrack.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            // Optional: reset to beginning
            // video.currentTime = 0; 
        });
    }

    // --- CUSTOM CURSOR - FIXED AND ENHANCED ---
    function initCustomCursor() {
        const cursor = document.querySelector('.cursor');
        if (!cursor) return;
        
        // Check if touch device - hide cursor on mobile/tablet
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouchDevice) {
            cursor.style.display = 'none';
            return;
        }
        
        cursor.style.opacity = '1';
        cursor.style.visibility = 'visible';
        
        document.addEventListener('mousemove', function(e) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        const interactiveElements = document.querySelectorAll(
            'a, button, .project-card, .nav-link, .social-link, .cta-button, .btn, .star, .excitement-slider, .close-btn, .carousel-btn, .stat-item, .shape, .footer-links a, .marquee-item'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });

        document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
        document.addEventListener('mouseenter', () => cursor.style.opacity = '1');
    }

    // --- 2. LOAD PROJECTS FROM FIREBASE ---
    async function loadProjectsFromFirebase() {
        console.log("📥 Loading projects from Firebase...");

        if (!projectGrid) return;

        // Show loading spinner
        projectGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid rgba(74,111,255,0.1); border-top-color: #4a6fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: var(--text-muted);">Connecting to database...</p>
            </div>
        `;

        try {
            if (!db) {
                console.warn("Firestore not available (Variables missing).");
                loadFallbackProjects(); // Only fallback if code/library is broken
                return;
            }

            const projectsRef = db.collection('projects');
            const snapshot = await projectsRef.orderBy('createdAt', 'desc').get();

            console.log(`📊 Found ${snapshot.size} projects in Firebase`);

            // CASE: Database is working but empty
            if (snapshot.empty) {
                console.log("⚠️ Database connected but empty. Attempting to create samples...");
                
                // Try to create samples. 
                const samplesCreated = await initializeSampleProjects();
                
                if (samplesCreated) {
                     // Reload to fetch the new samples
                     console.log("🔄 Reloading to show new samples...");
                     loadProjectsFromFirebase(); 
                     return;
                } else {
                    // If samples failed (e.g. permissions), SHOW EMPTY STATE.
                    console.log("ℹ️ Rendering empty state (No projects in DB).");
                    projects = [];
                    renderProjects(); 
                    return;
                }
            }

            // CASE: Database has data
            projects = [];
            snapshot.forEach(doc => {
                const projectData = doc.data();
                projects.push({
                    id: doc.id,
                    ...projectData,
                    media: projectData.media || (projectData.imageUrl ? [{ type: 'image', url: projectData.imageUrl }] : []),
                    technologies: Array.isArray(projectData.technologies) ?
                        projectData.technologies :
                        (typeof projectData.technologies === 'string' ?
                            projectData.technologies.split(',').map(t => t.trim()) :
                            [])
                });
            });

            console.log("✅ Projects loaded from Database:", projects.length);
            renderProjects();

        } catch (error) {
            console.error("❌ Error loading from Firebase:", error);
            if (error.code === 'permission-denied') {
                 projectGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                        <i class="fas fa-lock" style="font-size: 3rem; color: #ef4444;"></i>
                        <p style="margin-top: 20px; color: var(--text-muted);">Access Denied. Check Firestore Rules.</p>
                    </div>`;
            } else {
                loadFallbackProjects();
            }
        }
    }

    // --- 3. INITIALIZE SAMPLE PROJECTS IN FIREBASE ---
    async function initializeSampleProjects() {
        console.log("🚀 Creating sample projects...");

        const sampleProjects = [
            {
                title: "Neon Cyberpunk Runner",
                description: "A fast-paced endless runner in a cyberpunk world.",
                fullDescription: "Navigate through a neon-lit cyberpunk cityscape in this fast-paced endless runner. Dodge obstacles, collect power-ups, and upgrade your character.",
                imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
                media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop' }],
                technologies: ["Unity", "C#", "Shader Graph", "Procedural Generation"],
                year: "2023",
                client: "GameDev Studio",
                role: "Game Developer & Designer",
                repoLink: "https://github.com/gameliminals/neon-runner"
            },
            {
                title: "Pixel Adventure Quest",
                description: "A retro-style 2D platformer with RPG elements.",
                fullDescription: "Embark on an epic quest in this charming 2D pixel art platformer. Explore diverse biomes, battle unique enemies, and solve environmental puzzles.",
                imageUrl: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=800&auto=format&fit=crop",
                media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=800&auto=format&fit=crop' }],
                technologies: ["Godot", "GDScript", "Pixel Art", "Tilemaps"],
                year: "2022",
                client: "Indie Game Collective",
                role: "Lead Developer",
                repoLink: "https://github.com/gameliminals/pixel-quest"
            }
        ];

        try {
            if (db) {
                const batch = db.batch();
                sampleProjects.forEach(project => {
                    const docRef = db.collection('projects').doc();
                    batch.set(docRef, {
                        ...project,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                console.log("✅ Sample projects created successfully in Firebase.");
                return true; // Success
            }
        } catch (error) {
            console.error("❌ FAILED to create samples in Database.", error);
            console.warn("⚠️ TIP: Go to Firebase Console -> Firestore Database -> Rules. Change 'allow read, write: if false;' to 'allow read, write: if true;' for development.");
            return false; // Failed
        }
        return false;
    }

    // --- 4. FALLBACK TO LOCAL STORAGE (Only for catastrophic failure) ---
    function loadFallbackProjects() {
        console.log("📁 Loading fallback projects (Offline Mode)");
        // Only trigger this if we absolutely cannot reach Firebase
        const saved = localStorage.getItem('gameliminals_projects_fallback');
        if (saved) {
            try {
                projects = JSON.parse(saved);
            } catch (e) {
                projects = getDefaultProjects();
            }
        } else {
            projects = getDefaultProjects();
            localStorage.setItem('gameliminals_projects_fallback', JSON.stringify(projects));
        }
        renderProjects();
    }

    function getDefaultProjects() {
        return [{
            id: 'default-1',
            title: "Offline Preview Project",
            description: "Database connection failed. This is a local preview.",
            fullDescription: "If you see this project, the script could not connect to Firebase. Check your internet connection or API Key.",
            imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=800&auto=format&fit=crop",
            media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=800&auto=format&fit=crop' }],
            technologies: ["Offline Mode"],
            year: "2026",
            client: "System",
            role: "Debugger",
            repoLink: "#"
        }];
    }

    // --- 5. RENDER PROJECTS GRID ---
    function renderProjects() {
        if (!projectGrid) return;

        if (!projects || projects.length === 0) {
            projectGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-muted);"></i>
                    <p style="margin-top: 20px; color: var(--text-muted);">No projects found in Database.</p>
                    <p style="font-size: 0.9rem; color: #666;">(Add a project in Firebase Console to see it here)</p>
                </div>
            `;
            return;
        }

        projectGrid.innerHTML = '';

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.projectId = project.id;

            const techTags = (project.technologies || [])
                .slice(0, 2)
                .map(tech => `<span class="tech-tag">${tech}</span>`)
                .join('');

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${project.imageUrl || 'https://via.placeholder.com/400x300'}" 
                             alt="${project.title}"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/400x300'">
                    </div>
                    <div class="card-back">
                        <div class="project-card-content">
                            <h3>${project.title || 'Untitled'}</h3>
                            <p>${project.description || 'No description available.'}</p>
                            <div class="project-tags">
                                ${techTags}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showProjectDetails(project);
            });

            if (!('ontouchstart' in window)) {
                card.addEventListener('mouseenter', () => card.classList.add('flipped'));
                card.addEventListener('mouseleave', () => card.classList.remove('flipped'));
            }

            projectGrid.appendChild(card);
        });

        // Mobile flip handler
        if ('ontouchstart' in window) {
            document.querySelectorAll('.project-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    e.preventDefault();
                    const wasFlipped = this.classList.contains('flipped');
                    document.querySelectorAll('.project-card.flipped').forEach(c => {
                        if (c !== this) c.classList.remove('flipped');
                    });
                    if (!wasFlipped) this.classList.add('flipped');
                });
            });
        }
    }

    // --- 6. SHOW PROJECT DETAILS (WITH VIDEO AUTOPLAY) ---
    async function showProjectDetails(project) {
        currentProjectId = project.id;
        currentProjectData = project;

        document.getElementById('overlay-title').textContent = project.title || 'Untitled';
        document.getElementById('overlay-date').textContent = project.year || 'N/A';
        document.getElementById('overlay-desc').textContent = project.fullDescription || project.description || 'No description available.';
        document.getElementById('overlay-client').textContent = project.client || 'GameLiminals';
        document.getElementById('overlay-role').textContent = project.role || 'Game Developer';

        const techList = document.getElementById('overlay-tech');
        techList.innerHTML = '';
        (project.technologies || []).forEach(tech => {
            const li = document.createElement('li');
            li.textContent = tech;
            techList.appendChild(li);
        });

        const existingGithub = document.querySelector('.github-btn-added');
        if (existingGithub) existingGithub.remove();

        if (project.repoLink && project.repoLink !== '#') {
            const githubBtn = document.createElement('a');
            githubBtn.href = project.repoLink;
            githubBtn.className = 'project-link-btn github-btn-added';
            githubBtn.target = '_blank';
            githubBtn.rel = 'noopener noreferrer';
            githubBtn.innerHTML = '<i class="fab fa-github"></i> View Code on GitHub';

            const feedbackButtons = document.querySelector('.feedback-buttons');
            const submitBtn = document.getElementById('submit-feedback');
            if (feedbackButtons && submitBtn) {
                feedbackButtons.insertBefore(githubBtn, submitBtn.nextSibling);
            }
        }

        // Initialize carousel
        setupCarousel(project);
        
        resetFeedbackForm();
        await loadFeedbackStats(project.id);

        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        const overlayContent = document.querySelector('.overlay-content');
        if (overlayContent) overlayContent.scrollTop = 0;

        // --- AUTOPLAY FIX: Check if first slide is video and play it ---
        const firstSlide = carouselTrack.children[0];
        if (firstSlide) {
            const video = firstSlide.querySelector('video');
            if (video) {
                // Short timeout to ensure overlay transition doesn't block play
                setTimeout(() => {
                    video.play().catch(e => console.log("Autoplay blocked:", e));
                }, 100);
            }
        }
    }

    // --- 7. CAROUSEL SETUP (WITH VIDEO STOP/PLAY) ---
    function setupCarousel(project) {
        if (!carouselTrack) return;

        carouselTrack.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        const mediaItems = project.media && project.media.length > 0 ? project.media : [{ type: 'image', url: project.imageUrl || 'https://via.placeholder.com/800x450' }];

        let currentSlide = 0;
        const totalSlides = mediaItems.length;

        mediaItems.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';

            if (item.type === 'video') {
                const video = document.createElement('video');
                video.src = item.url;
                video.controls = true;
                video.playsInline = true;
                video.preload = 'metadata';
                // Add muted attribute to allow autoplay in most browsers
                // video.muted = true; 
                slide.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = `${project.title} - Image ${index + 1}`;
                img.loading = 'lazy';
                img.onerror = function() { this.src = 'https://via.placeholder.com/800x450'; };
                slide.appendChild(img);
            }

            carouselTrack.appendChild(slide);

            if (dotsContainer) {
                const dot = document.createElement('div');
                dot.className = 'dot' + (index === 0 ? ' active' : '');
                dot.addEventListener('click', () => {
                    currentSlide = index;
                    updateCarousel(currentSlide);
                });
                dotsContainer.appendChild(dot);
            }
        });

        function updateCarousel(index) {
            if (!carouselTrack) return;
            carouselTrack.style.transform = `translateX(-${index * 100}%)`;

            if (dotsContainer) {
                const dots = dotsContainer.querySelectorAll('.dot');
                dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            }

            // --- STOP ALL VIDEOS when sliding ---
            stopAllVideos();

            // --- PLAY CURRENT VIDEO if exists ---
            const currentSlideEl = carouselTrack.children[index];
            if (currentSlideEl) {
                const video = currentSlideEl.querySelector('video');
                if (video) {
                    video.play().catch(e => console.log("Video play failed:", e));
                }
            }
        }

        if (prevBtn && nextBtn) {
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                updateCarousel(currentSlide);
            };

            nextBtn.onclick = (e) => {
                e.stopPropagation();
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel(currentSlide);
            };
        }
        // Initial set without playing video instantly (showProjectDetails handles the first play)
        carouselTrack.style.transform = `translateX(0%)`;
    }

    // --- 8. FEEDBACK SYSTEM ---
    function initializeFeedbackSystem() {
        const stars = document.querySelectorAll('.star');
        const ratingValue = document.getElementById('rating-value');
        const excitementSlider = document.getElementById('excitement-slider');
        const excitementPercentage = document.getElementById('excitement-percentage');
        const excitementText = document.getElementById('excitement-text');
        const submitBtn = document.getElementById('submit-feedback');
        const feedbackText = document.getElementById('feedback-text');

        stars.forEach(star => {
            star.addEventListener('click', function() {
                userRating = parseInt(this.dataset.value);
                stars.forEach((s, i) => {
                    if (i < userRating) { s.textContent = '★'; s.classList.add('active'); }
                    else { s.textContent = '☆'; s.classList.remove('active'); }
                });
                if (ratingValue) ratingValue.textContent = `${userRating}/5`;
            });

            star.addEventListener('mouseover', function() {
                const val = parseInt(this.dataset.value);
                stars.forEach((s, i) => s.textContent = i < val ? '★' : '☆');
            });

            star.addEventListener('mouseout', function() {
                stars.forEach((s, i) => s.textContent = i < userRating ? '★' : '☆');
            });
        });

        if (excitementSlider) {
            excitementSlider.addEventListener('input', function() {
                userExcitement = parseInt(this.value);
                if (excitementPercentage) excitementPercentage.textContent = `${userExcitement}%`;
                let text = 'Moderate excitement';
                if (userExcitement < 20) text = 'Not interested';
                else if (userExcitement < 40) text = 'Slightly interested';
                else if (userExcitement < 60) text = 'Moderate excitement';
                else if (userExcitement < 80) text = 'Excited to try';
                else text = 'Can\'t wait to play!';
                if (excitementText) excitementText.textContent = text;
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', async function() {
                if (userRating === 0) {
                    showNotification('Please select a rating!', 'warning');
                    return;
                }
                if (!currentProjectId) {
                    showNotification('No project selected', 'error');
                    return;
                }

                const feedback = feedbackText ? feedbackText.value.trim() : '';
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

                const success = await saveFeedback(currentProjectId, userRating, feedback, userExcitement);

                if (success) {
                    showNotification('Thank you for your feedback!', 'success');
                    resetFeedbackForm();
                    await loadFeedbackStats(currentProjectId);
                } else {
                    showNotification('Failed to save feedback.', 'error');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
            });
        }
    }

    async function saveFeedback(projectId, rating, feedback, excitement) {
        // Save to LocalStorage (Always works)
        try {
            const feedbackData = {
                projectId, rating, feedback, excitement,
                timestamp: new Date().toISOString(),
                id: 'local-' + Date.now()
            };
            const existing = JSON.parse(localStorage.getItem(`feedback_${projectId}`)) || [];
            existing.push(feedbackData);
            localStorage.setItem(`feedback_${projectId}`, JSON.stringify(existing));
        } catch (e) { console.error(e); }

        // Save to Firebase (If connected)
        if (db) {
            try {
                const feedbackDoc = {
                    projectId: projectId,
                    rating: Number(rating),
                    feedback: feedback || '',
                    excitement: Number(excitement),
                    projectTitle: currentProjectData?.title || 'Unknown',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent || 'unknown'
                };
                await db.collection('project_feedback').add(feedbackDoc);
                console.log("✅ Feedback saved to Firebase");
                return true;
            } catch (error) {
                console.error("❌ Firebase feedback error:", error);
                // Return true anyway since we saved to localStorage
                return true;
            }
        }
        return true;
    }

    async function loadFeedbackStats(projectId) {
        let totalRating = 0;
        let totalExcitement = 0;
        let totalCount = 0;

        // Load local
        try {
            const localFeedback = JSON.parse(localStorage.getItem(`feedback_${projectId}`)) || [];
            localFeedback.forEach(fb => {
                totalRating += fb.rating || 0;
                totalExcitement += fb.excitement || 0;
                totalCount++;
            });
        } catch (e) {}

        // Load Firebase
        if (db) {
            try {
                const snapshot = await db.collection('project_feedback')
                    .where('projectId', '==', projectId)
                    .get();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalRating += data.rating || 0;
                    totalExcitement += data.excitement || 0;
                    totalCount++;
                });
            } catch (error) {
                console.error("Stats error (likely permissions):", error);
            }
        }

        const avgRating = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : '0.0';
        const avgExcitement = totalCount > 0 ? Math.round(totalExcitement / totalCount) : 0;

        const avgRatingEl = document.getElementById('average-rating');
        const totalFeedbackEl = document.getElementById('total-feedback');
        const avgExcitementEl = document.getElementById('average-excitement');
        
        if (avgRatingEl) avgRatingEl.textContent = avgRating;
        if (totalFeedbackEl) totalFeedbackEl.textContent = totalCount;
        if (avgExcitementEl) avgExcitementEl.textContent = avgExcitement + '%';
    }

    function resetFeedbackForm() {
        userRating = 0;
        userExcitement = 50;
        document.querySelectorAll('.star').forEach(star => {
            star.textContent = '☆';
            star.classList.remove('active');
        });
        if (document.getElementById('rating-value')) document.getElementById('rating-value').textContent = '0/5';
        if (document.getElementById('feedback-text')) document.getElementById('feedback-text').value = '';
        if (document.getElementById('excitement-slider')) document.getElementById('excitement-slider').value = 50;
        if (document.getElementById('excitement-percentage')) document.getElementById('excitement-percentage').textContent = '50%';
        if (document.getElementById('excitement-text')) document.getElementById('excitement-text').textContent = 'Moderate excitement';
    }

    // --- 9. NOTIFICATION SYSTEM ---
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `projects-notification notification-${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#4a6fff'};
            color: white; border-radius: 8px; display: flex; align-items: center; gap: 15px;
            z-index: 10000; animation: slideIn 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            max-width: 350px; font-size: 14px;
        `;
        notification.innerHTML = `<span>${message}</span><button style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">&times;</button>`;
        
        notification.querySelector('button').onclick = () => notification.remove();
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    // --- 10. EVENT LISTENERS ---
    function setupEventListeners() {
        // --- CLOSE ACTION: STOP VIDEOS ---
        const closeAction = () => {
            overlay.classList.add('hidden'); 
            document.body.style.overflow = 'auto';
            stopAllVideos(); // <--- CRITICAL FIX HERE
        };

        if (closeBtn) closeBtn.addEventListener('click', closeAction);
        
        if (overlay) overlay.addEventListener('click', (e) => { 
            if(e.target === overlay) closeAction(); 
        });
        
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape' && overlay) closeAction();
        });
        
        window.addEventListener('resize', () => {
             const cursor = document.querySelector('.cursor');
             if(cursor) cursor.style.display = ('ontouchstart' in window) ? 'none' : 'block';
        });
    }

    // --- 11. ADD CSS STYLES ---
    function addStyles() {
        if (document.getElementById('projects-custom-styles')) return;
        const style = document.createElement('style');
        style.id = 'projects-custom-styles';
        style.textContent = `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .projects-notification { font-family: 'Poppins', sans-serif; font-weight: 500; }
        `;
        document.head.appendChild(style);
    }

    // --- 12. CURSOR & INIT ---
    function init() {
        console.log("🚀 Initializing projects page...");
        if (!document.querySelector('.cursor')) {
            const cursor = document.createElement('div');
            cursor.className = 'cursor';
            document.body.appendChild(cursor);
        }
        addStyles();
        initCustomCursor();
        initializeFeedbackSystem();
        setupEventListeners();

        if (db) {
            loadProjectsFromFirebase();
        } else {
            console.warn("⚠️ Firebase not available, using fallback");
            loadFallbackProjects();
        }
    }

    init();
});