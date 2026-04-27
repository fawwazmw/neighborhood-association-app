<?php

use App\Models\User;
use App\Models\House;
use App\Models\Resident;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\Expense;

beforeEach(function () {
    $this->user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);
});

it('can get yearly summary', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);
    $houseResident = HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-01-15',
    ]);

    Expense::create([
        'category' => 'Security Guard',
        'amount' => 50000,
        'date' => '2024-01-20',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/summary?year=2024');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Yearly report retrieved successfully.',
        ])
        ->assertJsonStructure([
            'data' => [
                'year',
                'summary' => [
                    '*' => ['month', 'month_name', 'income', 'expenses', 'balance'],
                ],
                'total_income',
                'total_expenses',
                'final_balance',
            ],
        ]);

    expect($response->json('data.year'))->toBe(2024);
    expect(count($response->json('data.summary')))->toBe(12);
});

it('validates year parameter is required for summary', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/summary');

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.year', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates year must be integer >= 2020 for summary', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/summary?year=2019');

    $response->assertStatus(422)
        ->assertJsonPath('data.year', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can get monthly detail', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);
    $houseResident = HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'security',
        'month' => 3,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-03-15',
    ]);

    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 3,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'unpaid',
    ]);

    Expense::create([
        'category' => 'Security Guard',
        'description' => 'Monthly salary',
        'amount' => 50000,
        'date' => '2024-03-20',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail?month=3&year=2024');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Monthly report retrieved successfully.',
            'data' => [
                'month' => 3,
                'year' => 2024,
                'month_name' => 'March',
            ],
        ])
        ->assertJsonStructure([
            'data' => [
                'month',
                'year',
                'month_name',
                'income' => [
                    'total',
                    'detail' => [
                        '*' => ['house', 'resident', 'fee_type', 'amount', 'payment_date', 'status'],
                    ],
                ],
                'expenses' => [
                    'total',
                    'detail' => [
                        '*' => ['category', 'description', 'amount', 'date'],
                    ],
                ],
                'balance',
            ],
        ]);

    // Income detail should have 2 payment records
    expect(count($response->json('data.income.detail')))->toBe(2);
    // Expense detail should have 1 record
    expect(count($response->json('data.expenses.detail')))->toBe(1);
});

it('validates month and year are required for detail', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail');

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ]);
});

it('validates month must be between 1 and 12 for detail', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail?month=13&year=2024');

    $response->assertStatus(422)
        ->assertJsonPath('data.month', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates year is required for detail', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail?month=3');

    $response->assertStatus(422)
        ->assertJsonPath('data.year', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('returns correct totals in yearly summary', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);
    $houseResident = HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    // January: 100k security (paid) + 15k cleaning (paid) = 115k income
    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-01-15',
    ]);

    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 1,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'paid',
        'payment_date' => '2024-01-15',
    ]);

    // February: 100k security (paid) = 100k income
    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'security',
        'month' => 2,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-02-15',
    ]);

    // February: 15k cleaning (unpaid) — should NOT count as income
    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 2,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'unpaid',
    ]);

    // Expenses: January 50k, February 30k
    Expense::create([
        'category' => 'Security Guard',
        'amount' => 50000,
        'date' => '2024-01-20',
    ]);

    Expense::create([
        'category' => 'Cleaning Supplies',
        'amount' => 30000,
        'date' => '2024-02-10',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/summary?year=2024');

    $response->assertStatus(200);

    $data = $response->json('data');

    // Total income: 100k + 15k + 100k = 215k (only paid)
    expect((float) $data['total_income'])->toBe(215000.0);

    // Total expenses: 50k + 30k = 80k
    expect((float) $data['total_expenses'])->toBe(80000.0);

    // Final balance: 215k - 80k = 135k
    expect((float) $data['final_balance'])->toBe(135000.0);

    // Check January specifically
    $january = collect($data['summary'])->firstWhere('month', 1);
    expect((float) $january['income'])->toBe(115000.0);
    expect((float) $january['expenses'])->toBe(50000.0);
    expect((float) $january['balance'])->toBe(65000.0);
    expect($january['month_name'])->toBe('January');

    // Check February specifically
    $february = collect($data['summary'])->firstWhere('month', 2);
    expect((float) $february['income'])->toBe(100000.0);
    expect((float) $february['expenses'])->toBe(30000.0);
    expect((float) $february['balance'])->toBe(70000.0);

    // Check a month with no data
    $march = collect($data['summary'])->firstWhere('month', 3);
    expect((float) $march['income'])->toBe(0.0);
    expect((float) $march['expenses'])->toBe(0.0);
    expect((float) $march['balance'])->toBe(0.0);
});

it('returns correct totals in monthly detail', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);
    $houseResident = HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    // 100k paid + 15k unpaid
    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'security',
        'month' => 3,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-03-15',
    ]);

    Payment::create([
        'house_resident_id' => $houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 3,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'unpaid',
    ]);

    Expense::create([
        'category' => 'Security Guard',
        'amount' => 50000,
        'date' => '2024-03-20',
    ]);

    Expense::create([
        'category' => 'Cleaning Supplies',
        'amount' => 25000,
        'date' => '2024-03-25',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail?month=3&year=2024');

    $response->assertStatus(200);

    $data = $response->json('data');

    // Income total: only paid = 100k
    expect((float) $data['income']['total'])->toBe(100000.0);

    // Expenses total: 50k + 25k = 75k
    expect((float) $data['expenses']['total'])->toBe(75000.0);

    // Balance: 100k - 75k = 25k
    expect((float) $data['balance'])->toBe(25000.0);
});

it('returns empty data for year with no records', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/summary?year=2030');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'year' => 2030,
                'total_income' => 0,
                'total_expenses' => 0,
                'final_balance' => 0,
            ],
        ]);

    // Should still have 12 months in summary
    expect(count($response->json('data.summary')))->toBe(12);
});

it('returns empty data for month with no records', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/reports/detail?month=6&year=2030');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'month' => 6,
                'year' => 2030,
                'month_name' => 'June',
                'income' => [
                    'total' => 0,
                ],
                'expenses' => [
                    'total' => 0,
                ],
                'balance' => 0,
            ],
        ]);
});

it('blocks unauthenticated access to reports', function () {
    $response = $this->getJson('/api/reports/summary?year=2024');
    $response->assertStatus(401);

    $response = $this->getJson('/api/reports/detail?month=3&year=2024');
    $response->assertStatus(401);
});
