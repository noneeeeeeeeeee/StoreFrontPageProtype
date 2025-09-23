// Get Supabase client from config
const { supabaseClient } = window;

// Demo mode state
let isDemoMode = false;

// Store for cart items
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];

// DOM Elements
const productGrid = document.getElementById("product-grid");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartSummary = document.getElementById("cart-summary");
const cartActions = document.getElementById("cart-actions");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const successModal = document.getElementById("success-modal");
const transactionId = document.getElementById("transaction-id");
const closeSuccessModalBtn = document.getElementById("close-modal");
const saveTransactionBtn = document.getElementById("save-transaction");
const clearCartBtn = document.getElementById("clear-cart");
const loading = document.getElementById("loading");
const errorNotification = document.getElementById("error-notification");
const errorMessage = document.getElementById("error-message");
const closeError = document.getElementById("close-error");
const successNotification = document.getElementById("success-notification");
const successMessage = document.getElementById("success-message");
const cartAnimation = document.getElementById("cart-animation");
const demoBanner = document.getElementById("demo-banner");
const demoIndicator = document.getElementById("demo-indicator");
const closeDemoBanner = document.getElementById("close-demo-banner");
const clearCartModal = document.getElementById("clear-cart-modal");
const confirmClearCartBtn = document.getElementById("confirm-clear-cart");

// Placeholder products data for BookStore
const placeholderProducts = [
  {
    id: 1,
    name: "Classic Notebook",
    description:
      "High-quality ruled notebook perfect for writing and note-taking.",
    price: 25000,
    icon: "fas fa-book",
    category: "Notebooks",
  },
  {
    id: 2,
    name: "Premium Pen Set",
    description: "Professional ballpoint pen set with smooth ink flow.",
    price: 45000,
    icon: "fas fa-pen",
    category: "Pens",
  },
  {
    id: 3,
    name: "Colored Pencils",
    description: "24-color pencil set for artistic and creative work.",
    price: 35000,
    icon: "fas fa-palette",
    category: "Art Supplies",
  },
  {
    id: 4,
    name: "Study Guide Book",
    description: "Comprehensive study guide for academic excellence.",
    price: 75000,
    icon: "fas fa-graduation-cap",
    category: "Books",
  },
  {
    id: 5,
    name: "Highlighter Set",
    description: "6-color highlighter set for marking important text.",
    price: 20000,
    icon: "fas fa-marker",
    category: "Markers",
  },
  {
    id: 6,
    name: "Leather Portfolio",
    description: "Professional leather portfolio bag for documents.",
    price: 120000,
    icon: "fas fa-briefcase",
    category: "Bags",
  },
  {
    id: 7,
    name: "Sticky Notes Pack",
    description: "Multicolor sticky notes for organization and reminders.",
    price: 15000,
    icon: "fas fa-sticky-note",
    category: "Organization",
  },
  {
    id: 8,
    name: "Scientific Calculator",
    description: "Advanced calculator for mathematical computations.",
    price: 85000,
    icon: "fas fa-calculator",
    category: "Electronics",
  },
];

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded");
  console.log("Product grid element:", document.getElementById("product-grid"));

  await initializeApp();
});

// Initialize database tables
async function initializeDatabase() {
  // Check if we have Supabase configuration
  if (
    !supabaseClient ||
    !window.isSupabaseAvailable ||
    !window.isSupabaseAvailable()
  ) {
    throw new Error("Supabase not configured");
  }

  try {
    // Check if products table exists and has data
    const { data: existingProducts, error: checkError } = await supabaseClient
      .from("products")
      .select("*")
      .limit(1);

    if (checkError && checkError.code === "42P01") {
      // Table doesn't exist, we'll assume it needs to be created
      throw new Error(
        "Database tables not found. Please ensure your Supabase database is properly configured."
      );
    }

    // If table exists but is empty, populate with placeholder data
    if (existingProducts && existingProducts.length === 0) {
      await populateProducts();
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Populate products table with placeholder data
async function populateProducts() {
  try {
    const { error } = await supabaseClient
      .from("products")
      .insert(placeholderProducts);

    if (error) {
      throw error;
    }
    console.log("Products populated successfully");
  } catch (error) {
    console.error("Error populating products:", error);
    throw error;
  }
}

// Load products from database
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id");

    if (error) {
      throw error;
    }

    products = data || placeholderProducts;
    renderProducts();
  } catch (error) {
    console.error("Error loading products:", error);
    showError("Failed to load products from database. Using offline data.");
    products = placeholderProducts;
    renderProducts();
  }
}

// Display products in the grid
function renderProducts() {
  const productGrid = document.getElementById("product-grid");
  if (!productGrid) return;

  productGrid.innerHTML = "";

  if (!products || products.length === 0) {
    productGrid.innerHTML = `
      <div class="no-products glass">
        <i class="fas fa-box-open"></i>
        <h3>No Products Available</h3>
        <p>Products will appear here once loaded.</p>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const productCard = createProductCard(product);
    productGrid.appendChild(productCard);
  });

  // Also bind direct click handlers post-render to ensure reliability
  bindProductCardEvents();
}

// Create product card element
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
        <i class="${product.icon} product-icon"></i>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-price">Rp ${formatPrice(product.price)}</div>
        <div class="product-quantity">
            <label class="quantity-label">Qty:</label>
            <input type="number" class="quantity-input" min="1" max="99" value="1" id="qty-${
              product.id
            }">
        </div>
        <button class="btn btn-primary add-to-cart" data-product-id="${
          product.id
        }">
            <i class="fas fa-cart-plus"></i>
            Add to Cart
        </button>
    `;

  return card;
}

// Setup event listeners
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // Re-query dynamic elements after render
  const productGridEl = document.getElementById("product-grid");
  const cartItemsEl = document.getElementById("cart-items");
  const closeErrorEl = document.getElementById("close-error");
  const saveTransactionEl = document.getElementById("save-transaction");
  const clearCartEl = document.getElementById("clear-cart");
  const successModalEl = document.getElementById("success-modal");
  const closeSuccessModalEl = document.getElementById("close-modal");
  const closeDemoBannerEl = document.getElementById("close-demo-banner");
  const demoBannerEl = document.getElementById("demo-banner");

  // Add to cart buttons - event delegation on grid
  if (productGridEl) {
    console.log("Product grid found, adding event listener");
    productGridEl.addEventListener("click", handleAddToCart);
  } else {
    console.log("Product grid not found!");
  }

  // Error notification
  if (closeErrorEl) {
    closeErrorEl.addEventListener("click", hideError);
  }

  // Cart actions
  if (saveTransactionEl) {
    saveTransactionEl.addEventListener("click", saveTransaction);
  }
  if (clearCartEl) {
    clearCartEl.addEventListener("click", clearCart);
  }

  // Close success modal
  if (closeSuccessModalEl) {
    closeSuccessModalEl.addEventListener("click", closeSuccessModal);
  }
  if (successModalEl) {
    successModalEl.addEventListener("click", (e) => {
      if (e.target === successModalEl) closeSuccessModal();
    });
  }

  // Delegate cart item events
  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", handleRemoveItem);
    cartItemsEl.addEventListener("input", handleQuantityChange);
  }

  // Demo banner close button
  if (closeDemoBannerEl) {
    closeDemoBannerEl.addEventListener("click", () => {
      if (demoBannerEl) {
        demoBannerEl.style.display = "none";
      }
    });
  }
}

// Handle add to cart
function handleAddToCart(event) {
  // Support clicks on nested elements inside the button (e.g., icon)
  const button = event.target.closest(".add-to-cart");
  if (!button) return;

  const productId = parseInt(button.getAttribute("data-product-id"));
  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = qtyInput ? Math.max(1, parseInt(qtyInput.value) || 1) : 1;

  const product = products.find((p) => p.id === productId);
  if (!product) return;

  addToCart(product, quantity);
}

// Bind direct listeners to newly rendered product cards
function bindProductCardEvents() {
  const buttons = document.querySelectorAll(".add-to-cart");
  buttons.forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.addEventListener("click", (e) => {
      // Delegate to shared handler
      handleAddToCart(e);
    });
    btn.dataset.bound = "1";
  });
}

// Add item to cart with animation
function addToCart(product, quantity) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      ...product,
      quantity: quantity,
    });
  }

  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Live update cart display without page refresh
  updateCartDisplay();
  updateCartSummary();

  // Show cart animation
  showCartAnimation();

  // Show success message
  showSuccess(`${product.name} added to cart!`);

  // Update cart count
  updateCartCount();

  // Animate the cart button to show item was added
  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    cartBtn.classList.add("cart-updated");
    setTimeout(() => cartBtn.classList.remove("cart-updated"), 600);
  }
}

// Show cart animation
function showCartAnimation() {
  if (!cartAnimation) return;

  cartAnimation.classList.remove("hidden");

  setTimeout(() => {
    cartAnimation.classList.add("hidden");
  }, 600);
}

// Update cart count
function updateCartCount() {
  if (!cartCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Show success notification
function showSuccess(message) {
  if (!successNotification || !successMessage) return;

  successMessage.textContent = message;
  successNotification.classList.remove("hidden");

  setTimeout(() => {
    successNotification.classList.add("hidden");
  }, 3000);
}

// Show error notification
function showError(message) {
  if (!errorNotification || !errorMessage) return;

  errorMessage.textContent = message;
  errorNotification.classList.remove("hidden");

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

// Hide error notification
function hideError() {
  if (errorNotification) {
    errorNotification.classList.add("hidden");
  }
}

// Format price with thousands separator
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID").format(price);
}

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideError();
  }
});

// Handle remove item from cart
function handleRemoveItem(event) {
  if (
    !event.target.classList.contains("remove-item") &&
    !event.target.parentElement.classList.contains("remove-item")
  )
    return;

  const button = event.target.classList.contains("remove-item")
    ? event.target
    : event.target.parentElement;
  const productId = parseInt(button.getAttribute("data-product-id"));

  cart = cart.filter((item) => item.id !== productId);
  updateCartDisplay();
}

// Handle quantity change in cart
function handleQuantityChange(event) {
  if (!event.target.classList.contains("cart-quantity-input")) return;

  const productId = parseInt(event.target.getAttribute("data-product-id"));
  const newQuantity = parseInt(event.target.value);

  if (newQuantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
  } else {
    const item = cart.find((item) => item.id === productId);
    if (item) {
      item.quantity = newQuantity;
    }
  }

  updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
  // persist
  localStorage.setItem("cart", JSON.stringify(cart));

  if (cartCount)
    cartCount.textContent = cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

  if (cart.length === 0) {
    if (cartItems) {
      cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <small>Add some products to get started</small>
            </div>
        `;
    }
    if (cartSummary) cartSummary.style.display = "none";
    if (cartActions) cartActions.style.display = "none";
  } else {
    displayCartItems();
    updateCartSummary();
    if (cartSummary) cartSummary.style.display = "block";
    if (cartActions) cartActions.style.display = "block";
  }
}

// Display cart items
function displayCartItems() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
            <i class="${item.icon} cart-item-icon"></i>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">
                    Rp ${formatPrice(item.price)} × 
                    <input type="number" class="cart-quantity-input" min="1" max="99" value="${
                      item.quantity
                    }" data-product-id="${item.id}">
                    = Rp ${formatPrice(item.price * item.quantity)}
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-item" data-product-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    cartItems.appendChild(cartItem);
  });
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  if (subtotalElement)
    subtotalElement.textContent = `Rp ${formatPrice(subtotal)}`;
  if (taxElement) taxElement.textContent = `Rp ${formatPrice(tax)}`;
  if (totalElement) totalElement.textContent = `Rp ${formatPrice(total)}`;
}

// Save transaction to database
async function saveTransaction() {
  if (cart.length === 0) {
    showError("Cart is empty. Add some products first.");
    return;
  }

  showLoading();

  try {
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Create transaction record
    const transactionData = {
      transaction_date: new Date().toISOString(),
      subtotal: subtotal,
      tax: tax,
      total: total,
      items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
    };

    const { data, error } = await supabaseClient
      .from("transactions")
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Show success modal
    if (transactionId)
      transactionId.textContent = data.id || "TXN-" + Date.now();
    if (successModal) successModal.classList.remove("hidden");

    // Clear cart
    cart = [];
    updateCartDisplay();
  } catch (error) {
    console.error("Error saving transaction:", error);
    showError("Failed to save transaction: " + error.message);
  } finally {
    hideLoading();
  }
}

// Clear cart
function clearCart() {
  if (cart.length === 0) return;

  if (confirm("Are you sure you want to clear the cart?")) {
    cart = [];
    updateCartDisplay();
  }
}

// Close success modal
function closeSuccessModal() {
  if (successModal) successModal.classList.add("hidden");
}

// Show error notification
function showError(message) {
  if (!errorNotification || !errorMessage) return;
  errorMessage.textContent = message;
  errorNotification.classList.remove("hidden");

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

// Hide error notification
function hideError() {
  if (errorNotification) errorNotification.classList.add("hidden");
}

// Show loading spinner
function showLoading() {
  if (loading) loading.classList.remove("hidden");
}

// Hide loading spinner
function hideLoading() {
  if (loading) loading.classList.add("hidden");
}

// Format price with thousands separator
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID").format(price);
}

// Handle click outside modal to close
// click outside handled in setupEventListeners

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideError();
    closeSuccessModal();
  }
});

// Global click delegation (capture phase) as a safety net for nested elements
document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest && e.target.closest(".add-to-cart");
    if (!btn) return;

    // Prevent duplicate handling if grid listener already caught it
    if (btn.__handledOnce) return;
    btn.__handledOnce = true;
    setTimeout(() => (btn.__handledOnce = false), 0);

    const productId = parseInt(btn.getAttribute("data-product-id"));
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addToCart(product, quantity);
  },
  true
);

// Initialize demo mode
function initializeDemoMode() {
  const demoBanner = document.getElementById("demo-banner");
  const demoIndicator = document.getElementById("demo-indicator");
  const closeButton = demoBanner?.querySelector(".demo-close");

  // Show demo banner and indicator
  if (isDemoMode) {
    if (demoBanner) demoBanner.style.display = "block";
    if (demoIndicator) demoIndicator.style.display = "inline";
  } else {
    if (demoBanner) demoBanner.style.display = "none";
    if (demoIndicator) demoIndicator.style.display = "none";
  }

  // Handle demo banner close
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      demoBanner.style.display = "none";
    });
  }
}

// Enable demo mode with placeholder data
function enableDemoMode() {
  isDemoMode = true;
  products = placeholderProducts;
  console.log("Demo mode enabled - using placeholder data");
  initializeDemoMode();
}

// Initialize the app
async function initializeApp() {
  console.log("Initializing app...");
  initializeDemoMode();

  try {
    await initializeDatabase();
    await loadProducts();
    renderProducts();
    updateCartDisplay();
    updateCartCount();
  } catch (error) {
    console.error("Failed to initialize app:", error);
    enableDemoMode();
    renderProducts();
    updateCartDisplay();
    updateCartCount();
  }

  // Setup event listeners after DOM is ready and products are rendered
  setTimeout(() => {
    console.log("Setting up event listeners after render...");
    setupEventListeners();
  }, 100);
}
