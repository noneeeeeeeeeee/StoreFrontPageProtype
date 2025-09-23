# BookStore - Modern Store Front

Tech Demo, Ignore...open github pages.

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project at [Supabase](https://supabase.com)
2. Create the following tables in your SQL editor:

```sql
-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    icon VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_date TIMESTAMP DEFAULT NOW(),
    subtotal INTEGER NOT NULL,
    tax INTEGER NOT NULL,
    total INTEGER NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

3. Update the Supabase configuration in `config.js`:
   - Replace `SUPABASE_URL` with your project URL
   - Replace `SUPABASE_ANON_KEY` with your anon/public key

### 2. Local Development

1. Clone or download this repository
2. Update the Supabase credentials in `config.js`
