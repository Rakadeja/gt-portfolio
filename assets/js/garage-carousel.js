// assets/js/garage-carousel.js
// Handles carousel navigation, info panel updates, related images grid,
// and lightbox functionality for the My Garage page.
// Uses standard string concatenation for path construction.

document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const garageContainer = document.querySelector('.garage-container');
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

    // --- Read Base URL (defined in default.html) ---
    // Ensure the <script> tag setting window.siteBaseurl is in your layout
    const basePath = window.siteBaseurl || ''; // Default to empty string

    // --- Basic Checks ---
    if (!garageContainer || !track || !infoPanel || !relatedImagesContainer || !infoNickname) {
        // console.log("Essential garage page elements not found. Exiting script.");
        return;
    }

    const slides = Array.from(track.children);
    if (slides.length === 0) {
        console.warn("No slides found in garage carousel track.");
        const relatedImagesSection = document.querySelector('.related-images-section');
        if (relatedImagesSection) relatedImagesSection.style.display = 'none';
        return;
    }

    const lightboxEnabled = lightbox && lightboxImage && lightboxTitle && lightboxDescription;
    if (!lightboxEnabled) {
        // console.warn("Lightbox elements not fully found. Lightbox functionality will be disabled.");
    }

    if (slides.length <= 1) {
        if (nextButton) nextButton.style.display = 'none';
        if (prevButton) prevButton.style.display = 'none';
    }
    // --- End Basic Checks ---

    // --- State Variables ---
    let currentIndex = 0;
    let slideWidth = 0;
    let carsData = [];
    let isResizeDebounced = null;

    // --- Core Functions ---

    const setupCarousel = () => {
        if (!slides[0] || slides[0].offsetParent === null) {
            // console.warn("Carousel slides not ready for width calc. Retrying...");
            setTimeout(setupCarousel, 100);
            return;
        }
        slideWidth = slides[0].getBoundingClientRect().width;
        if (slideWidth <= 0) {
            // console.warn(`Slide width calc failed (${slideWidth}). Retrying...`);
            setTimeout(setupCarousel, 100);
            return;
        }

        if (carsData.length === 0) {
            carsData = slides.map((slide, index) => {
                try {
                    return JSON.parse(slide.dataset.carInfo || '{}');
                } catch (e) {
                    console.error(`Failed to parse car info JSON for slide ${index}:`, slide.dataset.carInfo, e);
                    return {};
                }
            });
        }
        moveToSlide(currentIndex);
        updateInfoPanel(currentIndex);
    };

    const moveToSlide = (targetIndex) => {
        if (!track || slideWidth <= 0) return;
        const amountToMove = targetIndex * slideWidth;
        track.style.transform = 'translateX(-' + amountToMove + 'px)'; // Concat version
        currentIndex = targetIndex;
    };

    const updateInfoPanel = (targetIndex) => {
        const carData = carsData[targetIndex];
        if (!carData || Object.keys(carData).length === 0) {
            console.warn('No valid car data for index ' + targetIndex);
            // Clear panel or show error message
            infoNickname.textContent = 'Error';
            infoMakeModel.textContent = 'Data unavailable';
            infoYear.textContent = 'N/A';
            infoEngine.textContent = 'N/A';
            infoPower.textContent = 'N/A';
            infoTorque.textContent = 'N/A';
            infoColor.textContent = 'N/A';
            infoDescription.textContent = '';
            infoPurchase.textContent = 'N/A';
            infoModsList.innerHTML = '<li>Data could not be loaded.</li>';
            relatedImagesContainer.innerHTML = '<p>Data could not be loaded.</p>';
            return;
        }

        // Update text fields
        infoNickname.textContent = carData.nickname || carData.model || '';
        infoMakeModel.textContent = (carData.make || '') + ' ' + (carData.model || '');
        infoYear.textContent = carData.year || 'N/A';
        infoEngine.textContent = carData.engine || 'N/A';
        infoPower.textContent = carData.power || 'N/A';
        infoTorque.textContent = carData.torque || 'N/A';
        infoColor.textContent = carData.color || 'N/A';
        infoDescription.textContent = carData.description || 'No description available.';
        infoPurchase.textContent = carData.purchase_date ? formatDate(carData.purchase_date) : 'N/A';

        // Update Mods List
        infoModsList.innerHTML = '';
        if (carData.mods && Array.isArray(carData.mods) && carData.mods.length > 0) {
            carData.mods.forEach(mod => {
                const li = document.createElement('li');
                li.textContent = mod;
                infoModsList.appendChild(li);
            });
        } else {
            infoModsList.innerHTML = '<li>None listed.</li>';
        }

        // Update Related Images Grid
        relatedImagesContainer.innerHTML = '';
        if (carData.images && Array.isArray(carData.images) && carData.images.length > 0) {
            carData.images.forEach(imgData => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'related-image-item';
                itemDiv.setAttribute('role', 'button');
                itemDiv.setAttribute('tabindex', '0');

                const imageUrlRaw = imgData.url || ''; // Path from YAML, e.g., /assets/...
                const placeholderPath = basePath + '/assets/images/placeholder.png';
                let imageUrl;

                // Construct full path using concatenation
                if (imageUrlRaw && imageUrlRaw.startsWith('/')) {
                    imageUrl = basePath + imageUrlRaw;
                } else if (imageUrlRaw) {
                    imageUrl = imageUrlRaw; // Assume relative or already absolute
                } else {
                    imageUrl = placeholderPath;
                }

                // Store original relative path in dataset for lightbox
                itemDiv.dataset.src = imageUrlRaw;
                itemDiv.dataset.title = imgData.title || '';
                itemDiv.dataset.description = imgData.description || '';

                const img = document.createElement('img');
                img.src = imageUrl; // Assign the final constructed URL
                img.alt = imgData.title || carData.nickname || 'Related image';
                img.loading = 'lazy';

                itemDiv.appendChild(img);
                relatedImagesContainer.appendChild(itemDiv);
            });
        } else {
             relatedImagesContainer.innerHTML = '<p>No related images available.</p>';
        }
    }; // End updateInfoPanel

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00Z'); // Treat as UTC
             if (isNaN(date.getTime())) throw new Error("Invalid date");
             const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
             return date.toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    // --- Lightbox Functions ---
    const openLightbox = (imageSrcRelative, imageTitle, imageDescription) => {
        if (!lightboxEnabled || !imageSrcRelative) return;

        // Construct full path using concatenation
        let fullImageSrc;
        if (imageSrcRelative.startsWith('/')) {
            fullImageSrc = basePath + imageSrcRelative;
        } else {
            fullImageSrc = imageSrcRelative; // Assume already correct path
        }

        lightboxImage.setAttribute('src', fullImageSrc);
        lightboxImage.setAttribute('alt', imageTitle || 'Enlarged image');
        lightboxTitle.textContent = imageTitle || '';
        lightboxDescription.textContent = imageDescription || '';

        const captionElement = lightbox.querySelector('.lightbox-caption');
        if (captionElement) {
             captionElement.style.display = (!imageTitle && !imageDescription) ? 'none' : 'block';
        }
        lightbox.classList.add('is-visible');
        // document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        if (!lightboxEnabled) return;
        lightbox.classList.remove('is-visible');
        lightboxTitle.textContent = '';
        lightboxDescription.textContent = '';
        // Optional: Clear src after transition
        setTimeout(() => {
            if (!lightbox.classList.contains('is-visible')) {
                 lightboxImage.setAttribute('src', '');
                 lightboxImage.setAttribute('alt', '');
            }
         }, 300);
        // document.body.style.overflow = '';
    };

    // --- Event Listeners ---
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

    // Related Images Click/Keydown Listener (Event Delegation)
    relatedImagesContainer.addEventListener('click', (e) => {
        if (!lightboxEnabled) return;
        const clickedItem = e.target.closest('.related-image-item');
        if (clickedItem) {
            // Pass the original relative path from dataset.src
            openLightbox(
                clickedItem.dataset.src,
                clickedItem.dataset.title,
                clickedItem.dataset.description
            );
        }
    });

    relatedImagesContainer.addEventListener('keydown', (e) => {
         if (!lightboxEnabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
             const focusedItem = e.target.closest('.related-image-item');
              if (focusedItem) {
                    e.preventDefault();
                    openLightbox(
                        focusedItem.dataset.src,
                        focusedItem.dataset.title,
                        focusedItem.dataset.description
                    );
              }
        }
    });

    // Lightbox Close Listeners
    if (lightboxEnabled) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.closest('.lightbox-content')) {
                 closeLightbox();
            }
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('is-visible')) {
                closeLightbox();
            }
        });
    }

    // Debounced Resize Listener
    window.addEventListener('resize', () => {
        clearTimeout(isResizeDebounced);
        isResizeDebounced = setTimeout(() => {
             // console.log("Window resized, recalculating garage carousel layout.");
             const oldWidth = slideWidth;
             slideWidth = slides[0] ? slides[0].getBoundingClientRect().width : 0;
             if (slideWidth > 0 && slideWidth !== oldWidth) {
                 moveToSlide(currentIndex); // Just reposition based on new width
             } else if (slideWidth <= 0) {
                 // console.warn("Slide width became 0 on resize, attempting setup again.");
                 setupCarousel(); // Attempt full setup again if width is lost
             }
        }, 250);
    });

    // --- Initial Setup ---
    // Use 'load' event to increase chance that images/layout are ready for width calculation
    if (document.readyState === 'complete') {
        setupCarousel();
    } else {
        window.addEventListener('load', setupCarousel);
    }

}); // End DOMContentLoaded