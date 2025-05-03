// assets/js/gallery-carousel.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const track = document.querySelector('.carousel-track');
    const nextButton = document.querySelector('.carousel-button-next');
    const prevButton = document.querySelector('.carousel-button-prev');
    const infoTitle = document.getElementById('carousel-info-title');
    const infoCar = document.getElementById('carousel-info-car');
    const infoDescription = document.getElementById('carousel-info-description');
    const thumbnailGrid = document.querySelector('.gallery-thumbnail-grid'); // New
    const lightbox = document.getElementById('lightbox');                   // New
    const lightboxImage = lightbox?.querySelector('.lightbox-image');       // New
    const carousel = document.querySelector('.gallery-carousel');           // New (for lightbox click target)

    // --- Basic Checks ---
    if (!track || !thumbnailGrid || !lightbox || !lightboxImage || !carousel) {
        // console.log("Required gallery elements not found on this page.");
        return; // Stop if any core part is missing
    }

    const slides = Array.from(track.children);
    const thumbnails = Array.from(thumbnailGrid.children);

    if (slides.length === 0) return; // Stop if no slides

    // Hide buttons/grid if only one slide
    if (slides.length <= 1) {
        if (nextButton) nextButton.style.display = 'none';
        if (prevButton) prevButton.style.display = 'none';
        thumbnailGrid.style.display = 'none'; // Hide grid too
        return;
    }

    // --- State Variables ---
    let currentIndex = 0;
    let slideWidth = 0;

    // --- Functions ---
    const setupCarousel = () => {
        slideWidth = slides[0].getBoundingClientRect().width;
        // Position slides initially (translateX ensures this)
        moveToSlide(currentIndex);
        updateInfo(currentIndex);
        // updateThumbnails(currentIndex); // Set initial active thumbnail
    };

    // Function to move the track to the target slide
    const moveToSlide = (targetIndex, enableScroll = false) => { // Added enableScroll parameter
        if (!track) return;
        const amountToMove = targetIndex * slideWidth;
        track.style.transform = `translateX(-${amountToMove}px)`;
        const previousIndex = currentIndex; // Store previous index
        currentIndex = targetIndex;
        // Only enable scroll if the index actually changed
        updateThumbnails(targetIndex, enableScroll && targetIndex !== previousIndex);
    };

    const updateInfo = (targetIndex) => {
         if (!infoTitle || !infoCar || !infoDescription || !slides[targetIndex]) return;
         const currentSlide = slides[targetIndex];
         infoTitle.textContent = currentSlide.dataset.title || '';
         infoCar.textContent = currentSlide.dataset.car || '';
         infoDescription.textContent = currentSlide.dataset.description || '';
    };

    // Function to update active state of thumbnails
    const updateThumbnails = (activeIndex, enableScroll = false) => { // Added enableScroll parameter
        thumbnails.forEach((thumb, index) => {
            if (index === activeIndex) {
                thumb.classList.add('is-active');
                // Only scroll if enableScroll is true
                if (enableScroll) {
                    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            } else {
                thumb.classList.remove('is-active');
            }
        });
    };

    // --- Lightbox Functions - NEW ---
    const openLightbox = (imageSrc) => {
        if (!lightbox || !lightboxImage) return;
        lightboxImage.setAttribute('src', imageSrc);
        lightbox.classList.add('is-visible');
        // Optional: Disable body scroll while lightbox is open
        // document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        if (!lightbox || !lightboxImage) return;
        lightbox.classList.remove('is-visible');
        // Clear src after transition ends (optional, helps avoid flicker)
        // setTimeout(() => { lightboxImage.setAttribute('src', ''); }, 300); // Match CSS transition time
        // Optional: Re-enable body scroll
        // document.body.style.overflow = '';
    };

    // --- Event Listeners ---

    // Next Button
    nextButton?.addEventListener('click', () => {
        let nextIndex = (currentIndex + 1) % slides.length; // Use modulo for cleaner wrapping
        moveToSlide(nextIndex);
        updateInfo(nextIndex);
    });

    // Previous Button
    prevButton?.addEventListener('click', () => {
        let prevIndex = (currentIndex - 1 + slides.length) % slides.length; // Use modulo for cleaner wrapping
        moveToSlide(prevIndex);
        updateInfo(prevIndex);
    });

    // Thumbnail Clicks - NEW
    thumbnailGrid.addEventListener('click', (e) => {
        // Find the clicked thumbnail button (if the click wasn't directly on it)
        const clickedThumbnail = e.target.closest('.thumbnail-item');
        if (!clickedThumbnail) return; // Exit if click wasn't on a thumbnail item

        const index = parseInt(clickedThumbnail.dataset.index, 10); // Get index from data attribute
        if (isNaN(index)) return; // Exit if index is not a number

        moveToSlide(index);
        updateInfo(index);
    });

    // Click on Main Carousel Image to Open Lightbox - NEW
    carousel.addEventListener('click', (e) => {
         // Check if the click was on an image within the *currently active* slide
         const clickedImage = e.target.closest('.carousel-main-image');
         const slideContainer = clickedImage?.closest('.carousel-slide');

         if (clickedImage && slideContainer && parseInt(slideContainer.dataset.index, 10) === currentIndex) {
            openLightbox(clickedImage.src);
         }
    });

    // Click on Lightbox Overlay/Image to Close - NEW
    lightbox.addEventListener('click', (e) => {
        // Close if the click is directly on the overlay or the image itself
        if (e.target === lightbox || e.target === lightboxImage) {
             closeLightbox();
        }
    });

    // Keyboard support for closing lightbox - NEW
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('is-visible')) {
            closeLightbox();
        }
    });


    // Window Resize
    window.addEventListener('resize', () => {
        // Consider debouncing/throttling in production
        setupCarousel();
    });

    // --- Initial Setup ---
    setupCarousel();

}); // End DOMContentLoaded