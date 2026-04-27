<?php

use App\Models\User;
use App\Models\Resident;

beforeEach(function () {
    $this->user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);
});

it('can list residents', function () {
    Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    Resident::create([
        'full_name' => 'Jane Smith',
        'resident_status' => 'contract',
        'phone_number' => '08198765432',
        'marital_status' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/residents');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Resident data retrieved successfully.',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'data' => [
                    '*' => ['id', 'full_name', 'resident_status', 'phone_number', 'marital_status'],
                ],
                'current_page',
                'per_page',
                'total',
            ],
            'message',
        ]);

    expect($response->json('data.total'))->toBe(2);
});

it('can search residents by name', function () {
    Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    Resident::create([
        'full_name' => 'Jane Smith',
        'resident_status' => 'contract',
        'phone_number' => '08198765432',
        'marital_status' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/residents?search=John');

    $response->assertStatus(200);
    expect($response->json('data.total'))->toBe(1);
    expect($response->json('data.data.0.full_name'))->toBe('John Doe');
});

it('can create a resident', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/residents', [
            'full_name' => 'John Doe',
            'resident_status' => 'permanent',
            'phone_number' => '08123456789',
            'marital_status' => true,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Resident created successfully.',
            'data' => [
                'full_name' => 'John Doe',
                'resident_status' => 'permanent',
                'phone_number' => '08123456789',
                'marital_status' => true,
            ],
        ]);

    expect(Resident::count())->toBe(1);
});

it('validates resident creation requires full_name', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/residents', [
            'resident_status' => 'permanent',
            'phone_number' => '08123456789',
            'marital_status' => true,
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.full_name', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates resident creation requires valid resident_status', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/residents', [
            'full_name' => 'John Doe',
            'resident_status' => 'invalid_status',
            'phone_number' => '08123456789',
            'marital_status' => true,
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.resident_status', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates resident creation requires phone_number', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/residents', [
            'full_name' => 'John Doe',
            'resident_status' => 'permanent',
            'marital_status' => true,
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.phone_number', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates resident creation requires marital_status', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/residents', [
            'full_name' => 'John Doe',
            'resident_status' => 'permanent',
            'phone_number' => '08123456789',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.marital_status', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can show a single resident', function () {
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/residents/{$resident->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Resident details retrieved successfully.',
            'data' => [
                'id' => $resident->id,
                'full_name' => 'John Doe',
                'resident_status' => 'permanent',
            ],
        ]);
});

it('returns 404 for non-existent resident', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/residents/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Resident not found.',
        ]);
});

it('can update a resident', function () {
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/residents/{$resident->id}", [
            'full_name' => 'John Updated',
            'phone_number' => '08111111111',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Resident updated successfully.',
            'data' => [
                'id' => $resident->id,
                'full_name' => 'John Updated',
                'phone_number' => '08111111111',
            ],
        ]);

    expect($resident->fresh()->full_name)->toBe('John Updated');
});

it('returns 404 when updating non-existent resident', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/residents/999', [
            'full_name' => 'Ghost',
        ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Resident not found.',
        ]);
});

it('can delete a resident', function () {
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->deleteJson("/api/residents/{$resident->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Resident deleted successfully.',
        ]);

    expect(Resident::count())->toBe(0);
});

it('returns 404 when deleting non-existent resident', function () {
    $response = $this->actingAs($this->user)
        ->deleteJson('/api/residents/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Resident not found.',
        ]);
});
