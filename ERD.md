# Entity Relationship Diagram (ERD)

## Neighborhood Administration System

### Database: MySQL — `neighborhood_admin`

---

### Diagram

```
 ┌──────────────────────────────┐
 │            users              │
 ├──────────────────────────────┤
 │ PK  id           BIGINT(UN)  │
 │     name         VARCHAR(255)│
 │     email        VARCHAR(255)│  ← UNIQUE
 │     password     VARCHAR(255)│
 │     remember_token VARCHAR(100)│
 │     created_at   TIMESTAMP   │
 │     updated_at   TIMESTAMP   │
 └──────────────────────────────┘
        (standalone — authentication only)



 ┌──────────────────────────────┐          ┌──────────────────────────────┐
 │          residents            │          │           houses              │
 ├──────────────────────────────┤          ├──────────────────────────────┤
 │ PK  id           BIGINT(UN)  │          │ PK  id           BIGINT(UN)  │
 │     full_name    VARCHAR(255)│          │     house_number VARCHAR(10) │  ← UNIQUE
 │     id_photo     VARCHAR(255)│  NULL    │     address      VARCHAR(255)│  NULL
 │     resident_status ENUM     │          │     created_at   TIMESTAMP   │
 │       ('permanent','contract')│          │     updated_at   TIMESTAMP   │
 │     phone_number VARCHAR(20) │          └──────────┬───────────────────┘
 │     marital_status TINYINT(1)│                     │
 │     created_at   TIMESTAMP   │                     │ 1
 │     updated_at   TIMESTAMP   │                     │
 └──────────┬───────────────────┘                     │
            │                                         │
            │ 1                                       │
            │                                         │
            │          ┌──────────────────────────────┘
            │          │
            ▼ N        ▼ N
 ┌─────────────────────────────────────────┐
 │           house_residents                │
 ├─────────────────────────────────────────┤
 │ PK  id              BIGINT(UN)          │
 │ FK  house_id        BIGINT(UN)          │  → houses.id (CASCADE DELETE)
 │ FK  resident_id     BIGINT(UN)          │  → residents.id (CASCADE DELETE)
 │     start_date      DATE                │
 │     end_date        DATE                │  NULL
 │     is_active       TINYINT(1)          │  DEFAULT 1
 │     created_at      TIMESTAMP           │
 │     updated_at      TIMESTAMP           │
 └──────────┬──────────────────────────────┘
            │
            │ 1
            │
            ▼ N
 ┌─────────────────────────────────────────┐
 │             payments                     │
 ├─────────────────────────────────────────┤
 │ PK  id                 BIGINT(UN)       │
 │ FK  house_resident_id  BIGINT(UN)       │  → house_residents.id (CASCADE DELETE)
 │     fee_type           ENUM             │
 │       ('security','cleaning')           │
 │     month              TINYINT          │  1–12
 │     year               INT              │
 │     amount             DECIMAL(12,2)    │
 │     payment_date       DATE             │  NULL
 │     status             ENUM             │
 │       ('paid','unpaid')                 │  DEFAULT 'unpaid'
 │     created_at         TIMESTAMP        │
 │     updated_at         TIMESTAMP        │
 │                                         │
 │ UNIQUE (house_resident_id, fee_type,    │
 │         month, year)                    │
 └─────────────────────────────────────────┘



 ┌─────────────────────────────────────────┐
 │             expenses                     │
 ├─────────────────────────────────────────┤
 │ PK  id              BIGINT(UN)          │
 │     category        VARCHAR(100)        │
 │     description     TEXT                │  NULL
 │     amount          DECIMAL(12,2)       │
 │     date            DATE                │
 │     is_recurring    TINYINT(1)          │  DEFAULT 0
 │     created_at      TIMESTAMP           │
 │     updated_at      TIMESTAMP           │
 └─────────────────────────────────────────┘
        (standalone — no foreign keys)
```

---

### Table Relationships

| Relationship | Type | Description |
|---|---|---|
| `residents` → `house_residents` | One to Many | One resident can have many occupancy records (history) |
| `houses` → `house_residents` | One to Many | One house can have many resident records (history) |
| `house_residents` → `payments` | One to Many | One occupancy record can have many monthly payments |
| `residents` ↔ `houses` | Many to Many | Connected through `house_residents` pivot table |
| `users` | Standalone | Authentication only, not related to domain tables |
| `expenses` | Standalone | Neighborhood expenses, not related to other tables |

---

### Table Descriptions

#### 1. `users` — Authentication
Stores admin login credentials. Single admin user seeded via `DatabaseSeeder`. Used by Laravel Sanctum for session-based SPA authentication.

#### 2. `residents` — Resident Data
Stores all resident information. Each resident has:
- **`resident_status`**: `permanent` (long-term) or `contract` (temporary/rental)
- **`id_photo`**: File path to uploaded ID photo (stored in `storage/app/public/id-photos/`)
- **`marital_status`**: `1` = married, `0` = single

#### 3. `houses` — House Data
Stores the 20 houses in the neighborhood. Each house has a unique `house_number` (e.g., A1, A10, B1, B10). The occupancy status (Occupied/Vacant) is computed from `house_residents.is_active`.

#### 4. `house_residents` — Occupancy History (Pivot Table)
Records which resident lives in which house, and when. Key behaviors:
- **`is_active = 1`**: Current active resident of the house
- **`is_active = 0`**: Historical record (resident has moved out)
- When a new resident is assigned, the previous active record is deactivated (`is_active = 0`, `end_date` set)
- One house can only have one active resident at a time

#### 5. `payments` — Monthly Fee Payments
Records monthly fee payments for each house-resident pair:
- **`fee_type`**: `security` (IDR 100,000/month) or `cleaning` (IDR 15,000/month)
- **`status`**: `paid` or `unpaid`
- **`payment_date`**: Set automatically when status changes to `paid`
- **UNIQUE constraint** prevents duplicate payments for the same house-resident + fee type + month + year
- Supports bulk creation (e.g., pay January–December at once)

#### 6. `expenses` — Neighborhood Expenses
Records all neighborhood spending:
- **`is_recurring = 1`**: Monthly recurring expenses (e.g., security guard salary, electricity)
- **`is_recurring = 0`**: One-time expenses (e.g., road repair, drainage repair)
- Not linked to any house or resident — managed independently by the admin

---

### Indexes & Constraints

| Table | Constraint | Columns |
|---|---|---|
| `users` | UNIQUE | `email` |
| `houses` | UNIQUE | `house_number` |
| `house_residents` | FOREIGN KEY (CASCADE) | `house_id` → `houses.id` |
| `house_residents` | FOREIGN KEY (CASCADE) | `resident_id` → `residents.id` |
| `payments` | FOREIGN KEY (CASCADE) | `house_resident_id` → `house_residents.id` |
| `payments` | UNIQUE | `(house_resident_id, fee_type, month, year)` |
