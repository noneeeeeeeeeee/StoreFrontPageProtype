// Supabase Configuration
const SUPABASE_URL = "https://vnrwspjkexmiwldtxtmx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucndzcGprZXhtaXdsZHR4dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjQ3NDIsImV4cCI6MjA3MzA0MDc0Mn0.h3CYGPCgZ4kBAoVoWe_4KXNNL4zAh0IbZwV4BRE34Sc";

// App Configuration
const APP_CONFIG = {
  name: "BookStore Cart",
  version: "1.0.0",
  developer: "JamesC",
  description: "Modern store front with glassmorphism design",
  features: {
    taxRate: 0.1, // 10% tax
    currency: "IDR",
    currencySymbol: "Rp",
    enableNotifications: true,
    enableOfflineMode: true,
    autoSaveCart: true,
  },
};

// Initialize Supabase client with error handling
let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
}

// Export for use in other scripts
window.supabaseClient = supabase;
window.appConfig = APP_CONFIG;

// Set dynamic content
document.addEventListener("DOMContentLoaded", () => {
  // Update developer name if element exists
  const developerNameElement = document.getElementById("developer-name");
  if (developerNameElement) {
    developerNameElement.textContent = APP_CONFIG.developer;
  }

  // Update page title
  document.title = `${APP_CONFIG.name} - Modern Store Front`;
});

// Utility function to check if Supabase is available
window.isSupabaseAvailable = () => {
  return supabase && typeof supabase.from === "function";
};

// Error handling for network issues
window.addEventListener("online", () => {
  console.log("🌐 Back online - Supabase connection restored");
  if (window.showSuccess) {
    window.showSuccess("Connection restored - all features available");
  }
});

window.addEventListener("offline", () => {
  console.log("📴 Offline - Using cached data");
  if (window.showError) {
    window.showError("You are offline - some features may be limited");
  }
});
