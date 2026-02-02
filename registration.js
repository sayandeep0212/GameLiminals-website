// Preloader Animation - Updated for smooth loading bar
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');
    const progressFill = document.querySelector('.progress-bar-fill');

    // Check if preloader exists
    if (!preloader || !progressFill) {
        initializeWebsite();
        return;
    }

    // Reset CSS animation so JS can control the progress bar width
    progressFill.style.animation = 'none';
    progressFill.style.width = '0%';
    preloader.style.display = 'flex';

    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        // Randomize loading speed
        progress += Math.random() * 5;

        if (progress > 100) {
            progress = 100;
            clearInterval(loadingInterval);
            progressFill.style.width = '100%';

            // Hide preloader after completion
            setTimeout(() => {
                // Add the class that sets opacity: 0 (from CSS)
                preloader.classList.add('hide-preloader');

                // Wait for the fade-out transition (0.6s) to finish
                setTimeout(() => {
                    preloader.style.display = 'none';
                    // Initialize the rest of the website features
                    initializeWebsite();
                }, 600);
            }, 500);
        } else {
            progressFill.style.width = `${progress}%`;
        }
    }, 50); // Speed of updates
});

// Initialize main website functionality
function initializeWebsite() {
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
            const isInteractive = target.matches('a, button, .cta-button, .submit-button, .nav-link, .discord-link, .popup-close, .popup-home, .form-group input, .form-group select, .form-group textarea');

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

    // Initialize form
    initializeRegistrationForm();
}

// Initialize Registration Form
function initializeRegistrationForm() {
    const form = document.getElementById('studentRegistrationForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Initialize form validation
    initializeFormValidation();

    // Real-time validation
    form.addEventListener('input', function(e) {
        const element = e.target;
        validateField(element);
    });

    form.addEventListener('change', function(e) {
        const element = e.target;
        validateField(element);
    });
}

// Initialize Form Validation
function initializeFormValidation() {
    const form = document.getElementById('studentRegistrationForm');
    const formElements = form.querySelectorAll('input, select, textarea');

    formElements.forEach(element => {
        // Add error span after each form element
        if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('form-error')) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'form-error';
            element.parentNode.insertBefore(errorSpan, element.nextSibling);
        }
    });
}

// Validate Individual Field
function validateField(element) {
    const errorElement = element.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('form-error')) return;

    // Clear previous errors
    element.classList.remove('error', 'success');
    errorElement.classList.remove('active');
    errorElement.textContent = '';

    // Skip validation for optional fields if empty
    if (element.id === 'remarks' && element.value.trim() === '') {
        return true;
    }

    let isValid = true;
    let errorMessage = '';

    switch (element.id) {
        case 'fullName':
            if (element.value.trim().length < 3) {
                errorMessage = 'Full name must be at least 3 characters';
                isValid = false;
            }
            break;

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(element.value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
            break;

        case 'phone':
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(element.value)) {
                errorMessage = 'Please enter a valid 10-digit phone number';
                isValid = false;
            }
            break;

        case 'registrationNo':
        case 'rollNo':
        case 'department':
            if (element.value.trim() === '') {
                errorMessage = 'This field is required';
                isValid = false;
            }
            break;

        case 'whyJoin':
            if (element.value.trim().length < 20) {
                errorMessage = 'Please provide a more detailed response (minimum 20 characters)';
                isValid = false;
            }
            break;

        case 'semester':
            if (element.value === '') {
                errorMessage = 'Please select your semester';
                isValid = false;
            }
            break;

        default:
            if (element.required && element.value.trim() === '') {
                errorMessage = 'This field is required';
                isValid = false;
            }
    }

    // Update UI
    if (!isValid) {
        element.classList.add('error');
        element.classList.remove('success');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('active');
    } else {
        element.classList.add('success');
        element.classList.remove('error');
    }

    return isValid;
}

// Show Error Message
function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="toast-close"><i class="fas fa-times"></i></button>
            `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    });

    // Remove toast after 8 seconds
    setTimeout(() => {
        if (toast.parentNode && toast.classList.contains('show')) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 8000);
}

// Detect mobile devices and apply fixes
function detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isSamsung = /Samsung|SM-/.test(userAgent);

    if (isIOS || isSamsung) {
        document.documentElement.classList.add('mobile-device');
        if (isIOS) document.documentElement.classList.add('ios-device');
        if (isSamsung) document.documentElement.classList.add('samsung-device');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    detectMobileDevice();
});

// Show Success Popup
function showSuccessPopup(applicationId) {
    const popup = document.getElementById('successPopup');
    const appIdElement = document.getElementById('popupAppId');
    const dateElement = document.getElementById('popupDate');

    // Set popup data
    appIdElement.textContent = applicationId;
    dateElement.textContent = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Show popup
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close popup button
    const closeBtn = document.getElementById('popupClose');
    const closeHandler = () => {
        popup.classList.remove('active');
        document.body.style.overflow = 'auto';
        // Redirect to home after a moment
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    };

    closeBtn.addEventListener('click', closeHandler);

    // Close popup on background click
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeHandler();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            closeHandler();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// Export functions for Firebase integration
window.showSuccessPopup = showSuccessPopup;
window.showError = showError;