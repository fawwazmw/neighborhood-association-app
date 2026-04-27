# Entity Relationship Diagram (ERD)
## Neighborhood Administration System

### Relationship Diagram

```
┌─────────────────────────┐       ┌─────────────────────────────┐
│       residents          │       │          houses              │
├─────────────────────────┤       ├─────────────────────────────┤
│ PK  id                  │       │ PK  id                      │
│     full_name           │       │     house_number (UNIQUE)   │
│     id_photo            │       │     address                 │
│     resident_status     │       │     created_at              │
│     (permanent/contract)│       │     updated_at              │
│     phone_number        │       │                             │
│     marital_status      │       └──────────┬──────────────────┘
│     created_at          │                  │
│     updated_at          │                  │ 1
└──────────┬──────────────┘                  │
           │                                 │
           │ 1                               │
           │                                 │
           │         ┌───────────────────────┘
           │         │
           ▼    N    ▼    N
    ┌──────────────────────────────────┐
    │         house_residents           │
    ├──────────────────────────────────┤
    │ PK  id                           │
    │ FK  house_id → houses.id         │
    │ FK  resident_id → residents.id   │
    │     start_date                   │
    │     end_date (nullable)          │
    │     is_active                    │
    │     created_at                   │
    │     updated_at                   │
    └──────────┬───────────────────────┘
               │
               │ 1
               │
               ▼ N
    ┌──────────────────────────────────────────┐
    │            payments                       │
    ├──────────────────────────────────────────┤
    │ PK  id                                   │
    │ FK  house_resident_id → house_residents.id│
    │     fee_type (security/cleaning)         │
    │     month (1-12)                         │
    │     year                                 │
    │     amount                               │
    │     payment_date (nullable)              │
    │     status (paid/unpaid)                 │
    │     created_at                           │
    │     updated_at                           │
    │                                          │
    │ UNIQUE (house_resident_id, fee_type,     │
    │         month, year)                     │
    └──────────────────────────────────────────┘


    ┌──────────────────────────────────┐
    │          expenses                 │
    ├──────────────────────────────────┤
    │ PK  id                           │
    │     category                     │
    │     description                  │
    │     amount                       │
    │     date                         │
    │     is_recurring                 │
    │     created_at                   │
    │     updated_at                   │
    └──────────────────────────────────┘
```

### Table Relationships

| Relationship | Type | Description |
|---|---|---|
| `residents` → `house_residents` | One to Many | One resident can have many occupancy records |
| `houses` → `house_residents` | One to Many | One house can have many resident records |
| `house_residents` → `payments` | One to Many | One occupancy record can have many payments |
| `residents` ↔ `houses` | Many to Many | Through `house_residents` pivot table |
| `expenses` | Standalone | Not related to other tables |

### Table Descriptions

#### 1. `residents`
Stores resident data. Each resident has a status of either permanent or contract.

#### 2. `houses`
Stores data for 20 houses in the neighborhood. Each house has a unique number.

#### 3. `house_residents` (Occupancy History)
Pivot table that records the history of who occupies which house. The `is_active` field indicates the current active resident. The `end_date` field is filled when a resident moves out.

#### 4. `payments` (Monthly Fees)
Records monthly fee payments (security IDR 100,000 and cleaning IDR 15,000). Each record represents one month for one fee type. The UNIQUE constraint prevents duplicate payments.

#### 5. `expenses`
Records neighborhood expenses such as security guard salary, electricity tokens, road repairs, etc. The `is_recurring` field indicates monthly recurring expenses.
