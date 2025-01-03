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
                
                if (debugProductLoading) console.log('Papa parse complete, data length:', results.data.length);
                
                // Process the products with null checks
                allProducts = results.data.map(product => ({
                    ...product,
                    tags: product.tags ? product.tags.split('|') : [],
                    price: parseFloat(product.price) || 0,
                    isNew: product.isNew === 'true',
                    description: product.description || '',
                    category: (product.category || '').toLowerCase(),
                    imagePath: product.imagePath || '#'
                }));

                if (debugProductLoading) console.log('Products processed, allProducts length:', allProducts.length);

                // If callback provided, execute it
                if (onComplete && typeof onComplete === 'function') {
                    if (debugProductLoading) console.log('Executing onComplete callback');
                    onComplete(allProducts);
                }
            },
            error: function(error) {
                console.error('Papa Parse error:', error);
                notifications.error(
                    'Data Load Error',
                    'Error parsing product data. Please refresh the page.'
                );
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

// Filter products function with improved error handling
function filterProducts() {
    try {
        const searchInput = document.getElementById('productSearch');
        const categoryCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
        const productsContainer = document.getElementById('productsContainer');
        const productsCount = document.querySelector('.products-count span');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        let filteredProducts = allProducts;

        if (selectedCategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                selectedCategories.includes(product.category.toLowerCase())
            );
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.title.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Create product cards with placeholder images
        productsContainer.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-category="${product.category}" data-tags="${product.tags.join(',')}">
                <div class="product-image">
                    <img src="/api/placeholder/300/300" alt="${product.title}">
                    ${product.isNew ? '<div class="product-badge new">New</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p class="price">From $${parseFloat(product.price).toFixed(2)}</p>
                    <p class="product-description">${product.description}</p>
                    <ul class="product-tags">
                        ${product.tags.map(tag => `<li>${tag}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');

        if (productsCount) {
            productsCount.textContent = `Showing ${filteredProducts.length} products`;
        }

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
    console.log('Initializing mobile controls');
    if (window.innerWidth > 768) return;

    // Cache DOM elements
    const filterBtn = document.getElementById('filterBtn');
    const sortBtn = document.getElementById('sortBtn');
    const filterPanel = document.getElementById('filterPanel');
    const sortPanel = document.getElementById('sortPanel');

    if (!filterBtn || !sortBtn || !filterPanel || !sortPanel) {
        console.error('Missing required elements for mobile controls');
        return;
    }

    console.log('Found all required elements');

    const filterCount = filterBtn.querySelector('.filter-count');
    
    // Filter button click
    filterBtn.addEventListener('click', () => {
        console.log('Filter button clicked');
        openPanel(filterPanel);
    });

    // Sort button click
    sortBtn.addEventListener('click', () => {
        console.log('Sort button clicked');
        openPanel(sortPanel);
    });

    // Cancel buttons
    document.getElementById('filterCancel').addEventListener('click', () => {
        closePanel(filterPanel);
    });

    document.getElementById('sortCancel').addEventListener('click', () => {
        closePanel(sortPanel);
    });

    // Apply buttons
    document.getElementById('filterApply').addEventListener('click', () => {
        closePanel(filterPanel);
        // Update filters and refresh products
        filterProducts();
    });

    document.getElementById('sortApply').addEventListener('click', () => {
        closePanel(sortPanel);
        // Apply sorting
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
            }
        });
    });
}

// DOM Content Loaded Event Handler
document.addEventListener('DOMContentLoaded', function() {
    if (debugProductLoading) console.log('DOM Content Loaded');

    if (document.getElementById('productsContainer')) {
        console.log('Initializing mobile controls for products page');
        initializeMobileControls();
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

    // Add bottom action bar
    const bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-action-bar';
    bottomBar.innerHTML = `
        <div class="products-count">
            <span>Showing 0 products</span>
        </div>
        <select id="sortProductsMobile" class="sort-select">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
        </select>
    `;
    document.body.appendChild(bottomBar);

    // Update sort functionality for mobile
    const sortSelectMobile = document.getElementById('sortProductsMobile');
    if (sortSelectMobile) {
        sortSelectMobile.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }
}