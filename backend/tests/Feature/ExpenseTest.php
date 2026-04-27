<?php

use App\Models\User;
use App\Models\Expense;

beforeEach(function () {
    $this->user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);
});

it('can list expenses', function () {
    Expense::create([
        'category' => 'Security Guard',
        'description' => 'Monthly security guard salary',
        'amount' => 500000,
        'date' => '2024-03-01',
        'is_recurring' => true,
    ]);

    Expense::create([
        'category' => 'Cleaning Supplies',
        'description' => 'Brooms and trash bags',
        'amount' => 150000,
        'date' => '2024-03-15',
        'is_recurring' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/expenses');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Expense data retrieved successfully.',
        ])
        ->assertJsonStructure([
            'data' => [
                'data' => [
                    '*' => ['id', 'category', 'description', 'amount', 'date', 'is_recurring'],
                ],
                'current_page',
                'per_page',
                'total',
            ],
        ]);

    expect($response->json('data.total'))->toBe(2);
});

it('can filter expenses by year', function () {
    Expense::create([
        'category' => 'Security Guard',
        'amount' => 500000,
        'date' => '2024-03-01',
    ]);

    Expense::create([
        'category' => 'Cleaning',
        'amount' => 150000,
        'date' => '2025-03-01',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/expenses?year=2024');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
});

it('can filter expenses by month', function () {
    Expense::create([
        'category' => 'Security Guard',
        'amount' => 500000,
        'date' => '2024-03-01',
    ]);

    Expense::create([
        'category' => 'Cleaning',
        'amount' => 150000,
        'date' => '2024-04-01',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/expenses?month=3');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
});

it('can filter expenses by category', function () {
    Expense::create([
        'category' => 'Security Guard',
        'amount' => 500000,
        'date' => '2024-03-01',
    ]);

    Expense::create([
        'category' => 'Cleaning Supplies',
        'amount' => 150000,
        'date' => '2024-03-15',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/expenses?category=Security');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
});

it('can create an expense', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'category' => 'Security Guard',
            'description' => 'Monthly security guard salary',
            'amount' => 500000,
            'date' => '2024-03-01',
            'is_recurring' => true,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Expense created successfully.',
            'data' => [
                'category' => 'Security Guard',
                'description' => 'Monthly security guard salary',
                'amount' => '500000.00',
                'is_recurring' => true,
            ],
        ]);

    expect(Expense::count())->toBe(1);
});

it('creates expense with is_recurring defaulting to false', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'category' => 'Repair',
            'description' => 'Fix broken gate',
            'amount' => 200000,
            'date' => '2024-03-10',
        ]);

    $response->assertStatus(201);
    expect($response->json('data.is_recurring'))->toBeFalse();
});

it('validates expense creation requires category', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'amount' => 500000,
            'date' => '2024-03-01',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.category', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates expense creation requires amount', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'category' => 'Security Guard',
            'date' => '2024-03-01',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.amount', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates expense creation requires date', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'category' => 'Security Guard',
            'amount' => 500000,
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.date', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates expense amount must be numeric and non-negative', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/expenses', [
            'category' => 'Security Guard',
            'amount' => -100,
            'date' => '2024-03-01',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.amount', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can show a single expense', function () {
    $expense = Expense::create([
        'category' => 'Security Guard',
        'description' => 'Monthly security guard salary',
        'amount' => 500000,
        'date' => '2024-03-01',
        'is_recurring' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/expenses/{$expense->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Expense details retrieved successfully.',
            'data' => [
                'id' => $expense->id,
                'category' => 'Security Guard',
                'description' => 'Monthly security guard salary',
                'amount' => '500000.00',
                'is_recurring' => true,
            ],
        ]);
});

it('returns 404 for non-existent expense', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/expenses/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Expense not found.',
        ]);
});

it('can update an expense', function () {
    $expense = Expense::create([
        'category' => 'Security Guard',
        'description' => 'Monthly security guard salary',
        'amount' => 500000,
        'date' => '2024-03-01',
        'is_recurring' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/expenses/{$expense->id}", [
            'amount' => 600000,
            'description' => 'Updated salary amount',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Expense updated successfully.',
            'data' => [
                'id' => $expense->id,
                'amount' => '600000.00',
                'description' => 'Updated salary amount',
            ],
        ]);

    expect($expense->fresh()->amount)->toBe('600000.00');
});

it('returns 404 when updating non-existent expense', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/expenses/999', [
            'amount' => 600000,
        ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Expense not found.',
        ]);
});

it('can delete an expense', function () {
    $expense = Expense::create([
        'category' => 'Security Guard',
        'description' => 'Monthly security guard salary',
        'amount' => 500000,
        'date' => '2024-03-01',
        'is_recurring' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->deleteJson("/api/expenses/{$expense->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Expense deleted successfully.',
        ]);

    expect(Expense::count())->toBe(0);
});

it('returns 404 when deleting non-existent expense', function () {
    $response = $this->actingAs($this->user)
        ->deleteJson('/api/expenses/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Expense not found.',
        ]);
});
