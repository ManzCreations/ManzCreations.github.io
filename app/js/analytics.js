// Analytics data structure with enhanced metrics
const analyticsData = {
    totalViews: 0,
    pageViews: {},
    regions: {},
    deviceTypes: {},
    referrers: {},
    timestamps: [],
    browserInfo: {},
    timeOnPage: {},
    interactions: {},
    lastUpdate: null,
    dailyStats: {},
    monthlyStats: {},
    emailInquiries: {
        total: 0,
        types: {
            quick: 0,
            full: 0
        },
        history: [],
        productTypes: {},
        dailyStats: {}
    }
};

async function resetAnalytics() {
    // Reset structure
    const emptyData = {
        totalViews: 0,
        pageViews: {},
        regions: {},
        deviceTypes: {},
        referrers: {},
        timestamps: [],
        browserInfo: {},
        timeOnPage: {},
        interactions: {},
        dailyStats: {},
        monthlyStats: {},
        lastUpdate: new Date().toISOString(),
        emailInquiries: {
            total: 0,
            types: {
                quick: 0,
                full: 0
            },
            history: [],
            productTypes: {},
            dailyStats: {}
        }
    };

    try {
        await storageHelper.writeFile('analytics.json', JSON.stringify(emptyData, null, 2));
        return true;
    } catch (error) {
        console.error('Error resetting analytics:', error);
        return false;
    }
}

// Storage helper with compression
const storageHelper = {
    async readFile(filename) {
        try {
            const data = localStorage.getItem(filename);
            return data || JSON.stringify(analyticsData);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return JSON.stringify(analyticsData);
        }
    },

    async writeFile(filename, data) {
        try {
            localStorage.setItem(filename, data);
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }
};

// Expose storage helper to window
window.fs = storageHelper;

// Function to track a page view
async function trackPageView() {
    try {
        // Load existing analytics
        const currentData = JSON.parse(await loadAnalytics());
        
        // Update total views
        currentData.totalViews = (currentData.totalViews || 0) + 1;
        
        // Track page-specific views
        const page = window.location.pathname || '/';
        currentData.pageViews = currentData.pageViews || {};
        currentData.pageViews[page] = (currentData.pageViews[page] || 0) + 1;
        
        // Track region
        const region = Intl.DateTimeFormat().resolvedOptions().timeZone;
        currentData.regions = currentData.regions || {};
        currentData.regions[region] = (currentData.regions[region] || 0) + 1;
        
        // Track device type
        const deviceType = getDeviceType();
        currentData.deviceTypes = currentData.deviceTypes || {};
        currentData.deviceTypes[deviceType] = (currentData.deviceTypes[deviceType] || 0) + 1;
        
        // Track browser info
        const browserInfo = getBrowserInfo();
        currentData.browserInfo = currentData.browserInfo || {};
        currentData.browserInfo[browserInfo.browser] = (currentData.browserInfo[browserInfo.browser] || 0) + 1;
        
        // Track referrer with domain extraction
        let referrer = 'direct';
        if (document.referrer) {
            try {
                referrer = new URL(document.referrer).hostname;
            } catch (e) {
                referrer = 'invalid';
            }
        }
        currentData.referrers = currentData.referrers || {};
        currentData.referrers[referrer] = (currentData.referrers[referrer] || 0) + 1;
        
        // Add timestamp
        currentData.timestamps = currentData.timestamps || [];
        currentData.timestamps.push(new Date().toISOString());
        currentData.lastUpdate = new Date().toISOString();

        // Track daily stats
        const today = new Date().toISOString().split('T')[0];
        currentData.dailyStats = currentData.dailyStats || {};
        currentData.dailyStats[today] = currentData.dailyStats[today] || {
            views: 0,
            pageViews: {},
            deviceTypes: {}
        };
        currentData.dailyStats[today].views++;
        currentData.dailyStats[today].pageViews[page] = 
            (currentData.dailyStats[today].pageViews[page] || 0) + 1;
        currentData.dailyStats[today].deviceTypes[deviceType] = 
            (currentData.dailyStats[today].deviceTypes[deviceType] || 0) + 1;

        // Track interactions
        currentData.interactions = currentData.interactions || {};
        if (!currentData.interactions[page]) {
            currentData.interactions[page] = {
                scrollDepth: [],
                clickCount: 0,
                timeOnPage: []
            };
        }

        // Save updated analytics
        await saveAnalytics(currentData);
        
    } catch (error) {
        console.error('Error tracking page view:', error);
    }
}

// Helper function to get browser info
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'unknown';

    // Detect browser
    if (ua.match(/chrome|chromium|crios/i)) {
        browserName = 'Chrome';
    } else if (ua.match(/firefox|fxios/i)) {
        browserName = 'Firefox';
    } else if (ua.match(/safari/i)) {
        browserName = 'Safari';
    } else if (ua.match(/opr\//i)) {
        browserName = 'Opera';
    } else if (ua.match(/edg/i)) {
        browserName = 'Edge';
    }

    return {
        browser: browserName,
        userAgent: ua
    };
}

// Helper function to determine device type
function getDeviceType() {
    console.group('Device Type Detection');
    
    // Get user agent and screen info
    const userAgent = navigator.userAgent.toLowerCase();
    console.log('User Agent:', userAgent);
    
    const screenWidth = window.innerWidth || 
                       document.documentElement.clientWidth || 
                       document.body.clientWidth;
    console.log('Screen Width:', screenWidth);
    
    // Check touch capability
    const hasTouch = ('ontouchstart' in window) || 
                    (navigator.maxTouchPoints > 0) || 
                    (navigator.msMaxTouchPoints > 0);
    console.log('Has Touch Capability:', hasTouch);
    console.log('Max Touch Points:', navigator.maxTouchPoints);
    
    // Define keywords for detection
    const mobileKeywords = [
        'mobile', 'iphone', 'ipod', 'android', 'webos', 'blackberry', 
        'windows phone', 'opera mini', 'mobi'
    ];
    const tabletKeywords = ['ipad', 'tablet', 'kindle'];
    
    // Check for tablet keywords
    const foundTabletKeywords = tabletKeywords.filter(keyword => userAgent.includes(keyword));
    console.log('Found Tablet Keywords:', foundTabletKeywords);
    if (foundTabletKeywords.length > 0) {
        console.log('✓ Detected as tablet due to keywords:', foundTabletKeywords);
        console.groupEnd();
        return 'tablet';
    }
    
    // Check for mobile keywords
    const foundMobileKeywords = mobileKeywords.filter(keyword => userAgent.includes(keyword));
    console.log('Found Mobile Keywords:', foundMobileKeywords);
    if (foundMobileKeywords.length > 0) {
        console.log('✓ Detected as mobile due to keywords:', foundMobileKeywords);
        console.groupEnd();
        return 'mobile';
    }
    
    // Check iOS specific detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    console.log('iOS Detection:', {
        platform: navigator.platform,
        isIOS: isIOS
    });
    
    if (isIOS) {
        if (screenWidth <= 768) {
            console.log('✓ Detected as mobile iOS device (width <= 768px)');
            console.groupEnd();
            return 'mobile';
        }
        console.log('✓ Detected as tablet iOS device');
        console.groupEnd();
        return 'tablet';
    }
    
    // Screen size and touch-based detection
    if (hasTouch) {
        console.log('Touch-based device detected, checking screen size...');
        if (screenWidth <= 768) {
            console.log('✓ Detected as mobile based on touch + screen width <= 768px');
            console.groupEnd();
            return 'mobile';
        }
        if (screenWidth <= 1024) {
            console.log('✓ Detected as tablet based on touch + screen width <= 1024px');
            console.groupEnd();
            return 'tablet';
        }
    }
    
    console.log('✓ Detected as desktop (no mobile/tablet indicators found)');
    console.groupEnd();
    return 'desktop';
}

// Add this helper to detect if the device is in portrait or landscape
function getOrientation() {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    console.log('Current Orientation:', orientation);
    return orientation;
}

// Track both initial load and orientation changes
window.addEventListener('orientationchange', async () => {
    console.log('Orientation change detected');
    // Wait for the orientation change to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    trackPageView();
});

// Track time spent on page
function trackTimeOnPage(page) {
    const startTime = Date.now();
    window.addEventListener('beforeunload', async () => {
        const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
        const currentData = JSON.parse(await loadAnalytics());
        currentData.interactions[page].timeOnPage.push(timeSpent);
        await saveAnalytics(currentData);
    });
}

// Track scroll depth
function trackScrollDepth(page) {
    let maxScroll = 0;
    window.addEventListener('scroll', _.throttle(async () => {
        const scrollPercent = Math.round((window.scrollY + window.innerHeight) / 
            document.documentElement.scrollHeight * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            const currentData = JSON.parse(await loadAnalytics());
            currentData.interactions[page].scrollDepth.push(maxScroll);
            await saveAnalytics(currentData);
        }
    }, 1000));
}

// Track clicks
function trackClicks(page) {
    document.addEventListener('click', _.throttle(async () => {
        const currentData = JSON.parse(await loadAnalytics());
        currentData.interactions[page].clickCount++;
        await saveAnalytics(currentData);
    }, 1000));
}

// Add this function to track email inquiries
async function trackEmailInquiry(formType, formData) {
    try {
        const currentData = JSON.parse(await loadAnalytics());
        const timestamp = new Date();
        const dateKey = timestamp.toISOString().split('T')[0];

        // Initialize email inquiries if not exists
        currentData.emailInquiries = currentData.emailInquiries || {
            total: 0,
            types: { quick: 0, full: 0 },
            history: [],
            productTypes: {},
            dailyStats: {}
        };

        // Update total counts
        currentData.emailInquiries.total++;
        currentData.emailInquiries.types[formType] = (currentData.emailInquiries.types[formType] || 0) + 1;

        // Track product types
        const productType = formType === 'quick' ? formData.productType : formData.productInterest;
        if (Array.isArray(productType)) {
            productType.forEach(type => {
                currentData.emailInquiries.productTypes[type] = 
                    (currentData.emailInquiries.productTypes[type] || 0) + 1;
            });
        } else if (productType) {
            currentData.emailInquiries.productTypes[productType] = 
                (currentData.emailInquiries.productTypes[productType] || 0) + 1;
        }

        // Add to history
        currentData.emailInquiries.history.push({
            timestamp: timestamp.toISOString(),
            type: formType,
            productType,
            page: window.location.pathname
        });

        // Update daily stats
        currentData.emailInquiries.dailyStats[dateKey] = 
            currentData.emailInquiries.dailyStats[dateKey] || { total: 0, types: {} };
        currentData.emailInquiries.dailyStats[dateKey].total++;
        currentData.emailInquiries.dailyStats[dateKey].types[formType] = 
            (currentData.emailInquiries.dailyStats[dateKey].types[formType] || 0) + 1;

        await saveAnalytics(currentData);
    } catch (error) {
        console.error('Error tracking email inquiry:', error);
    }
}

// Load analytics data
async function loadAnalytics() {
    try {
        const response = await storageHelper.readFile('analytics.json');
        return response;
    } catch (error) {
        console.log('No existing analytics found, starting fresh');
        return JSON.stringify(analyticsData);
    }
}

// Save analytics data
async function saveAnalytics(data) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        await storageHelper.writeFile('analytics.json', jsonString);
    } catch (error) {
        console.error('Error saving analytics:', error);
    }
}

// Initialize tracking
document.addEventListener('DOMContentLoaded', trackPageView);

// Export functions
window.analyticsTracker = {
    trackPageView,
    loadAnalytics,
    saveAnalytics,
    resetAnalytics,
    trackEmailInquiry
};