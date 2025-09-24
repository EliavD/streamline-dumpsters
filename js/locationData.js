/**
 * Location-specific content data for individual service area pages
 * This configuration system allows easy management of location-specific content
 */

const LOCATION_DATA = {
    dublin: {
        cityName: "Dublin",
        urlSlug: "dublin",
        coordinates: {
            latitude: "40.0992",
            longitude: "-83.1141"
        },
        neighborhoods: [
            "Historic Dublin",
            "Bridge Park",
            "Coffman Park Area",
            "Dublinshire",
            "Glacier Ridge",
            "Ballantrae",
            "Dublin Village Center",
            "Tartan Fields",
            "Riverside Green",
            "Wooded Hills",
            "Indian Run Meadows",
            "Brighton Park"
        ],
        metaDescription: "Professional dumpster rental services in Dublin, Ohio. Fast delivery, competitive pricing, excellent service for residential and commercial projects. Book your 14-yard dumpster today.",
        keywords: "dumpster rental Dublin Ohio, waste management Dublin, junk removal Dublin, Dublin dumpster service, construction debris Dublin",
        specialFeatures: [
            "Familiar with Dublin's permitting requirements",
            "Experience with historic district projects",
            "Bridge Park area specialist",
            "Same-day delivery to most Dublin neighborhoods",
            "Licensed for commercial and residential projects"
        ],
        commonProjects: [
            {
                title: "Historic Home Renovations",
                description: "Specialized service for Dublin's historic district renovation projects with careful debris management."
            },
            {
                title: "Bridge Park Developments",
                description: "Supporting new construction and commercial projects in Dublin's premier mixed-use district."
            },
            {
                title: "Residential Cleanouts",
                description: "Perfect for Dublin homeowners tackling basement, attic, and garage cleanouts."
            },
            {
                title: "Landscaping Projects",
                description: "Handling yard waste and landscaping debris from Dublin's beautiful properties."
            }
        ],
        localFAQs: [
            {
                question: "Do I need a permit for a dumpster in Dublin?",
                answer: "Most residential driveways in Dublin don't require permits. For street placement or historic district projects, we'll help you determine permit requirements and guide you through the process."
            },
            {
                question: "How quickly can you deliver to Dublin?",
                answer: "We typically provide same-day or next-day service throughout Dublin, including Bridge Park, Historic Dublin, and all residential neighborhoods."
            },
            {
                question: "What areas of Dublin do you serve?",
                answer: "We serve all of Dublin including Historic Dublin, Bridge Park, Ballantrae, Tartan Fields, and all surrounding neighborhoods within Dublin city limits."
            },
            {
                question: "Can you deliver to Dublin commercial areas?",
                answer: "Yes, we serve all Dublin commercial districts including Bridge Park businesses, downtown Dublin, and industrial areas with proper permitting."
            }
        ]
    },

    hilliard: {
        cityName: "Hilliard",
        urlSlug: "hilliard",
        coordinates: {
            latitude: "40.0334",
            longitude: "-83.1582"
        },
        neighborhoods: [
            "Old Hilliard",
            "Crossing at Hilliard",
            "Ballantrae",
            "Heritage Hill",
            "Norwich",
            "Britton Woods",
            "Hilliard Rome Road Corridor",
            "Brown Elementary Area",
            "Hilliard Station",
            "Scioto Darby"
        ],
        metaDescription: "Reliable dumpster rental in Hilliard, Ohio. Professional waste management for home cleanouts, renovations, and construction projects. Serving all Hilliard neighborhoods.",
        keywords: "dumpster rental Hilliard Ohio, waste disposal Hilliard, junk removal Hilliard, Hilliard construction debris, Norwich dumpster service",
        specialFeatures: [
            "Norwich area coverage specialist",
            "New development project expertise",
            "Heritage district experience",
            "Hilliard Station area access",
            "Commercial and residential service"
        ],
        commonProjects: [
            {
                title: "New Home Construction",
                description: "Supporting Hilliard's growing residential developments with construction debris management."
            },
            {
                title: "Heritage District Renovations",
                description: "Careful handling of renovation waste from Hilliard's established neighborhoods."
            },
            {
                title: "Moving & Downsizing",
                description: "Helping Hilliard families with moving cleanouts and downsizing projects."
            },
            {
                title: "Commercial Cleanouts",
                description: "Business cleanouts and renovation support along Hilliard's commercial corridors."
            }
        ],
        localFAQs: [
            {
                question: "Do you serve all of Hilliard including Norwich?",
                answer: "Yes, we serve all Hilliard areas including Norwich, Heritage Hill, Old Hilliard, and all residential and commercial districts."
            },
            {
                question: "What's your delivery time for Hilliard?",
                answer: "We provide same-day or next-day delivery throughout Hilliard, with flexible scheduling for your convenience."
            },
            {
                question: "Can you handle construction debris in Hilliard?",
                answer: "Absolutely! We specialize in construction and renovation debris for both residential and commercial projects throughout Hilliard."
            },
            {
                question: "What's included in the $299 price for Hilliard?",
                answer: "Our flat rate includes delivery, 3-day rental, pickup, and up to 4,000 lbs of debris disposal anywhere in Hilliard."
            }
        ]
    },

    "plain-city": {
        cityName: "Plain City",
        urlSlug: "plain-city",
        coordinates: {
            latitude: "40.1084",
            longitude: "-83.2668"
        },
        neighborhoods: [
            "Downtown Plain City",
            "Jerome Village",
            "Plain City Farms",
            "Residential Districts",
            "Rural Areas",
            "Commercial Zone",
            "Big Darby Creek Area",
            "US Route 42 Corridor",
            "Agricultural Properties"
        ],
        metaDescription: "Dumpster rental services in Plain City, Ohio. Serving residential and commercial customers with reliable waste management solutions. Rural property specialists.",
        keywords: "dumpster rental Plain City Ohio, rural dumpster service, farm cleanout Plain City, Jerome Village waste management",
        specialFeatures: [
            "Jerome Village development expert",
            "Rural property access specialist",
            "Agricultural waste management",
            "Long driveway delivery capability",
            "Farm and acreage service"
        ],
        commonProjects: [
            {
                title: "Farm & Barn Cleanouts",
                description: "Specialized service for Plain City area farms, barns, and agricultural property maintenance."
            },
            {
                title: "Rural Property Maintenance",
                description: "Supporting Plain City residents with land clearing, property cleanouts, and maintenance projects."
            },
            {
                title: "Jerome Village Projects",
                description: "Serving the growing Jerome Village development with residential and commercial waste management."
            },
            {
                title: "Estate Cleanouts",
                description: "Comprehensive cleanout services for Plain City properties and estates."
            }
        ],
        localFAQs: [
            {
                question: "Can you deliver to rural Plain City properties?",
                answer: "Yes! We specialize in rural deliveries and can access long driveways and remote properties throughout the Plain City area."
            },
            {
                question: "Do you serve Jerome Village?",
                answer: "Absolutely! We provide full service to Jerome Village including residential, commercial, and new construction projects."
            },
            {
                question: "Can you handle farm and agricultural waste?",
                answer: "We handle construction debris, household cleanouts, and renovation waste from agricultural properties. Note: we cannot accept organic farm waste or hazardous materials."
            },
            {
                question: "What's your service area around Plain City?",
                answer: "We serve all of Plain City proper, surrounding rural areas, Jerome Village, and properties along major routes like US-42."
            }
        ]
    },

    westerville: {
        cityName: "Westerville",
        urlSlug: "westerville",
        coordinates: {
            latitude: "40.1262",
            longitude: "-82.9291"
        },
        neighborhoods: [
            "Uptown Westerville",
            "Huber Village",
            "Minerva Park",
            "Highlands",
            "Woodstream",
            "Canterbury",
            "Otterbein University Area",
            "Alum Creek",
            "Blendon Woods",
            "Annehurst"
        ],
        metaDescription: "Professional dumpster rental in Westerville, Ohio. Trusted by homeowners and businesses for reliable waste disposal services. Serving all Westerville neighborhoods.",
        keywords: "dumpster rental Westerville Ohio, waste management Westerville, Uptown Westerville dumpster, Otterbein area junk removal",
        specialFeatures: [
            "Uptown historic area knowledge",
            "Otterbein University area service",
            "Alum Creek access expertise",
            "Established neighborhood specialist",
            "Community-focused local service"
        ],
        commonProjects: [
            {
                title: "Historic Home Renovations",
                description: "Careful renovation support for Westerville's beautiful historic homes and Uptown properties."
            },
            {
                title: "University Area Cleanouts",
                description: "Supporting Otterbein area residents and students with cleanout and moving projects."
            },
            {
                title: "Suburban Renovations",
                description: "Home improvement and renovation debris removal for Westerville's established neighborhoods."
            },
            {
                title: "Community Projects",
                description: "Supporting Westerville community events, cleanups, and civic improvement projects."
            }
        ],
        localFAQs: [
            {
                question: "Do you serve the Otterbein University area?",
                answer: "Yes, we serve all areas around Otterbein University including student housing, residential neighborhoods, and university-related projects."
            },
            {
                question: "Can you deliver to Uptown Westerville?",
                answer: "Absolutely! We're familiar with Uptown Westerville's historic district and can navigate the area safely and efficiently."
            },
            {
                question: "What's your turnaround time for Westerville?",
                answer: "We typically provide same-day or next-day service throughout Westerville, including all residential and commercial areas."
            },
            {
                question: "Do you work with Westerville contractors?",
                answer: "Yes, we partner with local Westerville contractors and businesses for ongoing renovation and construction projects."
            }
        ]
    },

    worthington: {
        cityName: "Worthington",
        urlSlug: "worthington",
        coordinates: {
            latitude: "40.0931",
            longitude: "-83.0179"
        },
        neighborhoods: [
            "Historic Worthington",
            "Village Green Area",
            "Kilbourne Village",
            "Colonial Hills",
            "Worthington Hills",
            "Olde Worthington",
            "Antrim",
            "Evening Street Area",
            "High Street Corridor"
        ],
        metaDescription: "Dumpster rental services in Worthington, Ohio. Professional waste management for historic properties, renovations, and cleanouts. Local Worthington service.",
        keywords: "dumpster rental Worthington Ohio, historic Worthington waste management, Worthington renovation debris, Village Green area dumpster",
        specialFeatures: [
            "Historic district expertise",
            "Village Green area specialist",
            "Colonial architecture experience",
            "Community event support",
            "Established neighborhood knowledge"
        ],
        commonProjects: [
            {
                title: "Historic Property Renovations",
                description: "Specialized care for Worthington's historic homes and colonial architecture renovation projects."
            },
            {
                title: "Village Green Area Projects",
                description: "Supporting residential and commercial projects in Worthington's charming downtown area."
            },
            {
                title: "Estate & Moving Cleanouts",
                description: "Helping Worthington families with comprehensive property cleanouts and moving projects."
            },
            {
                title: "Landscape & Yard Projects",
                description: "Managing debris from Worthington's beautiful landscaping and yard improvement projects."
            }
        ],
        localFAQs: [
            {
                question: "Can you work in Worthington's historic district?",
                answer: "Yes! We're experienced with historic district requirements and can work carefully around Worthington's historic properties and village areas."
            },
            {
                question: "Do you serve all Worthington neighborhoods?",
                answer: "We serve all of Worthington including Historic Worthington, Village Green area, Colonial Hills, and all residential neighborhoods."
            },
            {
                question: "What permits are needed in Worthington?",
                answer: "Most residential driveway placements don't require permits. We'll help determine requirements for street placement or historic district projects."
            },
            {
                question: "How do you handle narrow Worthington streets?",
                answer: "Our experienced drivers are familiar with Worthington's tree-lined streets and can safely navigate residential areas."
            }
        ]
    },

    powell: {
        cityName: "Powell",
        urlSlug: "powell",
        coordinates: {
            latitude: "40.1578",
            longitude: "-83.0752"
        },
        neighborhoods: [
            "Historic Powell",
            "Sawmill Road Corridor",
            "Olentangy Schools District",
            "Liberty Township",
            "Seldom Seen",
            "Powell Village",
            "Residential Developments"
        ],
        metaDescription: "Reliable dumpster rental in Powell, Ohio. Professional service for residential cleanouts, renovations, and construction projects. Serving all Powell areas.",
        keywords: "dumpster rental Powell Ohio, Powell waste management, Sawmill Road dumpster service, Powell construction debris",
        specialFeatures: [
            "Sawmill Road corridor expertise",
            "New development specialist",
            "Olentangy district service",
            "Liberty Township coverage",
            "Growing community focus"
        ],
        commonProjects: [
            {
                title: "New Construction Support",
                description: "Supporting Powell's growing residential and commercial development projects."
            },
            {
                title: "Home Additions & Renovations",
                description: "Renovation debris management for Powell's expanding and improving homes."
            },
            {
                title: "Community Development",
                description: "Supporting Powell's community growth with reliable construction waste management."
            },
            {
                title: "Residential Cleanouts",
                description: "Helping Powell families with home cleanouts, moving, and decluttering projects."
            }
        ],
        localFAQs: [
            {
                question: "Do you serve all Powell developments?",
                answer: "Yes, we serve all Powell residential developments, established neighborhoods, and new construction areas."
            },
            {
                question: "Can you deliver along Sawmill Road?",
                answer: "Absolutely! We regularly service the entire Sawmill Road corridor and surrounding Powell areas."
            },
            {
                question: "What's your response time for Powell?",
                answer: "We typically provide same-day or next-day delivery throughout Powell and surrounding Liberty Township areas."
            },
            {
                question: "Do you work with Powell builders?",
                answer: "Yes, we work with local Powell contractors and builders for ongoing construction and renovation projects."
            }
        ]
    }
};

// Helper function to get location data
function getLocationData(citySlug) {
    return LOCATION_DATA[citySlug] || null;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LOCATION_DATA, getLocationData };
}