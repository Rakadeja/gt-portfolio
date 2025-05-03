// assets/js/garage-carousel.js
// Handles carousel navigation, info panel updates, related images grid,
// and lightbox functionality for the My Garage page.

document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const garageContainer = document.querySelector('.garage-container'); // Main container for checks
    const track = document.querySelector('.garage-container .carousel-track');
    const nextButton = document.querySelector('.garage-container .carousel-button-next');
    const prevButton = document.querySelector('.garage-container .carousel-button-prev');
    const infoPanel = document.querySelector('.garage-info-panel');
    const relatedImagesContainer = document.getElementById('garage-info-related-images');

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');

    // Info Panel Detail Elements
    const infoNickname = document.getElementById('garage-info-nickname');
    const infoMakeModel = document.getElementById('garage-info-makemodel');
    const infoYear = document.getElementById('garage-info-year');
    const infoEngine = document.getElementById('garage-info-engine');
    const infoPower = document.getElementById('garage-info-power');
    const infoTorque = document.getElementById('garage-info-torque');
    const infoColor = document.getElementById('garage-info-color');
    const infoPurchase = document.getElementById('garage-info-purchase');
    const infoDescription = document.getElementById('garage-info-description');
    const infoModsList = document.getElementById('garage-info-mods');


    // --- Basic Checks ---
    // Check if we are on the garage page by looking for the main container
    if (!garageContainer || !track || !infoPanel || !relatedImagesContainer || !infoNickname) {
        // console.log("Essential garage page elements not found. Exiting garage-carousel.js");
        return; // Exit script if not on the correct page or core elements are missing
    }

    const slides = Array.from(track.children);
    if (slides.length === 0) {
        console.warn("No slides found in garage carousel track.");
        // Potentially hide the related images container title if it exists
        const relatedImagesSection = document.querySelector('.related-images-section');
        if (relatedImagesSection) relatedImagesSection.style.display = 'none';
        return; // Stop if no slides generated
    }

    // Check if lightbox elements exist - determines if lightbox logic runs
    const lightboxEnabled = lightbox && lightboxImage && lightboxTitle && lightboxDescription;
    if (!lightboxEnabled) {
        console.warn("Lightbox elements not fully found. Lightbox functionality will be disabled.");
    }

    // Hide nav buttons if only one car
    if (slides.length <= 1) {
        if (nextButton) nextButton.style.display = 'none';
        if (prevButton) prevButton.style.display = 'none';
    }
    // --- End Basic Checks ---


    // --- State Variables ---
    let currentIndex = 0;
    let slideWidth = 0;
    let carsData = []; // Array to hold the parsed data for each car
    let isResizeDebounced = null; // For debouncing resize


    // --- Core Functions ---

    /**
     * Calculates slide width, parses embedded JSON data from slides.
     * Must be called after elements are visible and have dimensions.
     */
    const setupCarousel = () => {
        // Ensure slides are visible and have width before calculating
        if (!slides[0] || slides[0].offsetParent === null) {
            console.warn("Carousel slides not visible for width calculation. Retrying...");
            // Retry after a short delay allows CSS/layout to settle
            setTimeout(setupCarousel, 100);
            return;
        }

        slideWidth = slides[0].getBoundingClientRect().width;
        if (slideWidth <= 0) {
            console.warn(`Calculated slide width is ${slideWidth}. Check visibility/CSS. Retrying...`);
            // Retry if width is still 0
            setTimeout(setupCarousel, 100);
            return;
        }

        // Parse and store car data from data attributes only once
        if (carsData.length === 0) {
            carsData = slides.map((slide, index) => {
                try {
                    // Ensure the data attribute name matches the one in garage.html
                    return JSON.parse(slide.dataset.carInfo || '{}');
                } catch (e) {
                    console.error(`Failed to parse car info JSON for slide ${index}:`, slide.dataset.carInfo, e);
                    return {}; // Return empty object on error to prevent breaking map
                }
            });
        }

        // Apply initial position and content
        moveToSlide(currentIndex); // Position the track correctly
        updateInfoPanel(currentIndex); // Populate the info panel for the first car
    };

    /**
     * Moves the carousel track horizontally to show the target slide.
     * @param {number} targetIndex - The index of the slide to move to.
     */
    const moveToSlide = (targetIndex) => {
        if (!track || slideWidth <= 0) return; // Don't move if width is unknown or 0
        const amountToMove = targetIndex * slideWidth;
        track.style.transform = `translateX(-${amountToMove}px)`;
        currentIndex = targetIndex;
    };

    /**
     * Updates the entire side info panel content based on the selected car index.
     * @param {number} targetIndex - The index of the currently selected car.
     */
    const updateInfoPanel = (targetIndex) => {
        const carData = carsData[targetIndex]; // Get pre-parsed data
        if (!carData || Object.keys(carData).length === 0) {
            console.warn(`No valid car data found for index ${targetIndex}`);
            // Optionally clear the panel or display a default message
            infoNickname.textContent = 'Error';
            infoMakeModel.textContent = 'Car data unavailable';
            // Clear other fields...
            relatedImagesContainer.innerHTML = '<p>Car data could not be loaded.</p>';
            return;
        }

        // Update simple text fields safely
        infoNickname.textContent = carData.nickname || carData.model || '';
        infoMakeModel.textContent = `${carData.make || ''} ${carData.model || ''}`;
        infoYear.textContent = carData.year || 'N/A';
        infoEngine.textContent = carData.engine || 'N/A';
        infoPower.textContent = carData.power || 'N/A';
        infoTorque.textContent = carData.torque || 'N/A';
        infoColor.textContent = carData.color || 'N/A';
        infoDescription.textContent = carData.description || 'No description available.';
        infoPurchase.textContent = carData.purchase_date ? formatDate(carData.purchase_date) : 'N/A';

        // Update Mods List
        infoModsList.innerHTML = ''; // Clear previous mods
        if (carData.mods && Array.isArray(carData.mods) && carData.mods.length > 0) {
            carData.mods.forEach(mod => {
                const li = document.createElement('li');
                li.textContent = mod;
                infoModsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'None listed.';
            infoModsList.appendChild(li);
        }

        // Update Related Images Grid
        relatedImagesContainer.innerHTML = ''; // Clear previous images

        if (carData && carData.images && Array.isArray(carData.images) && carData.images.length > 0) {
            carData.images.forEach(imgData => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'related-image-item';
                itemDiv.setAttribute('role', 'button');
                itemDiv.setAttribute('tabindex', '0');

                // *** Construct correct paths using basePath ***
                const imageUrl = imgData.url ? `<span class="math-inline">\{basePath\}</span>{imgData.url}` : `${basePath}/assets/images/placeholder.png`;
                const imageSrcForData = imgData.url ? `<span class="math-inline">\{basePath\}</span>{imgData.url}` : ''; // Store full path for lightbox if needed, or just original relative

                itemDiv.dataset.src = imgData.url || ''; // Keep original relative path in dataset if preferred for lightbox? Or store full path? Let's store original for now.
                itemDiv.dataset.title = imgData.title || '';
                itemDiv.dataset.description = imgData.description || '';

                const img = document.createElement('img');
                img.src = imageUrl; // Use the correctly constructed URL
                img.alt = imgData.title || carData.nickname || 'Related image';
                img.loading = 'lazy';

                itemDiv.appendChild(img);
                relatedImagesContainer.appendChild(itemDiv);
            });
        } else {
            relatedImagesContainer.innerHTML = '<p>No related images available.</p>';
        }
    };

    /**
     * Formats a date string using browser's locale settings.
     * Treats input date as UTC to avoid unexpected timezone shifts.
     * @param {string} dateString - The date string to format (e.g., "YYYY-MM-DD").
     * @returns {string} Formatted date string or original string on error.
     */
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            // Append time and Z to ensure it's parsed as UTC
            const date = new Date(`${dateString}T00:00:00Z`);
            // Check if the date is valid after parsing
            if (isNaN(date.getTime())) {
                throw new Error("Invalid date");
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
            return date.toLocaleDateString(undefined, options);
        } catch (e) {
            // console.warn("Could not format date:", dateString, e);
            return dateString; // Return original string if formatting fails
        }
    };


    // --- Lightbox Functions ---
    /**
     * Opens the lightbox with the specified image and caption.
     * @param {string} imageSrc - The source URL of the image.
     * @param {string} imageTitle - The title for the caption.
     * @param {string} imageDescription - The description for the caption.
     */
    const openLightbox = (imageSrc, imageTitle, imageDescription) => {
        if (!lightboxEnabled || !imageSrc) return;

        // Assume imageSrc from dataset is root-relative (starts with /)
        const fullImageSrc = imageSrc.startsWith('/') ? `${basePath}${imageSrc}` : imageSrc;

        lightboxImage.setAttribute('src', fullImageSrc);
        lightboxImage.setAttribute('alt', imageTitle || 'Enlarged image');
        lightboxTitle.textContent = imageTitle || '';
        lightboxDescription.textContent = imageDescription || '';

        const captionElement = lightbox.querySelector('.lightbox-caption');
        if (captionElement) {
            captionElement.style.display = (!imageTitle && !imageDescription) ? 'none' : 'block';
        }
        lightbox.classList.add('is-visible');
    };

    /** Closes the lightbox. */
    const closeLightbox = () => {
        if (!lightboxEnabled) return;
        lightbox.classList.remove('is-visible');
        lightboxTitle.textContent = ''; // Clear text
        lightboxDescription.textContent = ''; // Clear text

        // Optional: Clear src after transition ends to prevent potential flicker
        setTimeout(() => {
            if (!lightbox.classList.contains('is-visible')) { // Check if still hidden
                lightboxImage.setAttribute('src', '');
                lightboxImage.setAttribute('alt', '');
            }
        }, 300); // Match CSS transition duration

        // document.body.style.overflow = ''; // Optional: enable body scroll
    };


    // --- Event Listeners ---

    // Carousel Navigation Buttons
    nextButton?.addEventListener('click', () => {
        let nextIndex = (currentIndex + 1) % slides.length;
        moveToSlide(nextIndex);
        updateInfoPanel(nextIndex);
    });

    prevButton?.addEventListener('click', () => {
        let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        moveToSlide(prevIndex);
        updateInfoPanel(prevIndex);
    });

    // Related Images Grid - Click/Keydown for Lightbox (Event Delegation)
    relatedImagesContainer.addEventListener('click', (e) => {
        if (!lightboxEnabled) return;
        const clickedItem = e.target.closest('.related-image-item');
        if (clickedItem) {
            const imageSrc = clickedItem.dataset.src;
            const imageTitle = clickedItem.dataset.title;
            const imageDescription = clickedItem.dataset.description;
            if (imageSrc) {
                openLightbox(imageSrc, imageTitle, imageDescription);
            }
        }
    });

    relatedImagesContainer.addEventListener('keydown', (e) => {
        if (!lightboxEnabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedItem = e.target.closest('.related-image-item');
            if (focusedItem) {
                e.preventDefault(); // Prevent default spacebar scroll / button activation
                const imageSrc = focusedItem.dataset.src;
                const imageTitle = focusedItem.dataset.title;
                const imageDescription = focusedItem.dataset.description;
                if (imageSrc) {
                    openLightbox(imageSrc, imageTitle, imageDescription);
                }
            }
        }
    });


    // Lightbox Close Listeners (Only add if lightbox is enabled)
    if (lightboxEnabled) {
        lightbox.addEventListener('click', (e) => {
            // Close if the click is directly on the overlay backdrop or the contained image/caption
            if (e.target === lightbox || e.target.closest('.lightbox-content')) {
                closeLightbox();
            }
        });

        window.addEventListener('keydown', (e) => { // Close lightbox with Escape key
            if (e.key === 'Escape' && lightbox.classList.contains('is-visible')) {
                closeLightbox();
            }
        });
    }


    // Window Resize Listener (Debounced)
    window.addEventListener('resize', () => {
        clearTimeout(isResizeDebounced);
        isResizeDebounced = setTimeout(() => {
            console.log("Window resized, recalculating garage carousel layout.");
            // Recalculate width and update positions/layout as needed
            // Only call setupCarousel again if width calculation is needed,
            // otherwise just repositioning might be sufficient.
            const oldWidth = slideWidth;
            slideWidth = slides[0] ? slides[0].getBoundingClientRect().width : 0;
            if (slideWidth > 0 && slideWidth !== oldWidth) {
                moveToSlide(currentIndex); // Reposition track based on new width
            } else if (slideWidth <= 0) {
                // Attempt setup again if width became 0
                console.warn("Slide width became 0 on resize, attempting setup again.");
                setupCarousel();
            }
        }, 250); // Debounce delay in milliseconds
    });

    // --- Initial Setup ---
    // Attempt setup after DOM is loaded. setupCarousel has internal retries if width isn't ready.
    setupCarousel();

}); // End DOMContentLoaded