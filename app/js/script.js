// EmailJS Configuration
const EMAIL_CONFIG = {
    PUBLIC_KEY: 'DD2qYtcM8ubvw2VLB',
    SERVICE_ID: 'service_cdzbqbe',
    TEMPLATES: {
        QUICK: 'template_562otjh',
        FULL: 'template_9wcbbkd'
    }
};

// Collections mapping - key is the value in Google Sheet, value is display name
const COLLECTIONS = {
    'christmas': 'Christmas Collection',
    'cow': 'Cow Collection',
    'faith': 'Faith Collection',
    'beach': 'Beach Collection',
    'sports-outdoor': 'Sports/Outdoor Collection',
    'mothers-day': "Mother's Day Collection",
    'kids': 'Kids Collection'
};

// Categories mapping - key is the category ID, value is display name
const CATEGORIES = {
    'car-accessories': 'Car Accessories',
    'home-accessories': 'Home Accessories',
    'custom-cups': 'Custom Cups',
    'other-accessories': 'Other Accessories'
};

// Subcategories mapping - organized by parent category
// First level key is the parent category ID, second level maps subcategory ID to display name
const SUBCATEGORIES = {
    'car-accessories': {
        'freshies': 'Freshies',
        'wooden-hangers': 'Wooden Hangers',
        'hangers': 'Hangers',
        'license-plates': 'License Plates',
        'car-coasters': 'Car Coasters'
    },
    'home-accessories': {
        'wind-spinners': 'Wind Spinners',
        'cutting-boards': 'Cutting Boards',
        'photo-slates': 'Photo Slates'
    },
    'custom-cups': {
        'kids-cups': 'Kids Cups',
        'sublimation-tumblers': 'Sublimation Tumblers'
    },
    'other-accessories': {
        'sanitizer-holders': 'Hand Sanitizer Holders',
        'key-chains': 'Key Chains',
        'pop-sockets': 'Pop Sockets'
    }
};

// Google Sheets Configuration
const SHEET_ID = '13W8dMCMOwq5jhl2SnEwwb4rJNfD77UrdDWlAVyji6Ik';
const API_KEY = 'AIzaSyDy6KZcSASsTBMNd_PLc_bOW7WJNWZYtp8';

// Initialize EmailJS
function initializeEmailJS() {
    console.log('Starting EmailJS initialization...');
    
    const currentPage = window.location.pathname;
    if (currentPage.includes('index.html') || currentPage.includes('inquire.html') || currentPage === '/' || currentPage === '') {
        try {
            // Check if emailjs library is loaded
            if (typeof emailjs === 'undefined') {
                console.warn('EmailJS library not found. Some functionality may be limited.');
                return; // Exit gracefully
            }
            
            emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
            
            // Verify initialization
            console.log('EmailJS initialized. Testing configuration...');
            if (!emailjs.init) {
                throw new Error('EmailJS not properly initialized');
            }
            
            console.log('EmailJS initialization successful');
            
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
            // Don't throw the error - handle it gracefully
        }
    }
}

// Send email using EmailJS
async function sendEmail(formData, formType) {
    console.log(`Processing ${formType} inquiry submission...`);
    console.log('Form data:', formData);

    try {
        // Verify EmailJS is initialized
        if (!emailjs.init) {
            console.log('EmailJS not initialized, reinitializing...');
            emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
        }

        // Prepare email data based on form type
        let emailData;
        if (formType === 'quick') {
            emailData = {
                name: formData.name || '',
                email: formData.email || '',
                phone: formData.phone || 'Not provided',
                productType: formData.productType || 'Not selected',
                specificProduct: formData.specificProduct || 'Not specified',
                message: formData.message || '',
                contactPreference: formData.contactPreference || 'email'
            };
        } else if (formType === 'full') {
            const productInterest = Array.isArray(formData.productInterest) 
                ? formData.productInterest.join(', ') 
                : (formData.productInterest || 'None selected');
            
            const specificProducts = Array.isArray(formData.specificProducts) 
                ? formData.specificProducts.join(', ') 
                : (formData.specificProducts || 'None selected');

            emailData = {
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                email: formData.email || '',
                phone: formData.phone || 'Not provided',
                productInterest: productInterest,
                specificProducts: specificProducts,
                customRequest: formData.customRequest || 'No custom request provided',
                contactPreference: formData.contactPreference || 'email'
            };
        }

        console.log('Prepared email data:', emailData);

        // Get template ID based on form type
        const templateId = formType === 'quick' 
            ? EMAIL_CONFIG.TEMPLATES.QUICK 
            : EMAIL_CONFIG.TEMPLATES.FULL;
        
        console.log('Sending email with:', {
            serviceId: EMAIL_CONFIG.SERVICE_ID,
            templateId: templateId,
            publicKey: EMAIL_CONFIG.PUBLIC_KEY
        });

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            templateId,
            emailData
        );

        console.log('Email sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Email send failed:', error);
        throw error;
    }
}

// Utility Functions - Moved to top for availability
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Notification System Class
class NotificationSystem {
    constructor() {
        // Defer DOM manipulation to when needed
        this.container = null;
    }

    // Initialize container when needed
    initContainer() {
        if (!this.container) {
            this.container = document.getElementById('notification-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'notification-container';
                document.body.appendChild(this.container);
            }
        }
    }

    show(type, title, message, duration = 5000) {
        this.initContainer();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? '<i class="fas fa-times-circle"></i>' : 
                    type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : 
                    '<i class="fas fa-check-circle"></i>';

        notification.innerHTML = `
            <span class="notification__icon">${icon}</span>
            <div class="notification__content">
                <div class="notification__title">${title}</div>
                <div class="notification__message">${message}</div>
            </div>
            <button class="notification__close"><i class="fas fa-times"></i></button>
        `;

        this.container.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'fade-out 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'fade-out 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    error(title, message) {
        this.show('error', title, message);
    }

    warning(title, message) {
        this.show('warning', title, message);
    }

    success(title, message) {
        this.show('success', title, message);
    }
}

// Initialize notification system
const notifications = new NotificationSystem();

// Shared product data
let allProducts = [];

// Add debug flag
let debugProductLoading = false;
let debugFeaturedProducts = false;

// Products Functionality
async function loadProducts(onComplete) {
    if (debugProductLoading) {
        console.log('loadProducts called');
        console.log('Attempting to fetch from Google Sheets...');
    }

    const SHEETS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/products_list?key=${API_KEY}`;

    try {
        const response = await fetch(SHEETS_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (debugProductLoading) {
            console.log('Sheet data fetched:', data);
        }

        if (!data.values || data.values.length < 2) { // Check we have headers and at least one row
            throw new Error('No data found in sheet');
        }

        const headers = data.values[0];
        const rows = data.values.slice(1);

        // Convert to object array
        const products = rows.map(row => {
            const product = {};
            headers.forEach((header, index) => {
                product[header.trim()] = row[index] || '';
            });
            return product;
        });

        allProducts = products.map(product => {
            // Ensure each product has an ID
            if (!product.id) {
                product.id = generateProductId(product);
            }
            
            return {
                ...product,
                tags: product.tags ? product.tags.split('|') : [],
                price: parseFloat(product.price) || 0,
                isNew: product.isNew === 'TRUE',
                isFeatured: product.isFeatured === 'TRUE'
            };
        });

        if (debugProductLoading) {
            console.log('Processed products:', allProducts);
        }

        // Make allProducts available globally
        window.allProducts = allProducts;
        
        // Store in local storage for access from product detail page
        try {
            localStorage.setItem('allProducts', JSON.stringify(allProducts));
            console.log('Products saved to local storage:', allProducts.length);
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }

        if (onComplete && typeof onComplete === 'function') {
            onComplete(allProducts);
        }

    } catch (error) {
        console.error('Load error:', error);
        notifications.error(
            'Data Load Error',
            'Unable to load product data. Please refresh the page.'
        );
        throw error;
    }
}

function populateNewReleases() {
    if (debugProductLoading) console.log('populateNewReleases called');
    
    const newReleasesGrid = document.querySelector('#new-releases .products-grid');
    if (!newReleasesGrid) {
        if (debugProductLoading) console.log('New releases grid not found');
        return;
    }

    // Get all new products
    const allNewProducts = allProducts
        .filter(product => product.isNew === 'TRUE' || product.isNew === true);
    
    // Sort by featured status first, then by category
    allNewProducts.sort((a, b) => {
        // First sort by featured status (featured products first)
        const aFeatured = a.isFeatured === 'TRUE' || a.isFeatured === true;
        const bFeatured = b.isFeatured === 'TRUE' || b.isFeatured === true;
        
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
        
        // If both have the same featured status, sort by category
        return a.category.localeCompare(b.category);
    });
    
    // Select the first 3 products (or fewer if there aren't enough)
    // Try to get unique categories but prioritize featured status
    const newProducts = [];
    const categories = new Set();
    
    for (const product of allNewProducts) {
        // If we already have this category, only add it if it's featured and we have fewer than 3 products
        if (categories.has(product.category)) {
            const isFeatured = product.isFeatured === 'TRUE' || product.isFeatured === true;
            if (isFeatured && newProducts.length < 3) {
                newProducts.push(product);
            }
        } else {
            // If we don't have this category yet, add it
            categories.add(product.category);
            newProducts.push(product);
        }
        
        // Stop once we have 3 products
        if (newProducts.length >= 3) break;
    }

    if (debugProductLoading) {
        console.log('Found new products:', newProducts);
    }

    // Update each product card slot
    const productCards = newReleasesGrid.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        const product = newProducts[index];
        
        const imageElement = card.querySelector('img');
        const titleElement = card.querySelector('h3');
        const priceElement = card.querySelector('.price');

        if (product) {
            if (imageElement) {
                imageElement.src = product.imagePath || '/images/placeholder.jpg';
                imageElement.alt = product.title;
            }
            if (titleElement) {
                titleElement.textContent = product.title;
            }
            if (priceElement) {
                priceElement.textContent = `From $${parseFloat(product.price).toFixed(2)}`;
            }
            
            // Add data-product-id attribute and cursor style
            card.setAttribute('data-product-id', product.id);
            card.style.cursor = 'pointer';
            
            // Add click event listener to navigate to product detail page
            card.addEventListener('click', function() {
                // Save the product data to sessionStorage for access on product detail page
                try {
                    // Store just this specific product to ensure it's available
                    sessionStorage.setItem('currentProduct', JSON.stringify(product));
                } catch (error) {
                    console.error('Error saving product to session storage:', error);
                }
                
                window.location.href = `pages/product-detail.html?id=${product.id}`;
            });
        }
    });
}

// Add this new function to handle featured products on the index page
function populateFeaturedProducts() {
    if (debugFeaturedProducts) console.log('populateFeaturedProducts called');
    
    const sections = [
        {
            id: 'car-accessories',
            category: 'car-accessories'
        },
        {
            id: 'custom-cups',
            category: 'custom-cups'
        },
        {
            id: 'home-accessories',
            category: 'home-accessories'
        },
        {
            id: 'other-accessories',
            category: 'other-accessories'
        }
    ];

    if (debugFeaturedProducts) {
        console.log('Current allProducts:', allProducts);
        console.log('Total products loaded:', allProducts.length);
    }

    // Process each section
    sections.forEach(section => {
        const sectionGrid = document.querySelector(`#${section.id} .products-grid`);
        if (!sectionGrid) {
            if (debugFeaturedProducts) console.log(`Grid not found for section: ${section.id}`);
            return;
        }

        // Get featured products for this category
        const featuredProducts = allProducts.filter(product => {
            const isCorrectCategory = product.category === section.category;
            const isFeatured = product.isFeatured === true || product.isFeatured === 'TRUE';
            
            if (debugFeaturedProducts) {
                console.log(`Product: ${product.title}`);
                console.log(`Category check (${section.category}):`, isCorrectCategory);
                console.log('Featured check:', isFeatured);
                console.log('Raw isFeatured value:', product.isFeatured);
            }
            
            return isCorrectCategory && isFeatured;
        }).slice(0, 3);

        if (debugFeaturedProducts) {
            console.log(`Featured ${section.id} found:`, featuredProducts);
            console.log(`Number of featured ${section.id}:`, featuredProducts.length);
        }

        // Get all product card slots in this section
        const productCards = sectionGrid.querySelectorAll('.product-card');
        
        if (debugFeaturedProducts) {
            console.log(`Found product card slots for ${section.id}:`, productCards.length);
        }

        // Update each product card slot
        productCards.forEach((card, index) => {
            const product = featuredProducts[index];
            if (debugFeaturedProducts) {
                console.log(`Updating ${section.id} slot ${index + 1}:`, product);
            }

            const imageElement = card.querySelector('img');
            const titleElement = card.querySelector('h3');
            const priceElement = card.querySelector('.price');

            if (product) {
                if (imageElement) {
                    imageElement.src = product.imagePath || '/images/placeholder.jpg';
                    imageElement.alt = product.title;
                    if (debugFeaturedProducts) console.log(`Updated image for ${section.id}:`, product.imagePath);
                }

                if (titleElement) {
                    titleElement.textContent = product.title;
                    if (debugFeaturedProducts) console.log(`Updated title for ${section.id}:`, product.title);
                }

                if (priceElement) {
                    priceElement.textContent = `From $${parseFloat(product.price).toFixed(2)}`;
                    if (debugFeaturedProducts) console.log(`Updated price for ${section.id}:`, product.price);
                }

                // Add new product badge if applicable
                if (product.isNew === true || product.isNew === 'TRUE') {
                    const existingBadge = card.querySelector('.product-badge.new');
                    if (!existingBadge) {
                        const badge = document.createElement('div');
                        badge.className = 'product-badge new';
                        badge.textContent = 'New';
                        card.querySelector('.product-image').appendChild(badge);
                    }
                }
                
                // Add data-product-id attribute and cursor style
                card.setAttribute('data-product-id', product.id);
                card.style.cursor = 'pointer';
                
                // Add click event listener to navigate to product detail page
                card.addEventListener('click', function() {
                    // Save the product data to sessionStorage for access on product detail page
                    try {
                        // Store just this specific product to ensure it's available
                        sessionStorage.setItem('currentProduct', JSON.stringify(product));
                    } catch (error) {
                        console.error('Error saving product to session storage:', error);
                    }
                    
                    window.location.href = `pages/product-detail.html?id=${product.id}`;
                });
            } else {
                // Keep default placeholder state
                if (debugFeaturedProducts) console.log(`No product data for ${section.id} slot ${index + 1}`);
                if (imageElement) imageElement.src = '/images/placeholder.jpg';
                if (titleElement) titleElement.textContent = 'Loading...';
                if (priceElement) priceElement.textContent = '$0.00';
            }
        });
    });
}

// Product List Update Function - Now with debounce applied
// Update the product list with checkboxes instead of dropdown
function updateProductsList() {
    if (debugProductLoading) {
        console.log('Updating products list with checkboxes');
    }
    
    const container = document.getElementById('productsCheckboxContainer');
    const noProductsMessage = document.getElementById('noProductsMessage');
    
    if (!container) {
        if (debugProductLoading) console.log('No products container element found');
        return;
    }
    
    // Get selected categories
    const selectedCategories = Array.from(document.querySelectorAll('input[name="productInterest"]:checked'))
        .map(checkbox => checkbox.value.toLowerCase());
    
    if (debugProductLoading) {
        console.log('Selected categories:', selectedCategories);
        console.log('Number of products before filtering:', allProducts.length);
    }
    
    // Clear existing options
    container.innerHTML = '';
    
    // Show message if no categories selected
    if (selectedCategories.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.style.display = 'block';
        }
        return;
    } else {
        if (noProductsMessage) {
            noProductsMessage.style.display = 'none';
        }
    }
    
    // Organize products by category for better grouping
    const productsByCategory = {};
    
    // Filter and sort products based on selected categories
    allProducts.forEach(product => {
        const productCategory = (product.category || '').toLowerCase();
        
        // Only include products from selected categories
        if (selectedCategories.includes(productCategory)) {
            if (!productsByCategory[productCategory]) {
                productsByCategory[productCategory] = [];
            }
            
            productsByCategory[productCategory].push(product);
        }
    });
    
    // Sort each category's products by title
    for (const category in productsByCategory) {
        productsByCategory[category].sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Map category IDs to display names
    const categoryNames = {
        'car-accessories': 'Car Accessories',
        'custom-cups': 'Custom Cups',
        'home-accessories': 'Home Accessories',
        'other-accessories': 'Other Accessories'
    };
    
    // Add products by category
    for (const category of selectedCategories) {
        const products = productsByCategory[category] || [];
        
        if (products.length > 0) {
            // Add category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'checkbox-category';
            categoryHeader.textContent = categoryNames[category] || category;
            container.appendChild(categoryHeader);
            
            // Add products
            products.forEach(product => {
                if (product.title) {
                    const checkboxId = `product-${product.id.replace(/[^a-z0-9]/g, '-')}`;
                    
                    const checkboxLabel = document.createElement('label');
                    checkboxLabel.className = 'checkbox-container';
                    checkboxLabel.textContent = product.title;
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = checkboxId;
                    checkbox.name = 'specificProducts';
                    checkbox.value = product.title;
                    
                    const checkmark = document.createElement('span');
                    checkmark.className = 'checkmark';
                    
                    checkboxLabel.prepend(checkbox);
                    checkboxLabel.appendChild(checkmark);
                    
                    container.appendChild(checkboxLabel);
                }
            });
        }
    }
    
    // If no products were added, show a message
    if (container.children.length === 0) {
        container.innerHTML = '<p>No specific products available for the selected categories.</p>';
    }
}

const CATEGORY_MAPPING = {
    'car-accessories': ['freshies', 'wooden-hangers', 'hangers', 'license-plates', 'car-coasters'],
    'custom-cups': ['kids-cups', 'sublimation-tumblers'],
    'home-accessories': ['wind-spinners', 'cutting-boards', 'photo-slates'],
    'other-accessories': ['sanitizer-holders', 'key-chains', 'pop-sockets']
  };

// Function to update products display
function updateProductsDisplay(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    productsContainer.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id || generateProductId(product)}" 
             data-category="${product.category}" data-subcategory="${product.subcategory}">
            <div class="product-image">
                <img src="${product.imagePath || '/api/placeholder/300/300'}" alt="${product.title}">
                ${product.isNew ? '<div class="product-badge new">New</div>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.title}</h3>
                <p class="price">From $${parseFloat(product.price).toFixed(2)}</p>
                <p class="product-description">${product.description || ''}</p>
                <ul class="product-tags">
                ${(product.tags || []).map(tag => `<li>${tag}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    // Add click handlers to product cards
    const productCards = productsContainer.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                // Save current filter state before navigating
                saveFilterStateToSession();
                
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
    });

    // Helper function to save filter state
    function saveFilterStateToSession() {
        try {
            // Get all selected filters
            const filterState = {
                search: document.getElementById('productSearch')?.value || '',
                categories: Array.from(document.querySelectorAll('input[data-category-type="main"]:checked')).map(cb => cb.value),
                subcategories: Array.from(document.querySelectorAll('input[data-category-type="sub"]:checked')).map(cb => cb.value),
                tags: Array.from(document.querySelectorAll('input[data-filter-type="tag"]:checked')).map(cb => cb.value),
                collections: Array.from(document.querySelectorAll('input[data-filter-type="collection"]:checked')).map(cb => cb.value),
                view: document.querySelector('.view-btn.active')?.dataset?.view || 'grid',
                sort: document.getElementById('sortProducts')?.value || 'featured'
            };
            
            // Save to sessionStorage (this persists only for the current browser session)
            sessionStorage.setItem('productFilterState', JSON.stringify(filterState));
            console.log('Filter state saved:', filterState);
        } catch (error) {
            console.error('Error saving filter state:', error);
        }
    }

    // Update view based on current view mode
    const currentView = document.querySelector('.view-btn.active');
    if (currentView) {
        productsContainer.classList.toggle('gallery-view', currentView.dataset.view === 'gallery');
    }
}

// Function to generate a unique product ID if none exists
function generateProductId(product) {
    if (!product || !product.title) return 'unknown-product';
    
    // Create a consistent ID format based on the product title
    const idBase = product.title.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-')         // Replace multiple hyphens with single
        .replace(/-$/, '')           // Remove trailing hyphen
        .replace(/^-/, '');          // Remove leading hyphen
    
    // Add deterministic suffix
    let suffix = '';
    if (product.category) {
        suffix += `-${product.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }
    
    // Only add a random component if needed to avoid duplicates
    // This makes IDs more predictable across page loads
    return `${idBase}${suffix}`;
}

// Function to load product data for product detail page
async function loadProductData(productId) {
    console.log('Loading product data for ID:', productId);

    try {
        // Check if we have this specific product in sessionStorage
        const currentProduct = sessionStorage.getItem('currentProduct');
        if (currentProduct) {
            const product = JSON.parse(currentProduct);
            if (product.id === productId) {
                console.log('Found product in sessionStorage:', product.title);
                return product;
            }
        }
    } catch (storageError) {
        console.error('Error checking sessionStorage:', storageError);
    }
    
    try {
        // Try to get products from local storage first
        let products = [];
        
        try {
            const storedProducts = localStorage.getItem('allProducts');
            if (storedProducts) {
                products = JSON.parse(storedProducts);
                console.log('Loaded products from local storage:', products.length);
            }
        } catch (storageError) {
            console.error('Error loading from storage:', storageError);
        }
        
        // If no products in local storage or if it's empty, try to load from server
        if (!products || products.length === 0) {
            console.log('No products in storage, loading from server...');
            
            // Use the SHEET_ID and API_KEY from the page
            const SHEETS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/products_list?key=${API_KEY}`;
        
            const response = await fetch(SHEETS_URL, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.values || data.values.length < 2) {
                throw new Error('No data found in sheet');
            }

            const headers = data.values[0];
            const rows = data.values.slice(1);

            // Convert to object array
            products = rows.map(row => {
                const product = {};
                headers.forEach((header, index) => {
                    product[header.trim()] = row[index] || '';
                });
                return product;
            }).map(product => ({
                ...product,
                id: product.id || generateProductId(product),
                tags: product.tags ? product.tags.split('|') : [],
                price: parseFloat(product.price) || 0,
                isNew: product.isNew === 'TRUE',
                isFeatured: product.isFeatured === 'TRUE'
            }));
            
            console.log('Loaded products from server:', products.length);
            
            // Save to localStorage for future use
            try {
                localStorage.setItem('allProducts', JSON.stringify(products));
                console.log('Products saved to local storage from product detail page');
            } catch (storageError) {
                console.error('Error saving to local storage:', storageError);
            }
        }
        
        // Find the product by ID
        console.log('Looking for product with ID:', productId);
        
        // First try to find by exact ID match
        const product = products.find(p => p.id === productId);
        if (product) {
            console.log('Found product:', product.title);
            return product;
        }
        
        console.log('Trying alternative product lookup methods...');
        
        // Try with decoded ID (in case URL encoding is an issue)
        const decodedId = decodeURIComponent(productId);
        const productByDecodedId = products.find(p => p.id === decodedId);
        if (productByDecodedId) {
            console.log('Found product by decoded ID');
            return productByDecodedId;
        }
        
        // Try by partial ID match
        const idBase = productId.split('-').slice(0, -1).join('-');
        const productByPartialId = products.find(p => 
            p.id && p.id.startsWith(idBase)
        );
        
        if (productByPartialId) {
            console.log('Found product by partial ID match:', productByPartialId.title);
            return productByPartialId;
        }
        
        // Try by title containing the ID (common if IDs are derived from titles)
        const searchTerms = productId.replace(/-/g, ' ').toLowerCase().split(' ');
        const productByTitleMatch = products.find(p => 
            p.title && searchTerms.every(term => 
                p.title.toLowerCase().includes(term))
        );
        
        if (productByTitleMatch) {
            console.log('Found product by title match:', productByTitleMatch.title);
            return productByTitleMatch;
        }
        
        console.log('No product found with ID or similar matches');
        return null;
        
    } catch (error) {
        console.error('Error loading product data:', error);
        return null;
    }
}

function setupCategoryFilters() {
    const categoryGroups = document.querySelectorAll('.category-group');

    categoryGroups.forEach(group => {
        const mainCheckbox = group.querySelector('input[data-category-type="main"]');
        const subCheckboxes = group.querySelectorAll('input[data-category-type="sub"]');
        
        // Handle main category changes
        mainCheckbox.addEventListener('change', (e) => {
        // Update all subcategories to match main category state
        subCheckboxes.forEach(sub => {
            sub.checked = e.target.checked;
        });
        filterProducts();
        });

        // Handle subcategory changes
        subCheckboxes.forEach(sub => {
        sub.addEventListener('change', () => {
            // Check if any subcategories are selected
            const anySubChecked = Array.from(subCheckboxes).some(checkbox => checkbox.checked);
            mainCheckbox.checked = anySubChecked;
            filterProducts();
        });
        });
    });
}

// Filter products function with improved error handling
function filterProducts() {
    try {
        if (debugProductLoading) console.log('Starting filterProducts function');
        
        const searchInputs = [
            document.getElementById('productSearch'),
            document.getElementById('mobileSearch')
        ].filter(Boolean);
        
        const searchTerm = (searchInputs[0]?.value || '').toLowerCase();
        const productsContainer = document.getElementById('productsContainer');
        const productsCount = document.querySelector('.products-count span');
        
        // Initialize filteredProducts first
        let filteredProducts = [...allProducts];

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const collectionFilter = urlParams.get('collection');
        const showCollections = urlParams.get('filter') === 'collections';
        const showNew = urlParams.get('filter') === 'new';

        if (debugProductLoading) {
            console.log('Initial state:', {
                totalProducts: allProducts.length,
                showNew,
                showCollections,
                collectionFilter
            });
        }

        // Get all selected filters
        const selectedMainCategories = Array.from(document.querySelectorAll('input[data-category-type="main"]:checked'))
            .map(cb => cb.value);
        const selectedSubCategories = Array.from(document.querySelectorAll('input[data-category-type="sub"]:checked'))
            .map(cb => cb.value);
        const selectedTags = Array.from(document.querySelectorAll('input[data-filter-type="tag"]:checked'))
            .map(cb => cb.value);
        const selectedCollections = Array.from(document.querySelectorAll('input[data-filter-type="collection"]:checked'))
            .map(cb => cb.value);

        if (debugProductLoading) {
            console.log('Selected filters:', {
                mainCategories: selectedMainCategories,
                subCategories: selectedSubCategories,
                tags: selectedTags,
                collections: selectedCollections
            });
        }

        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => {
                return (
                    product.title?.toLowerCase().includes(searchTerm) ||
                    product.category?.toLowerCase().includes(searchTerm) ||
                    product.subcategory?.toLowerCase().includes(searchTerm) ||
                    product.collection?.toLowerCase().includes(searchTerm) ||
                    (product.tags && Array.isArray(product.tags) && 
                     product.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                    product.description?.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Apply category filters
        if (selectedMainCategories.length > 0 || selectedSubCategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                const mainCategoryMatch = selectedMainCategories.length === 0 || 
                    selectedMainCategories.includes(product.category);
                const subCategoryMatch = selectedSubCategories.length === 0 || 
                    selectedSubCategories.includes(product.subcategory);
                return mainCategoryMatch && subCategoryMatch;
            });
        }

        // Apply tag filters
        if (selectedTags.length > 0 || showNew) {
            filteredProducts = filteredProducts.filter(product => {
                // Handle "new" filter
                if ((selectedTags.includes('new') || showNew) && 
                    !(product.isNew === 'TRUE' || product.isNew === true)) {
                    return false;
                }
                
                // Handle other tags
                const productTags = Array.isArray(product.tags) ? product.tags : 
                    (typeof product.tags === 'string' ? product.tags.split('|') : []);
                
                return selectedTags.every(tag => {
                    if (tag === 'new') return true; // Already handled above
                    if (tag === 'seasonal') return productTags.includes('seasonal');
                    if (tag === 'custom') return productTags.includes('custom');
                    return true;
                });
            });
        }

        // Apply collection filters
        if (selectedCollections.length > 0 || showCollections || collectionFilter) {
            filteredProducts = filteredProducts.filter(product => {
                if (showCollections) {
                    return product.collection && product.collection.trim() !== '';
                }
                if (collectionFilter) {
                    return product.collection === collectionFilter;
                }
                return selectedCollections.includes(product.collection);
            });
        }

        if (debugProductLoading) {
            console.log('After filtering:', {
                filteredCount: filteredProducts.length,
                remainingProducts: filteredProducts.slice(0, 2)
            });
        }

        // Update the products display
        updateProductsDisplay(filteredProducts);
        
        // Update count
        if (productsCount) {
            productsCount.textContent = `Showing ${filteredProducts.length} products`;
        }

        // Update filter count for mobile
        updateFilterCount();

    } catch (error) {
        console.error('Filter error:', error);
        notifications.error(
            'Filter Error',
            'Error filtering products. Please refresh the page.'
        );
    }
}

function handleUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const showNew = urlParams.get('filter') === 'new';
    const collectionFilter = urlParams.get('collection');

    // Handle 'new' filter
    const newArrivalsCheckbox = document.querySelector('input[value="new"][data-filter-type="tag"]');
    if (newArrivalsCheckbox && showNew) {
        newArrivalsCheckbox.checked = true;
        // Add change event listener to allow unchecking
        newArrivalsCheckbox.addEventListener('change', function() {
            if (!this.checked) {
                // Remove the filter parameter from URL
                urlParams.delete('filter');
                const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                history.replaceState({}, '', newUrl);
            }
            filterProducts();
        });
    }

    // Handle collection filter similarly
    if (collectionFilter) {
        const collectionCheckbox = document.querySelector(`input[value="${collectionFilter}"][data-filter-type="collection"]`);
        if (collectionCheckbox) {
            collectionCheckbox.checked = true;
            collectionCheckbox.addEventListener('change', function() {
                if (!this.checked) {
                    urlParams.delete('collection');
                    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                    history.replaceState({}, '', newUrl);
                }
                filterProducts();
            });
        }
    }
}

function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check for valid length (10 or 11 digits)
    if (cleaned.length < 10 || cleaned.length > 11) {
        return false;
    }
    
    // If 11 digits, first digit should be 1
    if (cleaned.length === 11 && cleaned[0] !== '1') {
        return false;
    }
    
    return true;
}

function initializePhoneValidation() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        // Add input event listener for validation
        input.addEventListener('input', function(e) {
            validatePhoneNumber(this);
        });
        
        // Add blur event listener for formatting
        input.addEventListener('blur', function(e) {
            if (this.value) {
                const cleaned = this.value.replace(/\D/g, '');
                const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
                if (match) {
                    this.value = match[1] + '-' + match[2] + '-' + match[3];
                }
            }
        });
    });
}

function validatePhoneNumber(input) {
    const phoneValue = input.value.replace(/\D/g, '');
    
    // Check if empty (for optional fields)
    if (!phoneValue) {
        input.setCustomValidity('');
        return true;
    }
    
    // Check length (10 or 11 digits)
    if (phoneValue.length < 10 || phoneValue.length > 11) {
        input.setCustomValidity('Please enter a valid phone number');
        return false;
    }
    
    // If 11 digits, first must be 1
    if (phoneValue.length === 11 && phoneValue[0] !== '1') {
        input.setCustomValidity('11-digit numbers must start with 1');
        return false;
    }
    
    input.setCustomValidity('');
    return true;
}

// Sort products function with improved error handling
function sortProducts(method) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    const products = Array.from(productsContainer.children);
    
    products.sort((a, b) => {
        const titleA = a.querySelector('h3')?.textContent || '';
        const titleB = b.querySelector('h3')?.textContent || '';
        const priceA = parseFloat(a.querySelector('.price')?.textContent.replace('From $', '') || '0');
        const priceB = parseFloat(b.querySelector('.price')?.textContent.replace('From $', '') || '0');
        
        // Get featured status from data attributes (we'll add these later)
        const featuredA = a.getAttribute('data-featured') === 'true';
        const featuredB = b.getAttribute('data-featured') === 'true';

        switch(method) {
            case 'featured': 
                // If one is featured and the other isn't, the featured one comes first
                if (featuredA && !featuredB) return -1;
                if (!featuredA && featuredB) return 1;
                // If both are featured or both are not featured, sort alphabetically
                return titleA.localeCompare(titleB);
            case 'name-asc': return titleA.localeCompare(titleB);
            case 'name-desc': return titleB.localeCompare(titleA);
            case 'price-asc': return priceA - priceB;
            case 'price-desc': return priceB - priceA;
            default: return 0; // Default to 'featured' sort
        }
    });

    // Clear and repopulate container
    while (productsContainer.firstChild) {
        productsContainer.removeChild(productsContainer.firstChild);
    }
    products.forEach(product => productsContainer.appendChild(product));
}

function getSelectedFilters() {
    // Get all checkboxes from both desktop and mobile views
    const isMobile = window.innerWidth <= 768;
    const filterContainer = isMobile 
        ? document.getElementById('filterPanel')
        : document.querySelector('.products-sidebar');
    
    if (!filterContainer) return [];

    const selectedCategories = Array.from(filterContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
        
    return selectedCategories;
}

// Update filter count based on categories with active filters
function updateFilterCount() {
    // Get the filter count element
    const filterCount = document.querySelector('.filter-count');
    if (!filterCount) return;

    // Count categories that have active filters
    let activeCategories = 0;

    // Check category filters
    const hasActiveCategories = Array.from(document.querySelectorAll('input[type="checkbox"][value="freshies"], input[type="checkbox"][value="cups"], input[type="checkbox"][value="slates"]'))
        .some(cb => cb.checked);
    if (hasActiveCategories) activeCategories++;

    // Check tag filters
    const hasActiveTags = Array.from(document.querySelectorAll('input[type="checkbox"][value="new"], input[type="checkbox"][value="seasonal"], input[type="checkbox"][value="custom"]'))
        .some(cb => cb.checked);
    if (hasActiveTags) activeCategories++;

    // Update the filter count display
    filterCount.textContent = activeCategories > 0 ? `(${activeCategories})` : '';
}

function syncFiltersState(sourceContainer) {
    // Get all checked values from the source container
    const checkedValues = Array.from(sourceContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    // Update all checkboxes with matching values
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkedValues.includes(checkbox.value)) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }
    });
}

// Panel management functions
function openPanel(panel) {
    panel.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePanel(panel) {
    panel.classList.remove('active');
    document.body.style.overflow = '';
}

function initializeMobileControls() {
    console.log('Starting initializeMobileControls');

    // Check window width
    console.log('Window width:', window.innerWidth);
    if (window.innerWidth > 768) {
        console.log('Window too wide, exiting mobile controls');
        return;
    }

    // Cache DOM elements
    const filterBtn = document.getElementById('filterBtn');
    const sortBtn = document.getElementById('sortBtn');
    const filterPanel = document.getElementById('filterPanel');
    const sortPanel = document.getElementById('sortPanel');

    // Log element existence
    console.log('Elements found:', {
        filterBtn: !!filterBtn,
        sortBtn: !!sortBtn,
        filterPanel: !!filterPanel,
        sortPanel: !!sortPanel
    });

    if (!filterBtn || !sortBtn || !filterPanel || !sortPanel) {
        console.error('Missing required elements for mobile controls');
        return;
    }

    // Add debugging to panel functions
    function openPanel(panel) {
        console.log('Opening panel:', panel.id);
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Panel classes after open:', panel.className);
    }

    function closePanel(panel) {
        console.log('Closing panel:', panel.id);
        panel.classList.remove('active');
        document.body.style.overflow = '';
        console.log('Panel classes after close:', panel.className);
    }

    // Filter button click
    filterBtn.addEventListener('click', (e) => {
        console.log('Filter button clicked');
        e.preventDefault();
        openPanel(filterPanel);
    });

    // Sort button click
    sortBtn.addEventListener('click', (e) => {
        console.log('Sort button clicked');
        e.preventDefault();
        openPanel(sortPanel);
    });

    // Log event listener attachment
    console.log('Event listeners attached to buttons');

    // Add logging to panel styles
    console.log('Initial panel styles:', {
        filterPanel: {
            display: window.getComputedStyle(filterPanel).display,
            visibility: window.getComputedStyle(filterPanel).visibility,
            opacity: window.getComputedStyle(filterPanel).opacity,
            position: window.getComputedStyle(filterPanel).position,
            zIndex: window.getComputedStyle(filterPanel).zIndex
        },
        sortPanel: {
            display: window.getComputedStyle(sortPanel).display,
            visibility: window.getComputedStyle(sortPanel).visibility,
            opacity: window.getComputedStyle(sortPanel).opacity,
            position: window.getComputedStyle(sortPanel).position,
            zIndex: window.getComputedStyle(sortPanel).zIndex
        }
    });

    // Cancel buttons
    document.getElementById('filterCancel').addEventListener('click', () => {
        closePanel(filterPanel);
        // Reset filters to state before panel was opened
        restoreFilterState();
    });

    document.getElementById('sortCancel').addEventListener('click', () => {
        closePanel(sortPanel);
    });

    // Apply buttons
    document.getElementById('filterApply').addEventListener('click', () => {
        // Save current filter state
        saveFilterState();
        closePanel(filterPanel);
        filterProducts();
    });

    document.getElementById('sortApply').addEventListener('click', () => {
        closePanel(sortPanel);
        const selectedOption = sortPanel.querySelector('.sort-option.active');
        if (selectedOption) {
            sortProducts(selectedOption.dataset.sort);
        }
    });

    // Sort options selection
    const sortOptions = sortPanel.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
        option.addEventListener('click', () => {
            sortOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // Close on outside click
    [filterPanel, sortPanel].forEach(panel => {
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                closePanel(panel);
                if (panel === filterPanel) {
                    restoreFilterState();
                }
            }
        });
    });
}

// Add these helper functions for managing filter state
let savedFilterState = new Map();

function saveFilterState() {
    savedFilterState.clear();
    document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(checkbox => {
        savedFilterState.set(checkbox.value, checkbox.checked);
    });
}

function restoreFilterState() {
    document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(checkbox => {
        const savedState = savedFilterState.get(checkbox.value);
        if (savedState !== undefined) {
            checkbox.checked = savedState;
        }
    });
}

// Header initialization function
function initializeHeader() {
    const btnHamburger = document.querySelector('#btnHamburger');
    const body = document.querySelector('body');
    const header = document.querySelector('.header');
    const overlay = document.querySelector('.overlay');
    const fadeElems = document.querySelectorAll('.has-fade');
    const mobileMenu = document.querySelector('.header__menu');
    
    // Check if we're on the home page
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname === '/index.html';
    
    // Add home-page class if on home page
    if (isHomePage) {
        document.body.classList.add('home-page');
    }

    // Header scroll function with smooth transitions
    function updateHeader() {
        if (isHomePage) {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 50;
            const logoThreshold = 30; // Earlier threshold for logo switch
            
            // Add or remove scrolled class based on scroll position
            if (scrollPosition > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Calculate opacity for background
            const opacity = Math.min(scrollPosition / scrollThreshold, 1);
            header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            
            // Calculate shadow opacity
            const shadowOpacity = Math.min((scrollPosition - scrollThreshold/2) / scrollThreshold, 0.1);
            if (shadowOpacity > 0) {
                header.style.boxShadow = `0 2px 8px rgba(84, 213, 118, ${shadowOpacity})`;
            } else {
                header.style.boxShadow = 'none';
            }
        }
    }

    // Menu functions
    function closeMenu() {
        if (!body || !header || !fadeElems) return;
        
        body.classList.remove('noscroll');
        header.classList.remove('open');
        fadeElems.forEach(function(element) {
            element.classList.remove('fade-in');
            element.classList.add('fade-out');
        });
    }

    function openMenu() {
        if (!body || !header || !fadeElems) return;
        
        body.classList.add('noscroll');
        header.classList.add('open');
        fadeElems.forEach(function(element) {
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
        });
    }

    // Event listeners
    if (btnHamburger && header && mobileMenu) {
        btnHamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (header.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (header.classList.contains('open') && 
                !mobileMenu.contains(e.target) && 
                !btnHamburger.contains(e.target)) {
                closeMenu();
            }
        });

        // Close menu when clicking menu items
        const menuItems = mobileMenu.querySelectorAll('a');
        menuItems.forEach(item => {
            item.addEventListener('click', closeMenu);
        });
    }

    // Add scroll listener only on home page
    if (isHomePage) {
        window.addEventListener('scroll', updateHeader);
        // Initial header state
        updateHeader();
    }
}

// Function to dynamically generate category filters
function generateCategoryFilters() {
    const filterContainer = document.querySelector('.filter-section .filter-options');
    if (!filterContainer) return;
    
    // Clear existing content
    filterContainer.innerHTML = '';
    
    // Loop through each category
    for (const categoryId in CATEGORIES) {
        const categoryName = CATEGORIES[categoryId];
        const subcategories = SUBCATEGORIES[categoryId] || {};
        
        // Create category group
        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'category-group';
        
        // Create category main section
        const categoryMain = document.createElement('div');
        categoryMain.className = 'category-main';
        categoryMain.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" value="${categoryId}" data-category-type="main">
                <span class="checkmark"></span>
                ${categoryName}
            </label>
            <button class="toggle-subcategories"></button>
        `;
        
        // Create subcategory list
        const subcategoryList = document.createElement('div');
        subcategoryList.className = 'subcategory-list hidden';
        
        // Add subcategories
        for (const subcategoryId in subcategories) {
            const subcategoryName = subcategories[subcategoryId];
            
            const subcategoryLabel = document.createElement('label');
            subcategoryLabel.className = 'checkbox-container';
            subcategoryLabel.innerHTML = `
                <input type="checkbox" value="${subcategoryId}" data-category-type="sub">
                <span class="checkmark"></span>
                ${subcategoryName}
            `;
            
            subcategoryList.appendChild(subcategoryLabel);
        }
        
        // Assemble the category group
        categoryGroup.appendChild(categoryMain);
        categoryGroup.appendChild(subcategoryList);
        
        // Add to container
        filterContainer.appendChild(categoryGroup);
    }
    
    // Setup toggle functionality for the generated elements
    setupCategoryToggles();
}

// Function to dynamically generate collection filters
function generateCollectionFilters() {
    const filterContainer = document.querySelector('.filter-section .filter-options.tags');
    if (!filterContainer) return;
    
    // Clear existing content but keep the "New Arrivals" checkbox if it exists
    const newArrivalHTML = `
        <label class="checkbox-container">
            <input type="checkbox" value="new" data-filter-type="tag">
            <span class="checkmark"></span>
            New Arrivals
        </label>
    `;
    
    filterContainer.innerHTML = newArrivalHTML;
    
    // Add collection filters
    for (const collectionId in COLLECTIONS) {
        const collectionName = COLLECTIONS[collectionId];
        
        const collectionLabel = document.createElement('label');
        collectionLabel.className = 'checkbox-container';
        collectionLabel.innerHTML = `
            <input type="checkbox" value="${collectionId}" data-filter-type="collection">
            <span class="checkmark"></span>
            ${collectionName}
        `;
        
        filterContainer.appendChild(collectionLabel);
    }
}

// Function to setup toggle functionality for category filters
function setupCategoryToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-subcategories');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryGroup = this.closest('.category-group');
            const subcategoryList = categoryGroup.querySelector('.subcategory-list');
            
            // Toggle expanded state
            categoryGroup.classList.toggle('expanded');
            
            // Toggle visibility
            subcategoryList.classList.toggle('hidden');
        });
    });
}

// Listen for storage events to sync product data
window.addEventListener('storage', function(e) {
    if (e.key === 'allProducts') {
        console.log('Products updated in another tab, syncing...');
        try {
            const products = JSON.parse(e.newValue);
            allProducts = products;
            window.allProducts = products;
        } catch (error) {
            console.error('Error syncing products:', error);
        }
    }
});

// Promotions Slider Functionality
function initPromotionsSlider() {
    const slider = document.querySelector('.promo-slider-fullwidth .slider');
    const slides = document.querySelectorAll('.promo-slider-fullwidth .slide');
    const prevBtn = document.querySelector('.promo-slider-fullwidth .slider-nav.prev');
    const nextBtn = document.querySelector('.promo-slider-fullwidth .slider-nav.next');
    const indicators = document.querySelectorAll('.promo-slider-fullwidth .indicator');
    
    if (!slider || slides.length === 0) return;
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // Set up automatic sliding with a longer duration for reading
    let slideInterval = setInterval(nextSlide, 6000);
    
    // Initialize the slider
    updateSlider();
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      prevSlide();
    });
    
    if (nextBtn) nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      nextSlide();
    });
    
    // Add click events to indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => goToSlide(index));
    });
    
    // Pause autoplay on hover
    slider.addEventListener('mouseenter', () => {
      clearInterval(slideInterval);
    });
    
    // Resume autoplay on mouse leave
    slider.addEventListener('mouseleave', () => {
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 6000);
    });
    
    // Function to go to previous slide
    function prevSlide() {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateSlider();
      resetInterval();
    }
    
    // Function to go to next slide
    function nextSlide() {
      currentSlide = (currentSlide + 1) % slideCount;
      updateSlider();
      resetInterval();
    }
    
    // Function to go to a specific slide
    function goToSlide(index) {
      currentSlide = index;
      updateSlider();
      resetInterval();
    }
    
    // Update the slider position and indicators
    function updateSlider() {
      // Update slider transform
      slider.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
      });
    }
    
    // Reset the interval when manually changing slides
    function resetInterval() {
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 6000);
    }
}

// Video Banner Functionality
function initVideoBanner() {
    const video = document.getElementById('promotionVideo');
    
    if (!video) return;
    
    // Make sure video plays even if autoplay fails
    video.addEventListener('canplay', function() {
      // Try to play
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play was prevented. Adding click to play fallback.');
          
          // Add play button if autoplay is blocked
          const playButton = document.createElement('button');
          playButton.className = 'video-play-button';
          playButton.innerHTML = '<i class="fas fa-play"></i>';
          playButton.setAttribute('aria-label', 'Play video');
          
          video.parentNode.appendChild(playButton);
          
          playButton.addEventListener('click', () => {
            video.play();
            playButton.style.display = 'none';
          });
        });
      }
    });
    
    // Fix for iOS where videos can sometimes stall
    video.addEventListener('pause', function() {
      if (!video.ended) {
        video.play();
      }
    });
}

// DOM Content Loaded Event Handler
document.addEventListener('DOMContentLoaded', function() {
    if (debugProductLoading) {
        console.log('DOM Content Loaded');
        console.log('Current URL:', window.location.href);
    }
    
    // Initialize cart and update cart badges
    if (window.cart) {
        window.cart.loadCart();
        window.cart.updateCartBadge();
    }

    // Initialize the video banner
    initVideoBanner();

    // Add this line to initialize analytics
    trackPageView().catch(error => console.error('Analytics error:', error));

    try {
        console.log('DOM loaded, initializing EmailJS...');
        initializeEmailJS();

        // Verify initialization worked
        console.log('EmailJS initialization status:', {
            initialized: !!emailjs.init,
            publicKey: EMAIL_CONFIG.PUBLIC_KEY
        });
    } catch (error) {
        console.error('Failed to initialize EmailJS on load:', error);
    }

    // Initialize products page if applicable
    if (document.getElementById('productsContainer')) {
        if (debugProductLoading) console.log('Initializing products page');

        // Generate filters dynamically
        generateCategoryFilters();
        generateCollectionFilters();

        // Apply the same dynamic filter generation to mobile filters
        const mobileFilterContainer = document.querySelector('#filterPanel .panel-body');
        if (mobileFilterContainer) {
            const desktopFilterContainer = document.querySelector('.products-sidebar');
            if (desktopFilterContainer) {
                // Clone the desktop filters to the mobile panel
                mobileFilterContainer.innerHTML = '';
                const filterSections = desktopFilterContainer.querySelectorAll('.filter-section');
                filterSections.forEach(section => {
                    mobileFilterContainer.appendChild(section.cloneNode(true));
                });
                
                // Setup event handlers for the cloned elements
                setupCategoryToggles();
            }
        }
        
        // Try to restore filter state from sessionStorage
        try {
            const savedFilterState = sessionStorage.getItem('productFilterState');
            if (savedFilterState) {
                const filterState = JSON.parse(savedFilterState);
                console.log('Restoring filter state:', filterState);
                
                // Restore search term
                const searchInputs = [
                    document.getElementById('productSearch'),
                    document.getElementById('mobileSearch')
                ].filter(Boolean);
                
                searchInputs.forEach(input => {
                    if (input && filterState.search) {
                        input.value = filterState.search;
                    }
                });
                
                // Restore category selections
                filterState.categories.forEach(category => {
                    const checkbox = document.querySelector(`input[data-category-type="main"][value="${category}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore subcategory selections
                filterState.subcategories.forEach(subcategory => {
                    const checkbox = document.querySelector(`input[data-category-type="sub"][value="${subcategory}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore tag selections
                filterState.tags.forEach(tag => {
                    const checkbox = document.querySelector(`input[data-filter-type="tag"][value="${tag}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore collection selections
                filterState.collections.forEach(collection => {
                    const checkbox = document.querySelector(`input[data-filter-type="collection"][value="${collection}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore view mode
                if (filterState.view) {
                    const viewBtn = document.querySelector(`.view-btn[data-view="${filterState.view}"]`);
                    if (viewBtn) {
                        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
                        viewBtn.classList.add('active');
                        const productsContainer = document.getElementById('productsContainer');
                        if (productsContainer) {
                            productsContainer.classList.toggle('gallery-view', filterState.view === 'gallery');
                        }
                    }
                }
                
                // Restore sort selection
                if (filterState.sort) {
                    const sortSelect = document.getElementById('sortProducts');
                    if (sortSelect) sortSelect.value = filterState.sort;
                }
                
                // Clear the saved state to prevent it from applying again on manual refresh
                sessionStorage.removeItem('productFilterState');
            }
        } catch (error) {
            console.error('Error restoring filter state:', error);
        }
        
        initializeMobileControls();
        setupCategoryFilters();
        initializePhoneValidation();
        
        loadProducts(() => {
            if (debugProductLoading) console.log('Products loaded callback executed');
            handleUrlFilters(); // Add this line
            filterProducts();
    
            // Apply featured sorting by default
            sortProducts('featured');
        }).catch(error => {
            console.error('Error loading products:', error);
        });
    }

    // Initialize index page if applicable
    else if (document.querySelector('#new-releases') || document.querySelector('.category-section')) {
        if (debugProductLoading) {
            console.log('Initializing index page');
        }

        // Load products for index page
        loadProducts(() => {
            if (debugProductLoading) {
                console.log('Products loaded for index page');
                console.log('allProducts length:', allProducts.length);
            }
            // Populate both new releases and featured products
            if (document.querySelector('#new-releases')) {
                populateNewReleases();
            }
            if (document.querySelector('.category-section')) {
                populateFeaturedProducts();
            }
        }).catch(error => {
            console.error('Error loading products:', error);
        });
    }

    // Make sure updateFilterCount is called when filters change
    const filterPanel = document.getElementById('filterPanel');
    if (filterPanel) {
        const checkboxes = filterPanel.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateFilterCount);
        });
    }

    // Initialize product detail page if applicable
    if (window.location.pathname.includes('product-detail.html')) {
        console.log('Initializing product detail page');
        
        // Get product ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showProductDetailError();
            return;
        }
        
        // Load product data
        loadProductData(productId)
            .then(product => {
                if (!product) {
                    showError();
                    return;
                }
                
                // Update product details
                updateProductDetails(product);
                
                // Hide loading and error state, show product details
                loadingState.style.display = 'none';
                errorState.style.display = 'none'; // Add this line
                productDetails.style.display = 'grid';
                
                // Set up the image lightbox
                setupLightbox();
                
                // Load related products
                loadRelatedProducts(product);
                
                // If there's a trackProductView function, call it here
                if (typeof trackProductView === 'function') {
                    trackProductView(product);
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                showError();
            });
    }

    // Helper function for product detail error
    function showProductDetailError() {
        // Initialize elements
        const loadingState = document.getElementById('loadingState');
        const productDetails = document.getElementById('productDetails');
        const errorState = document.getElementById('errorState');
        
        // Initialize cart if available
        if (window.cart && window.cart.loadCart) {
            window.cart.loadCart();  // Ensure cart is loaded
        }
        
        if (loadingState) loadingState.style.display = 'none';
        if (productDetails) productDetails.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }
    
    initializeHeader();

    // Make product cards show pointer cursor
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.cursor = 'pointer';
    });

    // FAQ Functionality
    const faqQuestions = document.querySelectorAll('.faq__question');
    if (faqQuestions) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const toggle = question.querySelector('.faq__toggle');
                if (!answer || !toggle) return;
                
                faqQuestions.forEach(item => {
                    const otherAnswer = item.nextElementSibling;
                    const otherToggle = item.querySelector('.faq__toggle');
                    
                    if (otherAnswer && otherAnswer !== answer) {
                        otherAnswer.classList.remove('active');
                        if (otherToggle) otherToggle.textContent = '+';
                    }
                });
                
                answer.classList.toggle('active');
                toggle.textContent = answer.classList.contains('active') ? '-' : '+';
            });
        });
    }

    // Products Page Initialization
    const productsContainer = document.getElementById('productsContainer');
    const viewButtons = document.querySelectorAll('.view-btn');
    const searchInput = document.getElementById('productSearch');
    const sortSelect = document.getElementById('sortProducts');
    const categoryCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');

    if (productsContainer) {
        if (debugProductLoading) console.log('Initializing products page');
        // Mobile-specific functionality
        if (window.innerWidth <= 768) {
            initializeMobileView();
        }

        const urlParams = new URLSearchParams(window.location.search);
        const preloadedCategory = urlParams.get('category');

        // Handle preloaded category
        if (preloadedCategory) {
            const checkbox = Array.from(categoryCheckboxes)
                .find(cb => cb.value.toLowerCase() === preloadedCategory.toLowerCase());
            if (checkbox) checkbox.checked = true;
        }

        // Load products and initialize page
        loadProducts(() => {
            filterProducts();
    
            // Apply featured sorting by default
            sortProducts('featured');
        });

        // View toggle functionality
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                productsContainer.classList.toggle('gallery-view', btn.dataset.view !== 'grid');
            });
        });

        // Event Listeners for products page
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterProducts, 300));
        }

        if (categoryCheckboxes) {
            categoryCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    filterProducts();
                    updateProductsList();
                });
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortProducts(e.target.value);
            });
        }
    }

    // Initialize inquiry form if it exists
    const fullInquiryForm = document.getElementById('inquiryForm');
    if (fullInquiryForm) {
        console.log('Found full inquiry form, initializing');
        
        loadProducts(() => {
            console.log('Products loaded for full inquiry form');
            initializeFullInquiryForm(fullInquiryForm);  // Pass the form directly
        }).catch(error => {
            console.error('Error loading products:', error);
            notifications.error(
                'Error',
                'Unable to load products. Please refresh the page.'
            );
        });
    }

    // Initialize quick inquiry form if it exists
    const quickInquiryForm = document.querySelector('#quick-inquiry form');
    if (quickInquiryForm) {
        if (debugProductLoading) console.log('Found quick inquiry form, initializing');
        
        loadProducts(() => {
            if (debugProductLoading) console.log('Products loaded for quick inquiry form');
            initializeQuickInquiryForm(quickInquiryForm);
        }).catch(error => {
            console.error('Error loading products:', error);
            notifications.error(
                'Error',
                'Unable to load products. Please refresh the page.'
            );
        });
    }

    // Initialize category toggles
    const toggleButtons = document.querySelectorAll('.toggle-subcategories');
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
        e.preventDefault();
        const categoryGroup = button.closest('.category-group');
        const subcategoryList = categoryGroup.querySelector('.subcategory-list');
        const isHidden = subcategoryList.classList.contains('hidden');
        
        // Toggle expanded state
        categoryGroup.classList.toggle('expanded');
        
        // Toggle visibility
        subcategoryList.classList.toggle('hidden');
        });
    });

    // Setup search functionality for both desktop and mobile search inputs
    const searchInputs = [
        document.getElementById('productSearch'),
        document.getElementById('mobileSearch')
    ].filter(Boolean); // Filter out any null elements

    searchInputs.forEach(searchInput => {
        searchInput.addEventListener('input', debounce(() => {
            filterProducts();
        }, 300)); // 300ms debounce to prevent too frequent updates
    });

    // Sync the search inputs
    searchInputs.forEach(searchInput => {
        searchInput.addEventListener('input', (e) => {
            searchInputs.forEach(input => {
                if (input !== e.target) {
                    input.value = e.target.value;
                }
            });
        });
    });
});

// Separate function for inquiry form initialization with improved error handling
function initializeInquiryForm() {
    if (debugProductLoading) console.log('Initializing inquiry form');
    
    const form = document.getElementById('inquiryForm');
    if (!form) {
        if (debugProductLoading) console.log('No inquiry form found');
        return;
    }

    if (debugProductLoading) {
        console.log('Current allProducts status:', {
            exists: !!allProducts,
            length: allProducts ? allProducts.length : 0
        });
    }

    // Initialize form validation
    initializeFormValidation();

    // Initial population of products list
    updateProductsList();

    // Add event listeners to product interest checkboxes
    const productInterestCheckboxes = form.querySelectorAll('input[name="productInterest"]');
    productInterestCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (debugProductLoading) console.log('Product interest changed:', checkbox.value);
            updateProductsList();
        });
    });
}

// Add this to your DOMContentLoaded event handler
function initializeFormValidation() {
    const form = document.getElementById('inquiryForm');
    if (!form) return;

    // Get all form inputs that need validation
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        // Add validation message element after each input
        const validationMessage = document.createElement('div');
        validationMessage.className = 'validation-message';
        input.parentNode.insertBefore(validationMessage, input.nextSibling);

        // Update validation message based on input type
        function updateValidationMessage() {
            if (input.validity.valueMissing) {
                validationMessage.textContent = 'This field is required';
            } else if (input.validity.typeMismatch) {
                switch (input.type) {
                    case 'email':
                        validationMessage.textContent = 'Please enter a valid email address';
                        break;
                    case 'tel':
                        validationMessage.textContent = 'Please enter a valid phone number';
                        break;
                    default:
                        validationMessage.textContent = 'Please enter a valid value';
                }
            } else {
                validationMessage.textContent = '';
            }
        }

        // Add event listeners for validation
        input.addEventListener('blur', () => {
            input.classList.add('touched');
            updateValidationMessage();
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('touched')) {
                updateValidationMessage();
            }
        });
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        // Mark all fields as touched on submit attempt
        inputs.forEach(input => {
            input.classList.add('touched');
            input.dispatchEvent(new Event('input'));
        });

        // Let the form's native validation handle the rest
        if (!form.checkValidity()) {
            e.preventDefault();
            // Focus the first invalid field
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }
    });
}

// Quick Inquiry Form Handler (index.html)
function initializeQuickInquiryForm(form) {
    console.log('Initializing quick inquiry form...');

    const elements = {
        productTypeSelect: form.querySelector('#productType'),
        specificProductSelect: form.querySelector('#specificProduct'),
        contactPreferenceSelect: form.querySelector('#contactPreference'),
        phoneInput: form.querySelector('.phone-input'),
        submitButton: form.querySelector('button[type="submit"]')
    };

    // Verify form elements
    if (!elements.productTypeSelect || !elements.specificProductSelect) {
        console.error('Required form elements not found');
        return;
    }

    // Handle product type changes
    elements.productTypeSelect.addEventListener('change', function() {
        try {
            console.log('Product type changed:', this.value);
            const selectedCategory = this.value;
            
            if (!selectedCategory) {
                console.log('No category selected, resetting specific product select');
                elements.specificProductSelect.innerHTML = '<option value="">Select a specific product...</option>';
                elements.specificProductSelect.disabled = true;
                return;
            }

            // Verify allProducts exists
            if (!Array.isArray(allProducts)) {
                console.error('Products data not properly loaded:', allProducts);
                throw new Error('Products data not available');
            }

            // Filter products
            const categoryProducts = allProducts.filter(product => 
                product.category === selectedCategory
            );
            console.log(`Found ${categoryProducts.length} products for category "${selectedCategory}"`);

            // Update dropdown
            elements.specificProductSelect.innerHTML = '<option value="">Select a specific product...</option>';
            categoryProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.title;
                option.textContent = product.title;
                elements.specificProductSelect.appendChild(option);
            });
            
            elements.specificProductSelect.disabled = false;
        } catch (error) {
            console.error('Error handling product type change:', error);
            notifications.error('Error', 'Failed to load product options');
        }
    });

    // Handle contact preference changes
    elements.contactPreferenceSelect?.addEventListener('change', function() {
        try {
            const phoneRequired = this.value === 'phone';
            console.log('Contact preference changed:', {
                value: this.value,
                phoneRequired
            });

            elements.phoneInput.style.display = phoneRequired ? 'block' : 'none';
            const phoneInputElement = form.querySelector('#phone');
            if (phoneInputElement) {
                phoneInputElement.required = phoneRequired;
            }
        } catch (error) {
            console.error('Error handling contact preference change:', error);
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Quick inquiry form submission started');

        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) {
            console.error('Submit button not found');
            return;
        }

        const originalText = submitButton.textContent;

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            // Collect form data
            const formData = {
                name: form.querySelector('#name').value,
                email: form.querySelector('#email').value,
                phone: form.querySelector('#phone').value,
                productType: elements.productTypeSelect.value,
                specificProduct: elements.specificProductSelect.value,
                message: form.querySelector('#message').value,
                contactPreference: elements.contactPreferenceSelect.value
            };

            console.log('Collected form data:', formData);

            // Verify EmailJS configuration
            console.log('EmailJS Configuration:', {
                publicKey: EMAIL_CONFIG.PUBLIC_KEY,
                serviceId: EMAIL_CONFIG.SERVICE_ID,
                template: EMAIL_CONFIG.TEMPLATES.QUICK
            });

            // Send email
            await sendEmail(formData, 'quick');
            console.log('Email sent successfully');

            // Track the email inquiry
            await window.analyticsTracker.trackEmailInquiry('quick', formData);

            // Show success message
            notifications.success(
                'Message Sent!',
                'We\'ll get back to you as soon as possible.'
            );

            // Reset form
            form.reset();
            elements.specificProductSelect.innerHTML = '<option value="">Select a specific product...</option>';
            elements.specificProductSelect.disabled = true;
            if (elements.phoneInput) {
                elements.phoneInput.style.display = 'none';
            }

        } catch (error) {
            console.error('Quick inquiry submission error:', error);
            notifications.error(
                'Error',
                'There was a problem sending your message. Please try again.'
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    console.log('Quick inquiry form initialization completed');
}

// Full Inquiry Form Handler (inquire.html)
function initializeFullInquiryForm(form) {
    console.log('Initializing full inquiry form...');

    // Check for URL parameters that might contain product information
    const urlParams = new URLSearchParams(window.location.search);
    const productParam = urlParams.get('product');
    const productsParam = urlParams.get('products');
    
    // Handle multiple products from cart
    if (productsParam) {
        // Decode the product titles from the URL parameter
        const productTitles = productsParam.split(',').map(title => decodeURIComponent(title));
        console.log('Products from cart:', productTitles);
        
        // Find the unique product categories to check the corresponding category checkboxes
        const productCategories = new Set();
        
        productTitles.forEach(title => {
            const product = allProducts.find(p => p.title === title);
            if (product) {
                productCategories.add(product.category);
            }
        });
        
        // Check all the category checkboxes for the products in the cart
        productCategories.forEach(category => {
            const categoryCheckbox = form.querySelector(`input[name="productInterest"][value="${category}"]`);
            if (categoryCheckbox) {
                categoryCheckbox.checked = true;
            }
        });
        
        // Trigger an update to the products checkbox list based on selected categories
        updateProductsList();
        
        // After a short delay to let the list populate, select the specific products
        setTimeout(() => {
            productTitles.forEach(title => {
                const checkbox = form.querySelector(`input[name="specificProducts"][value="${title}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // Add a default message to the custom request field for cart inquiries
            const customRequestField = form.querySelector('#customRequest');
            if (customRequestField) {
                customRequestField.value = "I'm interested in these items that I added to my cart. Please provide more information about availability, customization options, and pricing.";
            }
        }, 500); // Give the checkbox list time to populate
    }
    // Handle single product inquiry from product detail page
    else if (productParam) {
        // Find the product in our database
        const product = window.allProducts.find(p => p.title === productParam);
        
        if (product) {
            // Pre-select the category
            const categoryCheckbox = form.querySelector(`input[name="productInterest"][value="${product.category}"]`);
            if (categoryCheckbox) {
                categoryCheckbox.checked = true;
                
                // Trigger an update to the products list
                updateProductsList();
                
                // After a short delay to let the list populate, select the product
                setTimeout(() => {
                    const productSelect = form.querySelector('#specificProducts');
                    if (productSelect) {
                        const option = Array.from(productSelect.options).find(opt => opt.value === product.title);
                        if (option) {
                            option.selected = true;
                        }
                    }
                    
                    // Add a default message for single product inquiry
                    const customRequestField = form.querySelector('#customRequest');
                    if (customRequestField) {
                        customRequestField.value = `I'm interested in the "${product.title}" and would like more information about availability, customization options, and pricing.`;
                    }
                }, 300);
            }
        }
    }

    // Initialize form validation to provide feedback on required fields
    initializeFormValidation(form);

    // Make sure the products list is populated with initial values
    updateProductsList();

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Full inquiry form submission started');

        const button = form.querySelector('button[type="submit"]');
        if (!button) {
            console.error('Submit button not found in full inquiry form');
            return;
        }

        const originalText = button.textContent;

        try {
            // Disable the button and show loading state
            button.disabled = true;
            button.textContent = 'Sending...';

            // Collect form data
            const formData = new FormData(form);
            
            // Get selected product categories (checkboxes)
            const productInterest = Array.from(
                form.querySelectorAll('input[name="productInterest"]:checked')
            ).map(cb => cb.value);
            
            // Get selected specific products (dropdown)
            const specificProducts = Array.from(
                form.querySelectorAll('input[name="specificProducts"]:checked')
            ).map(checkbox => checkbox.value);

            // Create email data object
            const emailData = {
                ...Object.fromEntries(formData),
                productInterest,
                specificProducts
            };

            console.log('Sending email with data:', emailData);
            
            // Send the email using EmailJS
            await sendEmail(emailData, 'full');
            console.log('Email sent successfully');

            // Track the email inquiry in analytics
            if (window.analyticsTracker && 
                typeof window.analyticsTracker.trackEmailInquiry === 'function') {
                await window.analyticsTracker.trackEmailInquiry('full', emailData);
            }

            // Show success message
            notifications.success(
                'Inquiry Sent!',
                'Thank you for your inquiry. We\'ll get back to you soon!'
            );

            console.log('Resetting form...');
            
            // Clear the cart if the inquiry came from there
            if (productsParam && window.cart) {
                window.cart.clearCart();
            }
            
            // Reset the form to clear all fields
            form.reset();
            
            // Update the products list to reflect the reset form state
            updateProductsList();

        } catch (error) {
            console.error('Full inquiry submission error:', error);
            notifications.error(
                'Error',
                'There was a problem sending your inquiry. Please try again.'
            );
        } finally {
            // Restore the button to its original state
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });

    // Add event listeners to product interest checkboxes to update the products list
    const productInterestCheckboxes = form.querySelectorAll('input[name="productInterest"]');
    productInterestCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateProductsList();
        });
    });
    
    // Add helper methods for form interaction if needed
    const contactPreferenceRadios = form.querySelectorAll('input[name="contactPreference"]');
    if (contactPreferenceRadios.length > 0) {
        contactPreferenceRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // Get phone field
                const phoneField = form.querySelector('#phone');
                if (phoneField) {
                    // Make phone required only if phone contact is selected
                    phoneField.required = this.value === 'phone';
                    
                    // Update validation message if needed
                    if (phoneField.classList.contains('touched')) {
                        phoneField.dispatchEvent(new Event('input'));
                    }
                }
            });
        });
    }
}

// Form submission handlers
async function handleFullInquirySubmission(form, submitBtn) {
    console.log('Starting full inquiry submission');
    // Store button reference locally to ensure it persists
    const button = submitBtn;
    const originalText = button.textContent;

    try {
        button.disabled = true;
        button.textContent = 'Sending...';

        const formData = new FormData(form);
        const productInterest = Array.from(
            form.querySelectorAll('input[name="productInterest"]:checked')
        ).map(cb => cb.value);
        
        const specificProducts = Array.from(
            form.querySelectorAll('input[name="specificProducts"]:checked')
        ).map(checkbox => checkbox.value);

        const emailData = {
            ...Object.fromEntries(formData),
            productInterest,
            specificProducts
        };

        await sendEmail(emailData, 'full');

        console.log('Email sent, starting form reset operations');
        console.log('Button state before reset:', {
            exists: !!button,
            disabled: button.disabled,
            text: button.textContent
        });

        // Store the button element again just before reset
        const submitButton = form.querySelector('button[type="submit"]');
        console.log('Button refetched before reset:', !!submitButton);

        form.reset();
        console.log('Form reset complete');
        console.log('Button state after reset:', {
            exists: !!button,
            disabled: button.disabled,
            text: button.textContent
        });

        updateProductsList();
        console.log('Products list updated');

        notifications.success(
            'Inquiry Sent!',
            'Thank you for your inquiry. We\'ll get back to you soon!'
        );

    } catch (error) {
        console.error('Full inquiry submission error:', error);
        notifications.error(
            'Error',
            'There was a problem sending your inquiry. Please try again.'
        );
    } finally {
        console.log('Entering finally block');
        console.log('Button reference check:', {
            buttonExists: !!button,
            buttonProperties: button ? {
                disabled: button.disabled,
                text: button.textContent
            } : 'button is null'
        });
        
        // Use the stored button reference
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
            console.log('Button reset complete');
        } else {
            console.error('Button reference lost');
        }
    }
}

function initializeMobileView() {
    // Create and add filter modal
    const filterModal = document.createElement('div');
    filterModal.className = 'filter-modal';
    filterModal.innerHTML = `
        <div class="filter-modal-header">
            <h3>Filters</h3>
            <button class="filter-modal-close">&times;</button>
        </div>
        <div class="filter-modal-content">
            ${document.querySelector('.filter-section').outerHTML}
        </div>
    `;
    document.body.appendChild(filterModal);

    // Create filter button
    const filterButton = document.createElement('button');
    filterButton.className = 'filter-button';
    filterButton.innerHTML = '<i class="fas fa-filter"></i> Filters';
    document.querySelector('.search-section').appendChild(filterButton);

    // Handle filter button click
    filterButton.addEventListener('click', () => {
        filterModal.classList.add('active');
    });

    // Handle modal close
    filterModal.querySelector('.filter-modal-close').addEventListener('click', () => {
        filterModal.classList.remove('active');
    });

    // Handle scroll behavior
    let lastScroll = 0;
    const sidebar = document.querySelector('.products-sidebar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 50) {
            // Scrolling down - hide sidebar
            sidebar.classList.add('hidden');
        } else {
            // Scrolling up - show sidebar
            sidebar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });

    // Update sort functionality for mobile
    const sortSelectMobile = document.getElementById('sortProductsMobile');
    if (sortSelectMobile) {
        sortSelectMobile.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }
}