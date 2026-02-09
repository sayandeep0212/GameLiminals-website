// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. CUSTOM CURSOR LOGIC ---
    const cursor = document.querySelector('.cursor');

    if (cursor) {
        // Update cursor position on mouse move
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Add hover effects for interactive elements
        const hoverTargets = document.querySelectorAll('a, button, .cta-button, .stat-item, .feature-card, input');

        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
            });
            target.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
            });
        });
    }

    // --- 2. NEWSLETTER SUBSCRIPTION LOGIC ---
    const subscribeBtn = document.querySelector('.newsletter-form .cta-button');
    const emailInput = document.querySelector('.newsletter-form input[type="email"]');

    if (subscribeBtn && emailInput) {
        subscribeBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            const email = emailInput.value.trim();

            // Basic Validation
            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            if (!validateEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            try {
                // Disable button to prevent multiple clicks
                subscribeBtn.disabled = true;
                subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

                // Add to Firebase Firestore
                // Collection: newsletter_subscribers
                await db.collection("newsletter_subscribers").add({
                    email: email,
                    subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    source: "projects_page"
                });

                // Success UI
                alert('Thank you for subscribing! We\'ll notify you when projects go live.');
                emailInput.value = '';

            } catch (error) {
                console.error("Error adding document: ", error);
                alert('Something went wrong. Please try again later.');
            } finally {
                // Re-enable button
                subscribeBtn.disabled = false;
                subscribeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
            }
        });
    }

    // Helper function for email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});