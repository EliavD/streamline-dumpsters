// Load HTML components dynamically
async function loadComponent(componentPath, targetSelector) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        const html = await response.text();
        const target = document.querySelector(targetSelector);
        if (target) {
            target.insertAdjacentHTML('beforeend', html);
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

// Load junk removal modal on location pages
if (document.querySelector('.location-page')) {
    loadComponent('components/junk-removal-modal.html', 'body');
}
