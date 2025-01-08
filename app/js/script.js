// EmailJS Configuration
const EMAIL_CONFIG = {
    PUBLIC_KEY: 'DD2qYtcM8ubvw2VLB',
    SERVICE_ID: 'service_rojg3ef',
    TEMPLATES: {
        QUICK: 'template_562otjh',
        FULL: 'template_9wcbbkd'
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
            emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
            
            // Verify initialization
            console.log('EmailJS initialized. Testing configuration...');
            if (!emailjs.init) {
                throw new Error('EmailJS not properly initialized');
            }
            
            console.log('EmailJS initialization successful');
            
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
            throw error;
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
let debugProductLoading = true;
let debugFeaturedProducts = true;

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

        allProducts = products.map(product => ({
            ...product,
            tags: product.tags ? product.tags.split('|') : [],
            price: parseFloat(product.price) || 0,
            isNew: product.isNew === 'TRUE',
            isFeatured: product.isFeatured === 'TRUE'
        }));

        if (debugProductLoading) {
            console.log('Processed products:', allProducts);
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

    // Get new products
    const newProducts = allProducts
        .filter(product => product.isNew === 'TRUE' || product.isNew === true)
        .reduce((acc, product) => {
            // Only take first product from each category if we don't have it yet
            if (!acc.some(p => p.category === product.category) && acc.length < 3) {
                acc.push(product);
            }
            return acc;
        }, []);

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
        }
    });
}

// Add this new function to handle featured products on the index page
function populateFeaturedProducts() {
    if (debugFeaturedProducts) console.log('populateFeaturedProducts called');
    
    const sections = [
        {
            id: 'freshies-charms',
            category: 'freshies-charms'
        },
        {
            id: 'cups',
            category: 'cups'
        },
        {
            id: 'photo-slates',
            category: 'photo-slates'
        },
        {
            id: 'accessories-home',
            category: 'accessories-home'
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
function updateProductsList() {
    if (debugProductLoading) {
        console.log('Updating products list');
        console.log('Current allProducts:', allProducts);
    }
    
    const select = document.getElementById('specificProducts');
    if (!select) {
        if (debugProductLoading) console.log('No products select element found');
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
    select.innerHTML = '';
    
    // Filter and sort products based on selected categories
    let relevantProducts = allProducts;
    
    // Only filter by category if categories are selected
    if (selectedCategories.length > 0) {
        relevantProducts = allProducts.filter(product => {
            const productCategory = (product.category || '').toLowerCase();
            if (debugProductLoading) {
                console.log('Checking product:', product.title, 'Category:', productCategory);
            }
            return selectedCategories.includes(productCategory);
        });
    }

    // Sort products
    relevantProducts.sort((a, b) => {
        const aCategory = (a.category || '').toLowerCase();
        const bCategory = (b.category || '').toLowerCase();
        
        const aSelected = selectedCategories.includes(aCategory);
        const bSelected = selectedCategories.includes(bCategory);
        
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        
        return a.title.localeCompare(b.title);
    });

    if (debugProductLoading) {
        console.log('Filtered products:', relevantProducts);
        console.log('Number of products after filtering:', relevantProducts.length);
    }
    
    // Add sorted product options
    relevantProducts.forEach(product => {
        if (product.title) {
            const option = document.createElement('option');
            option.value = product.title;
            option.textContent = product.title;
            
            const productCategory = (product.category || '').toLowerCase();
            if (selectedCategories.includes(productCategory)) {
                option.className = 'preferred-option';
            }
            
            select.appendChild(option);
        }
    });
}

const CATEGORY_MAPPING = {
    'freshies-charms': ['freshies', 'beaded-car-charms'],
    'cups': ['sublimation-tumblers', 'water-bottles', 'kids-cups'],
    'photo-slates': ['photo-slates'],
    'accessories-home': ['keychains', 'sanitizer-holders', 'lipstick-holders', 'wind-spinners', 'coasters', 'cutting-boards', 'license-plates']
  };

// Function to update products display
function updateProductsDisplay(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    productsContainer.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}" data-subcategory="${product.subcategory}">
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

    // Update view based on current view mode
    const currentView = document.querySelector('.view-btn.active');
    if (currentView) {
        productsContainer.classList.toggle('gallery-view', currentView.dataset.view === 'gallery');
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

        switch(method) {
            case 'name-asc': return titleA.localeCompare(titleB);
            case 'name-desc': return titleB.localeCompare(titleA);
            case 'price-asc': return priceA - priceB;
            case 'price-desc': return priceB - priceA;
            default: return 0;
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

// DOM Content Loaded Event Handler
document.addEventListener('DOMContentLoaded', function() {
    if (debugProductLoading) {
        console.log('DOM Content Loaded');
        console.log('Current URL:', window.location.href);
    }

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
        
        initializeMobileControls();
        setupCategoryFilters();
        initializePhoneValidation();
        
        loadProducts(() => {
            if (debugProductLoading) console.log('Products loaded callback executed');
            handleUrlFilters(); // Add this line
            filterProducts();
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
    
    // Header Elements with null checks
    const btnHamburger = document.querySelector('#btnHamburger');
    const body = document.querySelector('body');
    const header = document.querySelector('.header');
    const overlay = document.querySelector('.overlay');
    const fadeElems = document.querySelectorAll('.has-fade');
    const mobileMenu = document.querySelector('.header__menu');

    // Header Functions
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

    // Header Event Listeners
    if (btnHamburger && header && mobileMenu) {
        btnHamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            header.classList.contains('open') ? closeMenu() : openMenu();
        });

        // Outside click handler
        document.addEventListener('click', function(e) {
            if (header.classList.contains('open') && 
                !mobileMenu.contains(e.target) && 
                !btnHamburger.contains(e.target)) {
                closeMenu();
            }
        });
    }

    // Menu item click handlers
    document.querySelectorAll('.header__menu a').forEach(link => {
        link.addEventListener('click', closeMenu);
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

    // Initialize form validation
    initializeFormValidation(form);

    // Initial population of products list
    updateProductsList();

    // Handle form submission - THIS IS THE ONLY SUBMIT HANDLER WE WANT
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
            button.disabled = true;
            button.textContent = 'Sending...';

            const formData = new FormData(form);
            const productInterest = Array.from(
                form.querySelectorAll('input[name="productInterest"]:checked')
            ).map(cb => cb.value);
            
            const specificProducts = Array.from(
                form.querySelector('#specificProducts').selectedOptions
            ).map(option => option.value);

            const emailData = {
                ...Object.fromEntries(formData),
                productInterest,
                specificProducts
            };

            console.log('Sending email with data:', emailData);
            await sendEmail(emailData, 'full');
            console.log('Email sent successfully');

            notifications.success(
                'Inquiry Sent!',
                'Thank you for your inquiry. We\'ll get back to you soon!'
            );

            console.log('Resetting form...');
            form.reset();
            updateProductsList();

        } catch (error) {
            console.error('Full inquiry submission error:', error);
            notifications.error(
                'Error',
                'There was a problem sending your inquiry. Please try again.'
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });

    // Add event listeners to product interest checkboxes
    const productInterestCheckboxes = form.querySelectorAll('input[name="productInterest"]');
    productInterestCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateProductsList();
        });
    });
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
            form.querySelector('#specificProducts').selectedOptions
        ).map(option => option.value);

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