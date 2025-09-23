// Get Supabase client from config
const { supabaseClient } = window;

// DOM Elements
const transactionsTbody = document.getElementById("transactions-table-body");
const transactionGrid = document.getElementById("transaction-grid");
const tableWrapper = document.getElementById("table-wrapper");
const gridViewBtn = document.getElementById("grid-view");
const tableViewBtn = document.getElementById("table-view");
const transactionSearch = document.getElementById("transaction-search");
const refreshBtn = document.getElementById("refresh-transactions");
const totalSales = document.getElementById("total-sales");
const totalTransactions = document.getElementById("total-transactions");
const transactionModal = document.getElementById("transaction-modal");
const transactionDetails = document.getElementById("transaction-details");
const closeTransactionModal = document.getElementById(
  "close-transaction-modal"
);
const closeModalBtn = document.getElementById("close-modal-btn");
const deleteTransactionBtn = document.getElementById("delete-transaction-btn");
const errorNotification = document.getElementById("error-notification");
const successNotification = document.getElementById("success-notification");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");
const closeError = document.getElementById("close-error");
const loading = document.getElementById("loading");

// State
let currentTransactionId = null;
let transactions = [];
let filteredTransactions = [];
let currentView = "grid"; // 'grid' or 'table'

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin panel loaded");
  setupEventListeners();
  loadTransactions();

  // Setup search functionality
  if (transactionSearch) {
    transactionSearch.addEventListener("input", handleSearch);
  }

  // Setup refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadTransactions);
  }

  // Setup view toggle buttons
  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => switchView("grid"));
  }
  if (tableViewBtn) {
    tableViewBtn.addEventListener("click", () => switchView("table"));
  }

  // Setup click handlers for grid and table
  setupClickHandlers();
});

// Switch between grid and table view
function switchView(view) {
  currentView = view;

  // Show loading state briefly for smooth transition
  showLoading();

  setTimeout(() => {
    // Update button states
    if (gridViewBtn && tableViewBtn) {
      gridViewBtn.classList.toggle("active", view === "grid");
      tableViewBtn.classList.toggle("active", view === "table");
    }

    // Show/hide appropriate view
    if (transactionGrid && tableWrapper) {
      transactionGrid.style.display = view === "grid" ? "grid" : "none";
      tableWrapper.style.display = view === "table" ? "block" : "none";
    }

    // Re-render transactions in the new view
    renderTransactions();
    hideLoading();
  }, 200);
}

// Setup click handlers for both views
function setupClickHandlers() {
  // Grid view click handler
  if (transactionGrid) {
    transactionGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".transaction-card[data-id]");
      if (!card) return;
      if (e.target.closest("button")) return;
      const id = card.getAttribute("data-id");
      viewTransaction(id);
    });
  }

  // Table view click handler
  if (transactionsTbody) {
    transactionsTbody.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      if (e.target.closest("button")) return;
      const id = row.getAttribute("data-id");
      viewTransaction(id);
    });
  }
}

function setupEventListeners() {
  // Modal controls
  if (closeTransactionModal) {
    closeTransactionModal.addEventListener("click", closeModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (deleteTransactionBtn) {
    deleteTransactionBtn.addEventListener("click", deleteTransaction);
  }

  // Notification controls
  if (closeError) {
    closeError.addEventListener("click", hideError);
  }

  // Close modal when clicking outside
  if (transactionModal) {
    transactionModal.addEventListener("click", (e) => {
      if (e.target === transactionModal) {
        closeModal();
      }
    });
  }
}

// Transaction Management
async function loadTransactions() {
  try {
    showLoading();

    const { data, error } = await supabaseClient
      .from("transactions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading transactions:", error);
      showError("Failed to load transactions: " + error.message);
      return;
    }

    transactions = data || [];
    filteredTransactions = transactions;
    displayTransactions();
    updateStats();
  } catch (error) {
    console.error("Error loading transactions:", error);
    showError("Failed to load transactions");
  } finally {
    hideLoading();
  }
}

function renderTransactions() {
  const list = filteredTransactions || [];

  if (currentView === "grid") {
    renderGridView(list);
  } else {
    renderTableView(list);
  }
}

function renderGridView(list) {
  if (!transactionGrid) return;

  if (list.length === 0) {
    transactionGrid.innerHTML = `
      <div class="empty-state-grid">
        <div class="empty-transactions glass">
          <i class="fas fa-receipt"></i>
          <h3>No transactions found</h3>
          <p>Transactions will appear here once customers make purchases</p>
        </div>
      </div>
    `;
    return;
  }

  transactionGrid.innerHTML = list
    .map((transaction) => {
      const when =
        transaction.created_at ||
        transaction.transaction_date ||
        transaction.date;
      const date = new Date(when).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let items = [];
      try {
        items = Array.isArray(transaction.items)
          ? transaction.items
          : JSON.parse(transaction.items || "[]");
      } catch (e) {
        items = [];
      }

      const itemCount = items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const customerName =
        transaction.customer_name || transaction.customer || "Unknown Customer";

      return `
        <div class="transaction-card glass" data-id="${transaction.id}">
          <div class="card-header">
            <span class="transaction-id">#${transaction.id}</span>
            <span class="transaction-date">${date}</span>
          </div>
          <div class="card-body">
            <div class="transaction-info">
              <span class="info-label"><i class="fas fa-user"></i> Customer</span>
              <span class="info-value">${customerName}</span>
            </div>
            <div class="transaction-info">
              <span class="info-label"><i class="fas fa-shopping-bag"></i> Items</span>
              <span class="info-value">${itemCount} item${
        itemCount !== 1 ? "s" : ""
      }</span>
            </div>
            <div class="transaction-info">
              <span class="info-label"><i class="fas fa-money-bill-wave"></i> Total</span>
              <span class="transaction-total">Rp ${formatPrice(
                transaction.total
              )}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTableView(list) {
  if (!transactionsTbody) return;

  if (list.length === 0) {
    transactionsTbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-transactions">
            <i class="fas fa-receipt"></i>
            <p>No transactions found</p>
            <small>Transactions will appear here once customers make purchases</small>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  transactionsTbody.innerHTML = list
    .map((transaction) => {
      const when =
        transaction.created_at ||
        transaction.transaction_date ||
        transaction.date;
      const date = new Date(when).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let items = [];
      try {
        items = Array.isArray(transaction.items)
          ? transaction.items
          : JSON.parse(transaction.items || "[]");
      } catch (e) {
        items = [];
      }

      const itemCount = items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const customerName =
        transaction.customer_name || transaction.customer || "Unknown Customer";

      return `
        <tr data-id="${transaction.id}" class="transaction-row">
          <td>#${transaction.id}</td>
          <td>${customerName}</td>
          <td>${itemCount} item${itemCount !== 1 ? "s" : ""}</td>
          <td>Rp ${formatPrice(transaction.total)}</td>
          <td>${date}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewTransaction('${
              transaction.id
            }')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Legacy function for compatibility
function displayTransactions() {
  renderTransactions();
}

function updateStats() {
  if (!totalSales || !totalTransactions) return;

  const total = transactions.reduce(
    (sum, t) => sum + Number(t.total_amount || 0),
    0
  );

  totalSales.textContent = `Rp ${total.toLocaleString("id-ID")}`;
  totalTransactions.textContent = transactions.length.toString();
}

function viewTransaction(transactionId) {
  const transaction = transactions.find(
    (t) => String(t.id) === String(transactionId)
  );
  if (!transaction) {
    showError("Transaction not found");
    return;
  }

  currentTransactionId = transactionId;

  const when =
    transaction.created_at || transaction.transaction_date || transaction.date;
  const date = new Date(when).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  let items = [];
  try {
    items = Array.isArray(transaction.items)
      ? transaction.items
      : JSON.parse(transaction.items || "[]");
  } catch (_) {
    items = [];
  }
  const itemsHtml =
    items.length > 0
      ? items
          .map(
            (item) => `
        <div class="transaction-item">
          <div class="item-info">
            <span class="item-name">${item.name || item.product_name}</span>
            <span class="item-price">Rp ${Number(
              item.price || 0
            ).toLocaleString("id-ID")}</span>
          </div>
          <div class="item-quantity">Qty: ${item.quantity}</div>
          <div class="item-total">Rp ${Number(
            (item.price || 0) * (item.quantity || 1)
          ).toLocaleString("id-ID")}</div>
        </div>
      `
          )
          .join("")
      : "<p>No items in this transaction</p>";

  if (transactionDetails) {
    transactionDetails.innerHTML = `
      <div class="transaction-info">
        <div class="info-group">
          <label>Transaction ID:</label>
          <span>#${transaction.id.toString().slice(-8)}</span>
        </div>
        <div class="info-group">
          <label>Date:</label>
          <span>${date}</span>
        </div>
        <div class="info-group">
          <label>Customer:</label>
          <span>${transaction.customer_name || "Anonymous"}</span>
        </div>
        <div class="info-group">
          <label>Total Amount:</label>
          <span class="total-amount">Rp ${Number(
            transaction.total_amount ?? transaction.total ?? 0
          ).toLocaleString("id-ID")}</span>
        </div>
      </div>
      <div class="transaction-items">
        <h4>Items Purchased:</h4>
        <div class="items-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  showModal();
}

function confirmDelete(transactionId) {
  currentTransactionId = transactionId;
  const transaction = transactions.find(
    (t) => String(t.id) === String(transactionId)
  );

  if (!transaction) {
    showError("Transaction not found");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete transaction #${transaction.id
        .toString()
        .slice(-8)}? This action cannot be undone.`
    )
  ) {
    deleteTransaction();
  }
}

async function deleteTransaction() {
  if (!currentTransactionId) return;

  try {
    showLoading();

    const { error } = await supabaseClient
      .from("transactions")
      .delete()
      .eq("id", currentTransactionId);

    if (error) {
      console.error("Error deleting transaction:", error);
      showError("Failed to delete transaction: " + error.message);
      return;
    }

    showSuccess("Transaction deleted successfully");
    closeModal();
    await loadTransactions(); // Reload transactions
  } catch (error) {
    console.error("Error deleting transaction:", error);
    showError("Failed to delete transaction");
  } finally {
    hideLoading();
  }
}

function handleSearch(e) {
  const q = (e.target.value || "").trim().toLowerCase();
  if (!q) {
    filteredTransactions = transactions;
    return displayTransactions();
  }
  filteredTransactions = transactions.filter((t) => {
    const idStr = String(t.id).toLowerCase();
    const name = (t.customer_name || "Anonymous").toLowerCase();
    return idStr.includes(q) || name.includes(q);
  });
  displayTransactions();
}

// Modal Controls
function showModal() {
  if (transactionModal) {
    transactionModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function closeModal() {
  if (transactionModal) {
    transactionModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
  currentTransactionId = null;
}

// Notification Functions
function showError(message) {
  if (errorMessage && errorNotification) {
    errorMessage.textContent = message;
    errorNotification.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(hideError, 5000);
  }
}

function hideError() {
  if (errorNotification) {
    errorNotification.classList.add("hidden");
  }
}

function showSuccess(message) {
  if (successMessage && successNotification) {
    successMessage.textContent = message;
    successNotification.classList.remove("hidden");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (successNotification) {
        successNotification.classList.add("hidden");
      }
    }, 3000);
  }
}

function showLoading() {
  if (loading) {
    loading.classList.remove("hidden");
  }
}

// Format price with thousands separator
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID").format(price);
}

function hideLoading() {
  if (loading) {
    loading.classList.add("hidden");
  }
}

// Handle errors gracefully
window.addEventListener("error", (event) => {
  console.error("Admin panel error:", event.error);
  showError("An unexpected error occurred");
});

// Export for debugging
if (typeof window !== "undefined") {
  window.adminDebug = {
    transactions,
    loadTransactions,
    currentTransactionId,
  };
}
