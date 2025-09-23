// Get Supabase client from config
const { supabaseClient } = window;

// DOM Elements
const transactionsTbody = document.getElementById("transactions-tbody");
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

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin panel loaded");
  setupEventListeners();
  loadTransactions();
});

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
    displayTransactions();
    updateStats();
  } catch (error) {
    console.error("Error loading transactions:", error);
    showError("Failed to load transactions");
  } finally {
    hideLoading();
  }
}

function displayTransactions() {
  if (!transactionsTbody) return;

  if (transactions.length === 0) {
    transactionsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
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

  transactionsTbody.innerHTML = transactions
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
      } catch (_) {
        items = [];
      }
      const itemsText =
        items.length > 0
          ? items
              .map(
                (item) => `${item.name || item.product_name} (${item.quantity})`
              )
              .join(", ")
          : "No items";

      return `
        <tr>
          <td class="transaction-id">#${transaction.id
            .toString()
            .slice(-8)}</td>
          <td>${date}</td>
          <td class="customer-name">${
            transaction.customer_name || "Anonymous"
          }</td>
          <td class="transaction-items">${itemsText}</td>
          <td class="transaction-total">Rp ${Number(
            transaction.total_amount ?? transaction.total ?? 0
          ).toLocaleString("id-ID")}</td>
          <td>
            <span class="status-badge status-completed">
              <i class="fas fa-check-circle"></i>
              Completed
            </span>
          </td>
          <td class="action-buttons">
            <button class="btn btn-sm btn-primary view-btn" onclick="viewTransaction('${
              transaction.id
            }')">
              <i class="fas fa-eye"></i>
              View
            </button>
            <button class="btn btn-sm btn-danger delete-btn" onclick="confirmDelete('${
              transaction.id
            }')">
              <i class="fas fa-trash"></i>
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
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
  const transaction = transactions.find((t) => t.id === transactionId);
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
  const transaction = transactions.find((t) => t.id === transactionId);

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
