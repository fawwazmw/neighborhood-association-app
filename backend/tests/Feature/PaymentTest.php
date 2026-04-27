<?php

use App\Models\User;
use App\Models\House;
use App\Models\Resident;
use App\Models\HouseResident;
use App\Models\Payment;

beforeEach(function () {
    $this->user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $this->house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $this->resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);
    $this->houseResident = HouseResident::create([
        'house_id' => $this->house->id,
        'resident_id' => $this->resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);
});

it('can list payments', function () {
    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 1,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'paid',
        'payment_date' => '2024-01-15',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/payments');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Payment data retrieved successfully.',
        ])
        ->assertJsonStructure([
            'data' => [
                'data' => [
                    '*' => [
                        'id', 'house_resident_id', 'fee_type', 'month', 'year',
                        'amount', 'status', 'house_resident',
                    ],
                ],
                'current_page',
                'per_page',
                'total',
            ],
        ]);

    expect($response->json('data.total'))->toBe(2);
});

it('can filter payments by year', function () {
    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2025,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/payments?year=2024');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
    expect($response->json('data.data.0.year'))->toBe(2024);
});

it('can filter payments by month', function () {
    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 2,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/payments?month=1');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
});

it('can filter payments by fee_type', function () {
    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 1,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/payments?fee_type=security');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
    expect($response->json('data.data.0.fee_type'))->toBe('security');
});

it('can filter payments by status', function () {
    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'paid',
        'payment_date' => '2024-01-15',
    ]);

    Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'cleaning',
        'month' => 1,
        'year' => 2024,
        'amount' => 15000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/payments?status=paid');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
    expect($response->json('data.data.0.status'))->toBe('paid');
});

it('can create a payment', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'month' => 3,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'unpaid',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Payment created successfully.',
            'data' => [
                'house_resident_id' => $this->houseResident->id,
                'fee_type' => 'security',
                'month' => 3,
                'year' => 2024,
                'amount' => '100000.00',
                'status' => 'unpaid',
            ],
        ]);

    expect(Payment::count())->toBe(1);
});

it('auto-sets payment_date when status is paid', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'month' => 3,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'paid',
        ]);

    $response->assertStatus(201);
    expect($response->json('data.payment_date'))->not->toBeNull();
});

it('validates payment creation requires house_resident_id', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'fee_type' => 'security',
            'month' => 3,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'unpaid',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.house_resident_id', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates payment creation requires valid fee_type', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'invalid_type',
            'month' => 3,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'unpaid',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.fee_type', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates payment creation requires valid month range', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'month' => 13,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'unpaid',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.month', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates payment creation requires valid status', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'month' => 3,
            'year' => 2024,
            'amount' => 100000,
            'status' => 'invalid_status',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.status', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can show a single payment', function () {
    $payment = Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/payments/{$payment->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Payment details retrieved successfully.',
            'data' => [
                'id' => $payment->id,
                'fee_type' => 'security',
                'amount' => '100000.00',
            ],
        ])
        ->assertJsonStructure([
            'data' => ['id', 'house_resident_id', 'fee_type', 'month', 'year', 'amount', 'status', 'house_resident'],
        ]);
});

it('returns 404 for non-existent payment', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/payments/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Payment not found.',
        ]);
});

it('can update a payment to mark as paid', function () {
    $payment = Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/payments/{$payment->id}", [
            'status' => 'paid',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Payment updated successfully.',
        ]);

    $updated = $payment->fresh();
    expect($updated->status)->toBe('paid');
    expect($updated->payment_date)->not->toBeNull();
});

it('can update payment amount', function () {
    $payment = Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/payments/{$payment->id}", [
            'amount' => 150000,
        ]);

    $response->assertStatus(200);
    expect($payment->fresh()->amount)->toBe('150000.00');
});

it('returns 404 when updating non-existent payment', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/payments/999', [
            'status' => 'paid',
        ]);

    $response->assertStatus(404);
});

it('can delete a payment', function () {
    $payment = Payment::create([
        'house_resident_id' => $this->houseResident->id,
        'fee_type' => 'security',
        'month' => 1,
        'year' => 2024,
        'amount' => 100000,
        'status' => 'unpaid',
    ]);

    $response = $this->actingAs($this->user)
        ->deleteJson("/api/payments/{$payment->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Payment deleted successfully.',
        ]);

    expect(Payment::count())->toBe(0);
});

it('returns 404 when deleting non-existent payment', function () {
    $response = $this->actingAs($this->user)
        ->deleteJson('/api/payments/999');

    $response->assertStatus(404);
});

it('can generate bills for all active residents', function () {
    // Create a second house with active resident
    $house2 = House::create(['house_number' => 'A-02', 'address' => 'Block A No 2']);
    $resident2 = Resident::create([
        'full_name' => 'Jane Smith',
        'resident_status' => 'contract',
        'phone_number' => '08198765432',
        'marital_status' => false,
    ]);
    HouseResident::create([
        'house_id' => $house2->id,
        'resident_id' => $resident2->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-generate', [
            'month' => 3,
            'year' => 2024,
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'month' => 3,
                'year' => 2024,
                'active_residents' => 2,
            ],
        ]);

    // 2 residents × 2 fee types (security + cleaning) = 4 bills
    expect($response->json('data.bills_created'))->toBe(4);
    expect(Payment::count())->toBe(4);
});

it('does not duplicate bills when generating for same month', function () {
    // Generate bills first time
    $this->actingAs($this->user)
        ->postJson('/api/payments-generate', [
            'month' => 3,
            'year' => 2024,
        ]);

    $firstCount = Payment::count();

    // Generate bills second time for same month
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-generate', [
            'month' => 3,
            'year' => 2024,
        ]);

    $response->assertStatus(200);
    expect($response->json('data.bills_created'))->toBe(0);
    expect(Payment::count())->toBe($firstCount);
});

it('validates generate bills requires month and year', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-generate', []);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ]);
});

it('generates bills with correct amounts', function () {
    $this->actingAs($this->user)
        ->postJson('/api/payments-generate', [
            'month' => 3,
            'year' => 2024,
        ]);

    $securityPayment = Payment::where('fee_type', 'security')->first();
    $cleaningPayment = Payment::where('fee_type', 'cleaning')->first();

    expect($securityPayment->amount)->toBe('100000.00');
    expect($cleaningPayment->amount)->toBe('15000.00');
    expect($securityPayment->status)->toBe('unpaid');
    expect($cleaningPayment->status)->toBe('unpaid');
});

it('can create bulk payments', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-bulk', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'year' => 2024,
            'start_month' => 1,
            'end_month' => 6,
            'amount' => 100000,
            'status' => 'paid',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ]);

    expect(Payment::count())->toBe(6);

    // All should be paid with payment_date set
    Payment::all()->each(function ($payment) {
        expect($payment->status)->toBe('paid');
        expect($payment->payment_date)->not->toBeNull();
    });
});

it('validates bulk payment requires all fields', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-bulk', [
            'house_resident_id' => $this->houseResident->id,
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ]);
});

it('validates bulk payment end_month must be >= start_month', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/payments-bulk', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'year' => 2024,
            'start_month' => 6,
            'end_month' => 3,
            'amount' => 100000,
            'status' => 'paid',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.end_month', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('bulk payment uses updateOrCreate to avoid duplicates', function () {
    // Create initial bulk
    $this->actingAs($this->user)
        ->postJson('/api/payments-bulk', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'year' => 2024,
            'start_month' => 1,
            'end_month' => 3,
            'amount' => 100000,
            'status' => 'unpaid',
        ]);

    expect(Payment::count())->toBe(3);

    // Create overlapping bulk with different status
    $this->actingAs($this->user)
        ->postJson('/api/payments-bulk', [
            'house_resident_id' => $this->houseResident->id,
            'fee_type' => 'security',
            'year' => 2024,
            'start_month' => 1,
            'end_month' => 3,
            'amount' => 100000,
            'status' => 'paid',
        ]);

    // Should still be 3 records (updated, not duplicated)
    expect(Payment::count())->toBe(3);
    expect(Payment::where('status', 'paid')->count())->toBe(3);
});
