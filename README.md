# Neighborhood Administration System

A web application for managing neighborhood fee payments and expenses in a residential community.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | PHP 8.x - Laravel 13 |
| Frontend | React 19 + Vite |
| Database | MySQL 8.0 |
| Styling | Tailwind CSS v4 |
| Chart | Recharts |
| Icons | Lucide React |

## Features

- **Authentication** - Secure login with Laravel Sanctum (session-based SPA authentication)
- **Resident Management** - CRUD resident data with ID photo upload
- **House Management** - CRUD house data, assign/remove residents, occupancy history
- **Payment Management** - Record monthly fees (security IDR 100,000 & cleaning IDR 15,000), single & bulk payments
- **Expense Management** - Record neighborhood expenses (security guard salary, electricity tokens, repairs, etc.)
- **Financial Reports** - Income vs expenses chart, monthly details, balance

## Default Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@neighborhood.com` |
| Password | `password` |

## Project Structure

```
neighborhood-admin/
├── backend/          # Laravel REST API
├── frontend/         # React + Vite SPA
├── ERD.md            # Entity Relationship Diagram
└── README.md         # Installation Guide (this file)
```

---

## Installation Guide

### Prerequisites

Make sure the following are installed on your computer:

- **PHP** >= 8.2 with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`
- **Composer** >= 2.x
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** >= 8.0

### Step 1: Clone Repository

```bash
git clone <repository-url> neighborhood-admin
cd neighborhood-admin
```

### Step 2: Setup Database

1. Create a new MySQL database:

```sql
CREATE DATABASE neighborhood_admin;
```

### Step 3: Setup Backend (Laravel)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

2. Edit the `.env` file and configure the database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=neighborhood_admin
DB_USERNAME=root
DB_PASSWORD=your_password
```

3. Run migrations and seeder:

```bash
# Run database migrations
php artisan migrate

# Run seeder for initial data (20 houses, 18 residents, payment & expense data)
php artisan db:seed

# Create symbolic link for storage (ID photo uploads)
php artisan storage:link
```

4. Start the backend server:

```bash
php artisan serve --port=8000
```

Backend will run at `http://localhost:8000`

### Step 4: Setup Frontend (React)

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

Edit `vite.config.js` if the backend port is different (default: 8000):

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // Adjust to match backend port
      changeOrigin: true,
    },
    '/storage': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

Start the frontend server:

```bash
npm run dev
```

Frontend will run at `http://localhost:3000`

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:3000**

---

## Seed Data

After running `php artisan db:seed`, the database will be populated with:

| Data | Count | Description |
|------|-------|-------------|
| Houses | 20 | A1-A10, B1-B10 |
| Permanent Residents | 15 | Occupying houses A1-A10, B1-B5 |
| Contract Residents | 3 | Occupying houses B6-B8 |
| Vacant Houses | 2 | B9, B10 |
| Payments | 402 | 2024 data (Jan-Oct paid, Nov-Dec unpaid) |
| Expenses | 28 | Security guard salary, electricity tokens, repairs |

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/login` | Login (email + password) | No |
| POST | `/api/logout` | Logout (invalidate session) | Yes |
| GET | `/api/user` | Get authenticated user | Yes |

> All other endpoints below require authentication (`auth:sanctum` middleware).

### Residents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/residents` | List all residents (paginated) |
| POST | `/api/residents` | Create a new resident |
| GET | `/api/residents/{id}` | Get resident details |
| PUT | `/api/residents/{id}` | Update a resident |
| DELETE | `/api/residents/{id}` | Delete a resident |

### Houses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/houses` | List all houses |
| POST | `/api/houses` | Create a new house |
| GET | `/api/houses/{id}` | Get house details + history |
| PUT | `/api/houses/{id}` | Update a house |
| POST | `/api/houses/{id}/assign-resident` | Assign a resident to a house |
| POST | `/api/houses/{id}/remove-resident` | Remove a resident from a house |
| GET | `/api/houses/{id}/history` | Get house resident history |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List payments (filter: month, year, fee_type, status) |
| POST | `/api/payments` | Create a single payment |
| POST | `/api/payments-bulk` | Create bulk payments (month range) |
| POST | `/api/payments-generate` | Auto-generate monthly bills |
| PUT | `/api/payments/{id}` | Update a payment |
| DELETE | `/api/payments/{id}` | Delete a payment |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (filter: month, year, category) |
| POST | `/api/expenses` | Create an expense |
| PUT | `/api/expenses/{id}` | Update an expense |
| DELETE | `/api/expenses/{id}` | Delete an expense |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/summary?year=2024` | Yearly summary (12 months) |
| GET | `/api/reports/detail?month=1&year=2024` | Monthly detail |

## ERD

See [ERD.md](./ERD.md) for the complete Entity Relationship Diagram.

## Troubleshooting

### Error: SQLSTATE[HY000] [2002] Connection refused
- Make sure MySQL is running
- Check the DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD configuration in `.env`

### Error: The stream or file "storage/logs/laravel.log" could not be opened
```bash
chmod -R 775 storage bootstrap/cache
```

### Frontend cannot connect to API
- Make sure the backend is running on port 8000
- Check the proxy configuration in `vite.config.js`

### ID Photo not showing
```bash
php artisan storage:link
```
