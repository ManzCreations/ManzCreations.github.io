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
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    const searchInput = document.getElementById('productSearch');
    const categoryCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    const productsCount = document.querySelector('.products-count span');
    
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());

    let filteredProducts = allProducts;

    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
            selectedCategories.includes((product.category || '').toLowerCase())
        );
    }

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            (product.title || '').toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm) ||
            (product.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    productsContainer.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-category="${product.category || ''}" data-tags="${(product.tags || []).join(',')}">
            <div class="product-image">
                <img src="${product.imagePath || '#'}" alt="${product.title || ''}" onerror="this.src='fallback-image.jpg'">
                ${product.isNew ? '<div class="product-badge new">New</div>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.title || ''}</h3>
                <p class="price">From $${(parseFloat(product.price) || 0).toFixed(2)}</p>
                <p class="product-description">${product.description || ''}</p>
                <ul class="product-tags">
                    ${(product.tags || []).map(tag => `<li>${tag}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    if (productsCount) {
        productsCount.textContent = `Showing ${filteredProducts.length} products`;
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

// DOM Content Loaded Event Handler
document.addEventListener('DOMContentLoaded', function() {
    if (debugProductLoading) console.log('DOM Content Loaded');
    
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