// Shopping Cart Functionality
class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadCart();
        this.updateCartBadge();
    }

    // Load cart from localStorage
    loadCart() {
        const savedCart = localStorage.getItem('shoppingCart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
                console.log('Cart loaded from storage:', this.items.length, 'items');
            } catch (error) {
                console.error('Error loading cart:', error);
                this.items = [];
            }
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(this.items));
            console.log('Cart saved to storage:', this.items.length, 'items');
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Update the cart badge count
    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const itemCount = this.getTotalItems();
        
        badges.forEach(badge => {
            badge.textContent = itemCount;
            badge.classList.toggle('hidden', itemCount === 0);
        });
    }

    // Add an item to the cart
    addItem(product, quantity = 1) {
        // Check if the product is already in the cart
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            // Update quantity if already in cart
            existingItem.quantity += quantity;
            console.log('Updated quantity for', product.title, 'to', existingItem.quantity);
        } else {
            // Add new item to cart
            this.items.push({
                id: product.id,
                title: product.title,
                price: product.price,
                imagePath: product.imagePath,
                quantity: quantity
            });
            console.log('Added to cart:', product.title);
        }
        
        this.saveCart();
        this.updateCartBadge();
        
        // Return a success message
        return `${product.title} added to cart`;
    }

    // Remove an item from the cart
    removeItem(productId) {
        const initialLength = this.items.length;
        const removedItem = this.items.find(item => item.id === productId);
        
        if (!removedItem) {
            console.log('Item not found in cart:', productId);
            return false;
        }
        
        // Filter out the item to remove
        this.items = this.items.filter(item => item.id !== productId);
        
        this.saveCart();
        this.updateCartBadge();
        
        console.log('Removed from cart:', removedItem.title);
        return `${removedItem.title} removed from cart`;
    }

    // Update the quantity of an item
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        
        if (!item) {
            console.log('Item not found for quantity update:', productId);
            return false;
        }
        
        if (quantity <= 0) {
            return this.removeItem(productId);
        }
        
        item.quantity = quantity;
        console.log('Updated quantity for', item.title, 'to', quantity);
        
        this.saveCart();
        this.updateCartBadge();
        return true;
    }

    // Check if a product is in the cart
    isInCart(productId) {
        return this.items.some(item => item.id === productId);
    }

    // Get the total number of items in the cart
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Get the subtotal price of all items
    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Clear the entire cart
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartBadge();
        return 'Cart cleared';
    }

    // Get all cart items
    getItems() {
        return [...this.items]; // Return a copy to prevent direct manipulation
    }
}

// Initialize the cart
const cart = new ShoppingCart();

// Initialize cart functionality on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart badge
    cart.updateCartBadge();
    
    // Set up add to cart button on product detail page
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        // Get the product ID from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        // Update button state based on whether product is in cart
        updateAddToCartButton(productId);
        
        // Add click handler
        addToCartBtn.addEventListener('click', handleAddToCartClick);
    }
    
    // Function to update the Add to Cart button text
    function updateAddToCartButton(productId) {
        if (!addToCartBtn || !productId) return;
        
        if (cart.isInCart(productId)) {
            addToCartBtn.textContent = 'Remove from Cart';
            addToCartBtn.classList.add('in-cart');
        } else {
            addToCartBtn.textContent = 'Add to Cart';
            addToCartBtn.classList.remove('in-cart');
        }
    }
    
    // Handle Add to Cart button click
    function handleAddToCartClick(e) {
        e.preventDefault();
        
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            console.error('No product ID found');
            return;
        }
        
        // If the product is already in the cart, remove it
        if (cart.isInCart(productId)) {
            const message = cart.removeItem(productId);
            notifications.success('Cart Updated', message);
            updateAddToCartButton(productId);
        } else {
            // Get the product data - with improved fallback
            loadProductData(productId)
            .then(product => {
                if (product) {
                    const message = cart.addItem(product);
                    notifications.success('Added to Cart', message);
                    updateAddToCartButton(productId);
                } else {
                    // Fallback: Try to get product details from the page itself
                    const productFromPage = extractProductDetailsFromPage();
                    if (productFromPage) {
                        const message = cart.addItem(productFromPage);
                        notifications.success('Added to Cart', message);
                        updateAddToCartButton(productId);
                    } else {
                        notifications.error('Error', 'Could not add product to cart');
                    }
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                notifications.error('Error', 'Could not add product to cart');
            });
        }
    }

    // Helper function to extract product details from the current page
    function extractProductDetailsFromPage() {
        const title = document.getElementById('productTitle')?.textContent;
        const priceText = document.getElementById('productPrice')?.textContent;
        const price = priceText ? parseFloat(priceText.replace('From $', '')) : 0;
        const imagePath = document.getElementById('productImage')?.src;
        
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (title && price && id) {
            return {
                id,
                title,
                price,
                imagePath,
                quantity: 1
            };
        }
        
        return null;
    }
});


// Modal helper functions
function showModal(message, confirmText, confirmCallback) {
    const modal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmButton = document.getElementById('modalConfirm');
    
    // Update message and button text
    modalMessage.textContent = message || 'Are you sure you want to proceed?';
    confirmButton.textContent = confirmText || 'Confirm';
    
    // Set up confirm callback
    confirmButton.onclick = () => {
        hideModal();
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    };
    
    // Show the modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function hideModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for the modal
    const modal = document.getElementById('customModal');
    if (modal) {
        const closeButton = modal.querySelector('.modal-close');
        const cancelButton = document.getElementById('modalCancel');
        
        closeButton.addEventListener('click', () => hideModal());
        cancelButton.addEventListener('click', () => hideModal());
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideModal();
            }
        });
    }
});