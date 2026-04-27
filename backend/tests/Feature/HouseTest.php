<?php

use App\Models\User;
use App\Models\House;
use App\Models\Resident;
use App\Models\HouseResident;

beforeEach(function () {
    $this->user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);
});

it('can list houses', function () {
    House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    House::create(['house_number' => 'A-02', 'address' => 'Block A No 2']);

    $response = $this->actingAs($this->user)
        ->getJson('/api/houses');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'House data retrieved successfully.',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'house_number', 'address', 'occupancy_status'],
            ],
            'message',
        ]);

    expect(count($response->json('data')))->toBe(2);
});

it('can search houses by house_number', function () {
    House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    House::create(['house_number' => 'B-01', 'address' => 'Block B No 1']);

    $response = $this->actingAs($this->user)
        ->getJson('/api/houses?search=A-01');

    $response->assertStatus(200);
    expect(count($response->json('data')))->toBe(1);
    expect($response->json('data.0.house_number'))->toBe('A-01');
});

it('can create a house', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/houses', [
            'house_number' => 'A-01',
            'address' => 'Block A No 1',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'House created successfully.',
            'data' => [
                'house_number' => 'A-01',
                'address' => 'Block A No 1',
            ],
        ]);

    expect(House::count())->toBe(1);
});

it('validates house creation requires house_number', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/houses', [
            'address' => 'Block A No 1',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.house_number', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates house_number must be unique', function () {
    House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->postJson('/api/houses', [
            'house_number' => 'A-01',
            'address' => 'Block A No 1 Duplicate',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.house_number', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can show a single house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->getJson("/api/houses/{$house->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'House details retrieved successfully.',
            'data' => [
                'id' => $house->id,
                'house_number' => 'A-01',
                'address' => 'Block A No 1',
            ],
        ])
        ->assertJsonStructure([
            'data' => ['id', 'house_number', 'address', 'occupancy_status', 'house_residents'],
        ]);
});

it('returns 404 for non-existent house', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/houses/999');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'House not found.',
        ]);
});

it('can update a house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->putJson("/api/houses/{$house->id}", [
            'address' => 'Block A No 1 Updated',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'House updated successfully.',
            'data' => [
                'id' => $house->id,
                'address' => 'Block A No 1 Updated',
            ],
        ]);

    expect($house->fresh()->address)->toBe('Block A No 1 Updated');
});

it('returns 404 when updating non-existent house', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/houses/999', [
            'address' => 'Ghost House',
        ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'House not found.',
        ]);
});

it('can assign a resident to a house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/assign-resident", [
            'resident_id' => $resident->id,
            'start_date' => '2024-01-01',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Resident assigned to house successfully.',
        ])
        ->assertJsonStructure([
            'data' => ['id', 'house_id', 'resident_id', 'start_date', 'is_active', 'house', 'resident'],
        ]);

    expect(HouseResident::count())->toBe(1);
    expect(HouseResident::first()->is_active)->toBeTrue();
});

it('validates assign resident request', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/assign-resident", []);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ]);
});

it('deactivates previous resident when assigning new one', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $resident1 = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $resident2 = Resident::create([
        'full_name' => 'Jane Smith',
        'resident_status' => 'contract',
        'phone_number' => '08198765432',
        'marital_status' => false,
    ]);

    // Assign first resident
    $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/assign-resident", [
            'resident_id' => $resident1->id,
            'start_date' => '2024-01-01',
        ]);

    // Assign second resident (should deactivate first)
    $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/assign-resident", [
            'resident_id' => $resident2->id,
            'start_date' => '2024-06-01',
        ]);

    $records = HouseResident::where('house_id', $house->id)->get();

    expect($records)->toHaveCount(2);
    expect($records->where('resident_id', $resident1->id)->first()->is_active)->toBeFalse();
    expect($records->where('resident_id', $resident2->id)->first()->is_active)->toBeTrue();
});

it('can remove a resident from a house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/remove-resident");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Resident removed from house successfully.',
        ]);

    $record = HouseResident::first();
    expect($record->is_active)->toBeFalse();
    expect($record->end_date)->not->toBeNull();
});

it('returns 404 when removing resident from house with no active resident', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->postJson("/api/houses/{$house->id}/remove-resident");

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'No active resident in this house.',
        ]);
});

it('returns 404 when removing resident from non-existent house', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/houses/999/remove-resident');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'House not found.',
        ]);
});

it('can get house resident history', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $resident1 = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    $resident2 = Resident::create([
        'full_name' => 'Jane Smith',
        'resident_status' => 'contract',
        'phone_number' => '08198765432',
        'marital_status' => false,
    ]);

    HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident1->id,
        'start_date' => '2023-01-01',
        'end_date' => '2023-12-31',
        'is_active' => false,
    ]);

    HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident2->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/houses/{$house->id}/history");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'House resident history retrieved successfully.',
        ])
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'house_id', 'resident_id', 'start_date', 'end_date', 'is_active', 'resident'],
            ],
        ]);

    expect(count($response->json('data')))->toBe(2);
});

it('returns 404 for history of non-existent house', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/houses/999/history');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'House not found.',
        ]);
});

it('shows correct occupancy status for occupied house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);
    $resident = Resident::create([
        'full_name' => 'John Doe',
        'resident_status' => 'permanent',
        'phone_number' => '08123456789',
        'marital_status' => true,
    ]);

    HouseResident::create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'start_date' => '2024-01-01',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/houses/{$house->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.occupancy_status', 'Occupied');
});

it('shows correct occupancy status for vacant house', function () {
    $house = House::create(['house_number' => 'A-01', 'address' => 'Block A No 1']);

    $response = $this->actingAs($this->user)
        ->getJson("/api/houses/{$house->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.occupancy_status', 'Vacant');
});
