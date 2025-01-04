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
        
        const icon = type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 
                    '✅';

        notification.innerHTML = `
            <span class="notification__icon">${icon}</span>
            <div class="notification__content">
                <div class="notification__title">${title}</div>
                <div class="notification__message">${message}</div>
            </div>
            <button class="notification__close">×</button>
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

// Products Functionality
async function loadProducts(onComplete) {
    if (debugProductLoading) console.log('loadProducts called');
    try {
        const response = await fetch('/app/data/products.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        if (debugProductLoading) console.log('CSV fetched successfully');
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    console.error('Parse errors:', results.errors);
                    return;
                }
                
                // Process the products with null checks
                allProducts = results.data.map(product => ({
                    ...product,
                    tags: product.tags ? product.tags.split('|') : [],
                    price: parseFloat(product.price) || 0,
                    isNew: product.isNew === 'TRUE',
                    isFeatured: product.isFeatured === 'TRUE'
                }));

                // If we're on the index page, populate featured products
                if (document.querySelector('.category-section')) {
                    populateFeaturedProducts();
                }

                // If callback provided, execute it (for products page)
                if (onComplete && typeof onComplete === 'function') {
                    onComplete(allProducts);
                }
            }
        });
    } catch (error) {
        console.error('Load error:', error);
        notifications.error(
            'Data Load Error',
            'Unable to load product data. Please refresh the page.'
        );
    }
}

// Add this new function to handle featured products on the index page
function populateFeaturedProducts() {
    const categories = ['freshies-charms', 'cups', 'photo-slates', 'accessories-home'];
    
    categories.forEach(category => {
        const section = document.getElementById(category);
        if (!section) return;

        const productsGrid = section.querySelector('.products-grid');
        if (!productsGrid) return;

        // Get featured products for this category
        const featuredProducts = allProducts
            .filter(product => product.category === category && product.isFeatured === true)
            .slice(0, 3); // Get up to 3 featured products

        // Update the grid with featured products
        productsGrid.innerHTML = featuredProducts.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.imagePath}" alt="${product.title}" />
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    });
}

// Product List Update Function - Now with debounce applied
const updateProductsList = debounce(() => {
    if (debugProductLoading) console.log('updateProductsList called');
    const select = document.getElementById('specificProducts');
    if (!select) {
        if (debugProductLoading) console.log('No select element found');
        return;
    }
    
    // Get selected categories with null check
    const selectedCategories = Array.from(document.querySelectorAll('input[name="productInterest"]:checked'))
        .map(checkbox => checkbox.value.toLowerCase());
    
    // Clear existing options
    select.innerHTML = '';
    
    // Sort products based on selected categories
    const sortedProducts = [...allProducts].sort((a, b) => {
        const aCategory = (a.category || '').toLowerCase();
        const bCategory = (b.category || '').toLowerCase();
        
        const aSelected = selectedCategories.includes(aCategory);
        const bSelected = selectedCategories.includes(bCategory);
        
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        if (aSelected === bSelected && aSelected) {
            return selectedCategories.indexOf(aCategory) - selectedCategories.indexOf(bCategory);
        }
        return 0;
    });
    
    // Add sorted product options with null checks
    sortedProducts.forEach(product => {
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
}, 100);

const CATEGORY_MAPPING = {
    'freshies-charms': ['freshies', 'beaded-car-charms'],
    'cups': ['sublimation-tumblers', 'water-bottles', 'kids-cups', 'coasters'],
    'photo-slates': ['photo-slates'],
    'accessories-home': ['keychains', 'sanitizer-holders', 'lipstick-holders', 'spinners', 'cutting-boards', 'license-plates']
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
        const searchInputs = [
            document.getElementById('productSearch'),
            document.getElementById('mobileSearch')
        ].filter(Boolean);
        
        const searchTerm = (searchInputs[0]?.value || '').toLowerCase();
        const productsContainer = document.getElementById('productsContainer');
        const productsCount = document.querySelector('.products-count span');
        
        // Get selected categories
        const selectedMainCategories = Array.from(document.querySelectorAll('input[data-category-type="main"]:checked'))
            .map(cb => cb.value);
            
        const selectedSubCategories = Array.from(document.querySelectorAll('input[data-category-type="sub"]:checked'))
            .map(cb => cb.value);

        let filteredProducts = allProducts;

        // Apply search filter first
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => {
                // Search in title
                if (product.title.toLowerCase().includes(searchTerm)) return true;
                
                // Search in category
                if (product.category.toLowerCase().includes(searchTerm)) return true;
                
                // Search in subcategory
                if (product.subcategory.toLowerCase().includes(searchTerm)) return true;
                
                // Search in collection (if exists)
                if (product.collection && product.collection.toLowerCase().includes(searchTerm)) return true;
                
                // Search in tags
                if (product.tags && Array.isArray(product.tags)) {
                    if (product.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;
                }
                
                // Search in description
                if (product.description && product.description.toLowerCase().includes(searchTerm)) return true;
                
                return false;
            });
        }

        // Apply category filters
        if (selectedMainCategories.length > 0 || selectedSubCategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                // If only main categories are selected (no subcategories selected)
                if (selectedMainCategories.length > 0 && selectedSubCategories.length === 0) {
                    return selectedMainCategories.includes(product.category);
                }
                
                // If only subcategories are selected (no main categories selected)
                if (selectedSubCategories.length > 0 && selectedMainCategories.length === 0) {
                    return selectedSubCategories.includes(product.subcategory);
                }
                
                // If both main and subcategories are selected
                if (selectedMainCategories.length > 0 && selectedSubCategories.length > 0) {
                    return selectedMainCategories.includes(product.category) && 
                           selectedSubCategories.includes(product.subcategory);
                }
                
                return false;
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
    if (debugProductLoading) console.log('DOM Content Loaded');

    if (document.getElementById('productsContainer')) {
        console.log('Initializing products page');
        initializeMobileControls();
        setupCategoryFilters(); // Add this line
        
        // Load products and initialize page
        loadProducts(() => {
        filterProducts();
        });

        console.log('Initializing mobile controls for products page');
        initializeMobileControls();
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
                toggle.textContent = answer.classList.contains('active') ? '−' : '+';
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

    // Inquiry Form Initialization
    const inquiryForm = document.getElementById('inquiryForm');
    if (debugProductLoading) {
        console.log('Page elements found:', {
            inquiryForm: !!inquiryForm,
            productsContainer: !!productsContainer
        });
    }

    // Initialize inquiry form if it exists and products container doesn't
    if (inquiryForm && !productsContainer) {
        if (debugProductLoading) console.log('Initializing inquiry form');
        
        // Initialize form validation
        initializeFormValidation();
        
        // Single initialization of products
        loadProducts(() => {
            if (debugProductLoading) console.log('Products loaded for inquiry form');
            initializeInquiryForm();
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
        
        // Toggle button text
        button.textContent = isHidden ? '−' : '+';
        
        // Toggle subcategory list
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
    if (debugProductLoading) console.log('Initializing inquiry form functionality');
    
    // Do initial product list update
    updateProductsList();
    
    // Add event listeners to product interest checkboxes
    const productInterestCheckboxes = document.querySelectorAll('input[name="productInterest"]');
    if (debugProductLoading) console.log('Found checkboxes:', productInterestCheckboxes.length);
    
    productInterestCheckboxes.forEach(checkbox => {
        // Remove any existing event listeners (using clone technique for safety)
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
        
        // Add new event listener
        newCheckbox.addEventListener('change', () => {
            if (debugProductLoading) console.log('Checkbox changed:', newCheckbox.value);
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