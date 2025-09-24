/**
 * Local SEO Optimizer
 * Enhances location pages with dynamic local content and voice search optimization
 */

class LocalSEOOptimizer {
    constructor() {
        this.currentLocation = this.detectCurrentLocation();
        this.addLocationSpecificContent();
        this.optimizeForVoiceSearch();
        this.setupLocalBusinessMarkup();
        this.enhanceInternalLinking();
    }

    detectCurrentLocation() {
        const currentPage = window.location.pathname;
        const locationMatch = currentPage.match(/\/([^\/]+)\.html$/);

        if (locationMatch) {
            const locationKey = locationMatch[1];
            // Handle URL slug to data key mapping
            return locationKey === 'plain-city' ? 'plain-city' : locationKey;
        }
        return null;
    }

    addLocationSpecificContent() {
        if (!this.currentLocation || !LOCATION_DATA[this.currentLocation]) return;

        this.enhanceLocationContent(this.currentLocation);
        this.addDrivingDirections(this.currentLocation);
        this.addLocalLandmarks(this.currentLocation);
        this.addSeasonalContent(this.currentLocation);
    }

    enhanceLocationContent(locationKey) {
        const locationData = LOCATION_DATA[locationKey];
        if (!locationData) return;

        // Add dynamic ZIP code content
        this.addZipCodeContent(locationData);

        // Add major streets and highways
        this.addLocationAccessInfo(locationData);

        // Add demographic-specific content
        this.addTargetedContent(locationData);
    }

    addZipCodeContent(locationData) {
        const zipCodes = {
            dublin: ["43016", "43017", "43065"],
            hilliard: ["43026", "43228"],
            "plain-city": ["43064"],
            westerville: ["43081", "43082"],
            worthington: ["43085"],
            powell: ["43065"]
        };

        const locationZips = zipCodes[this.currentLocation];
        if (!locationZips) return;

        // Find a suitable location to insert ZIP code content
        const serviceSection = document.querySelector('.service-neighborhoods .container');
        if (serviceSection) {
            const zipSection = document.createElement('div');
            zipSection.className = 'zip-code-coverage';
            zipSection.innerHTML = `
                <h3>ZIP Code Coverage</h3>
                <p>We provide dumpster rental service to all ${locationData.cityName} ZIP codes:</p>
                <div class="zip-list">
                    ${locationZips.map(zip => `<span class="zip-code">${zip}</span>`).join(' • ')}
                </div>
            `;
            serviceSection.appendChild(zipSection);
        }
    }

    addLocationAccessInfo(locationData) {
        const accessInfo = {
            dublin: {
                highways: ["I-270", "US-33", "SR-161"],
                streets: ["Sawmill Road", "Frantz Road", "Bridge Street", "Dublin Road"]
            },
            hilliard: {
                highways: ["I-270", "I-70", "SR-161"],
                streets: ["Cemetery Road", "Britton Parkway", "Main Street", "Norwich Road"]
            },
            "plain-city": {
                highways: ["US-42", "US-33"],
                streets: ["Main Street", "US-42", "Lambs Lane"]
            },
            westerville: {
                highways: ["I-270", "SR-3", "SR-161"],
                streets: ["State Street", "Main Street", "Schrock Road"]
            },
            worthington: {
                highways: ["I-270", "US-23", "SR-161"],
                streets: ["High Street", "Granville Road", "Wilson Bridge Road"]
            },
            powell: {
                highways: ["I-270", "US-23"],
                streets: ["Sawmill Road", "Powell Road", "Liberty Street"]
            }
        };

        const locationAccess = accessInfo[this.currentLocation];
        if (!locationAccess) return;

        const accessSection = document.createElement('section');
        accessSection.className = 'location-access';
        accessSection.innerHTML = `
            <div class="container">
                <h3>Easy Access Throughout ${locationData.cityName}</h3>
                <div class="access-grid">
                    <div class="access-info">
                        <h4>Highway Access</h4>
                        <p>Convenient delivery via major highways:</p>
                        <ul>
                            ${locationAccess.highways.map(highway => `<li>${highway}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="access-info">
                        <h4>Major Streets</h4>
                        <p>Serving all major ${locationData.cityName} corridors:</p>
                        <ul>
                            ${locationAccess.streets.map(street => `<li>${street}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Insert before the CTA section
        const ctaSection = document.querySelector('.location-cta');
        if (ctaSection) {
            ctaSection.parentNode.insertBefore(accessSection, ctaSection);
        }
    }

    addDrivingDirections(locationKey) {
        const locationData = LOCATION_DATA[locationKey];
        if (!locationData) return;

        const directionsSection = document.createElement('section');
        directionsSection.className = 'driving-directions';
        directionsSection.innerHTML = `
            <div class="container">
                <h3>Fast Service Throughout ${locationData.cityName}</h3>
                <p>Our central Ohio location allows us to serve ${locationData.cityName} efficiently with same-day delivery to most areas.</p>
                <div class="service-features-grid">
                    <div class="service-feature">
                        <h4>🚚 Quick Delivery</h4>
                        <p>Average delivery time: 2-4 hours to most ${locationData.cityName} locations</p>
                    </div>
                    <div class="service-feature">
                        <h4>🗺️ Local Knowledge</h4>
                        <p>Our drivers know ${locationData.cityName} streets and neighborhoods</p>
                    </div>
                    <div class="service-feature">
                        <h4>📍 GPS Tracking</h4>
                        <p>Real-time delivery tracking for ${locationData.cityName} customers</p>
                    </div>
                </div>
            </div>
        `;

        // Insert before the last section (typically CTA or FAQ)
        const main = document.querySelector('main');
        const lastSection = main.querySelector('section:last-of-type');
        if (main && lastSection) {
            main.insertBefore(directionsSection, lastSection);
        }
    }

    addLocalLandmarks(locationKey) {
        const landmarks = {
            dublin: ["Dublin Irish Festival", "Coffman Park", "Bridge Park", "Historic Dublin", "Muirfield Village"],
            hilliard: ["Hilliard Station Park", "Heritage Rail Trail", "Early Television Museum", "Franklin County Fairgrounds"],
            "plain-city": ["Plain City Park", "Der Dutchman Restaurant", "Historic Downtown", "Big Darby Creek"],
            westerville: ["Uptown Westerville", "Otterbein University", "Alum Creek State Park", "Inniswood Metro Gardens"],
            worthington: ["Village Green", "Orange Johnson House", "Worthington Hills Country Club", "Antrim Park"],
            powell: ["Scioto Park", "Liberty Township", "Olentangy Trail", "Village Green Park"]
        };

        const locationLandmarks = landmarks[locationKey];
        if (!locationLandmarks) return;

        const landmarksHTML = `
            <div class="local-landmarks">
                <h4>Local Landmarks & Areas We Serve</h4>
                <p>Delivering near these popular ${LOCATION_DATA[locationKey].cityName} locations:</p>
                <div class="landmarks-list">
                    ${locationLandmarks.map(landmark => `<span class="landmark">${landmark}</span>`).join(' • ')}
                </div>
            </div>
        `;

        // Add to the neighborhoods section
        const neighborhoodsSection = document.querySelector('.service-neighborhoods .container');
        if (neighborhoodsSection) {
            neighborhoodsSection.insertAdjacentHTML('beforeend', landmarksHTML);
        }
    }

    addSeasonalContent(locationKey) {
        const currentMonth = new Date().getMonth();
        const locationData = LOCATION_DATA[locationKey];
        if (!locationData) return;

        let seasonalContent = '';

        // Spring (March-May)
        if (currentMonth >= 2 && currentMonth <= 4) {
            seasonalContent = `
                <div class="seasonal-content spring">
                    <h4>🌸 Spring Cleanup Season in ${locationData.cityName}</h4>
                    <p>Spring cleaning and yard cleanup season is here! Perfect time for ${locationData.cityName} residents to tackle:</p>
                    <ul>
                        <li>Basement and attic cleanouts</li>
                        <li>Garage organization projects</li>
                        <li>Yard waste from winter cleanup</li>
                        <li>Home renovation projects</li>
                    </ul>
                </div>
            `;
        }
        // Summer (June-August)
        else if (currentMonth >= 5 && currentMonth <= 7) {
            seasonalContent = `
                <div class="seasonal-content summer">
                    <h4>☀️ Summer Project Season in ${locationData.cityName}</h4>
                    <p>Summer is prime time for home improvement in ${locationData.cityName}! Popular summer projects:</p>
                    <ul>
                        <li>Deck and patio construction</li>
                        <li>Kitchen and bathroom remodels</li>
                        <li>Landscaping and garden projects</li>
                        <li>Roof repairs and replacements</li>
                    </ul>
                </div>
            `;
        }
        // Fall (September-November)
        else if (currentMonth >= 8 && currentMonth <= 10) {
            seasonalContent = `
                <div class="seasonal-content fall">
                    <h4>🍂 Fall Cleanup Season in ${locationData.cityName}</h4>
                    <p>Fall is perfect for preparation and cleanup in ${locationData.cityName}:</p>
                    <ul>
                        <li>Leaf and yard waste removal</li>
                        <li>Pre-winter home maintenance</li>
                        <li>Storm damage cleanup</li>
                        <li>Final outdoor projects before winter</li>
                    </ul>
                </div>
            `;
        }
        // Winter (December-February)
        else {
            seasonalContent = `
                <div class="seasonal-content winter">
                    <h4>❄️ Winter Indoor Projects in ${locationData.cityName}</h4>
                    <p>Winter is ideal for indoor projects in ${locationData.cityName}:</p>
                    <ul>
                        <li>Interior renovations and remodeling</li>
                        <li>Basement finishing projects</li>
                        <li>Holiday cleanup and organization</li>
                        <li>Planning for spring projects</li>
                    </ul>
                </div>
            `;
        }

        // Add seasonal content to the common projects section
        const projectsSection = document.querySelector('.common-projects .container');
        if (projectsSection && seasonalContent) {
            projectsSection.insertAdjacentHTML('beforeend', seasonalContent);
        }
    }

    optimizeForVoiceSearch() {
        // Add voice search optimized FAQ content
        const voiceSearchQuestions = [
            {
                question: "Where can I rent a dumpster near me?",
                answer: `Streamline Dumpsters provides dumpster rental service ${this.currentLocation ? `in ${LOCATION_DATA[this.currentLocation]?.cityName}` : 'throughout Central Ohio'} with same-day delivery available.`
            },
            {
                question: "How much does dumpster rental cost?",
                answer: "Our dumpster rental service costs $299 flat rate with no hidden fees, including 3 days rental and pickup."
            },
            {
                question: "What size dumpster do I need?",
                answer: "Our 14-yard dumpsters are perfect for most residential projects, holding about 6 pickup truck loads or 80 kitchen trash bags."
            },
            {
                question: "How long can I keep a rental dumpster?",
                answer: "Our standard rental includes 3 days, with additional days available for just $15 per day."
            }
        ];

        // Add voice search optimized content as structured data
        const voiceSearchSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": voiceSearchQuestions.map(qa => ({
                "@type": "Question",
                "name": qa.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": qa.answer
                }
            }))
        };

        // Add to page head
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(voiceSearchSchema);
        document.head.appendChild(script);
    }

    setupLocalBusinessMarkup() {
        if (!this.currentLocation || !LOCATION_DATA[this.currentLocation]) return;

        const locationData = LOCATION_DATA[this.currentLocation];

        // Enhanced local business schema
        const enhancedSchema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Streamline Dumpsters Ltd",
            "image": "https://streamlinedumpsters.com/assets/img/logo.png",
            "@id": `https://streamlinedumpsters.com/${this.currentLocation}.html`,
            "url": `https://streamlinedumpsters.com/${this.currentLocation}.html`,
            "telephone": "(555) 123-DUMP",
            "priceRange": "$299",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": locationData.cityName,
                "addressRegion": "OH",
                "addressCountry": "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": locationData.coordinates.latitude,
                "longitude": locationData.coordinates.longitude
            },
            "areaServed": {
                "@type": "City",
                "name": locationData.cityName,
                "containedInPlace": {
                    "@type": "State",
                    "name": "Ohio"
                }
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Dumpster Rental Services",
                "itemListElement": [{
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "14 Yard Dumpster Rental",
                        "description": `Professional 14-yard dumpster rental for ${locationData.cityName} residents and businesses`
                    },
                    "price": "299",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                }]
            },
            "potentialAction": {
                "@type": "ReserveAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `https://streamlinedumpsters.com/${this.currentLocation}.html#dumpster-form`
                },
                "result": {
                    "@type": "Reservation",
                    "name": "Dumpster Rental Booking"
                }
            },
            "knowsAbout": locationData.neighborhoods,
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": locationData.coordinates.latitude,
                    "longitude": locationData.coordinates.longitude
                },
                "geoRadius": "25000"
            }
        };

        // Update existing schema or add new one
        const existingSchema = document.querySelector('script[type="application/ld+json"]');
        if (existingSchema) {
            existingSchema.textContent = JSON.stringify(enhancedSchema);
        }
    }

    enhanceInternalLinking() {
        // Add contextual internal links
        this.addCrossLocationLinks();
        this.addServicePageLinks();
        this.addResourceLinks();
    }

    addCrossLocationLinks() {
        if (!this.currentLocation) return;

        const relatedLocations = {
            dublin: ['hilliard', 'westerville', 'worthington', 'powell'],
            hilliard: ['dublin', 'plain-city', 'worthington'],
            'plain-city': ['dublin', 'hilliard', 'marysville'],
            westerville: ['dublin', 'worthington', 'gahanna'],
            worthington: ['dublin', 'westerville', 'powell'],
            powell: ['dublin', 'worthington', 'westerville']
        };

        const related = relatedLocations[this.currentLocation];
        if (!related) return;

        const relatedLinksHTML = `
            <section class="related-locations">
                <div class="container">
                    <h3>Nearby Service Areas</h3>
                    <p>We also provide dumpster rental service to neighboring communities:</p>
                    <div class="related-links">
                        ${related.map(location => {
                            const locationData = LOCATION_DATA[location];
                            const displayName = locationData ? locationData.cityName : location.charAt(0).toUpperCase() + location.slice(1);
                            const url = location === 'plain-city' ? 'plain-city.html' : `${location}.html`;
                            return `<a href="${url}" class="related-link" title="Dumpster rental in ${displayName}, OH">${displayName} Dumpster Rental</a>`;
                        }).join('')}
                    </div>
                </div>
            </section>
        `;

        // Insert before footer
        const footer = document.querySelector('footer');
        if (footer) {
            footer.insertAdjacentHTML('beforebegin', relatedLinksHTML);
        }
    }

    addServicePageLinks() {
        // Add contextual links to main service pages
        const serviceLinksHTML = `
            <div class="service-links">
                <h4>Our Services</h4>
                <nav class="service-nav">
                    <a href="index.html" title="Dumpster Rental Home">Dumpster Rental</a>
                    <a href="faq.html" title="Frequently Asked Questions">FAQ</a>
                    <a href="service-area.html" title="Complete Service Area">Service Areas</a>
                    <a href="contact.html" title="Contact Information">Contact</a>
                </nav>
            </div>
        `;

        // Add to a suitable location, like the FAQ section
        const faqSection = document.querySelector('.location-faq .container');
        if (faqSection) {
            faqSection.insertAdjacentHTML('beforeend', serviceLinksHTML);
        }
    }

    addResourceLinks() {
        // Add links to helpful resources
        const resourcesHTML = `
            <div class="helpful-resources">
                <h4>Helpful Resources</h4>
                <ul>
                    <li><a href="faq.html#what-can-go-in-dumpster" title="What can go in a dumpster">Accepted Materials</a></li>
                    <li><a href="faq.html#prohibited-items" title="Prohibited items">What Not to Put in Dumpster</a></li>
                    <li><a href="bookNow.html" title="Book dumpster rental online">Online Booking</a></li>
                    <li><a href="contact.html" title="Get a quote">Get Free Quote</a></li>
                </ul>
            </div>
        `;

        // Add to the service details section
        const serviceSection = document.querySelector('.service-details .container');
        if (serviceSection) {
            serviceSection.insertAdjacentHTML('beforeend', resourcesHTML);
        }
    }
}

// Initialize when DOM is loaded and location data is available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for location data to be available
    if (typeof LOCATION_DATA !== 'undefined') {
        new LocalSEOOptimizer();
    } else {
        // Retry after a short delay if location data isn't loaded yet
        setTimeout(() => {
            if (typeof LOCATION_DATA !== 'undefined') {
                new LocalSEOOptimizer();
            }
        }, 100);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalSEOOptimizer;
}