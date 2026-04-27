<?php

use App\Models\User;

it('can login with valid credentials', function () {
    $user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $response = $this->withHeaders([
            'Origin' => 'http://localhost',
            'Referer' => 'http://localhost',
        ])
        ->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Login successful.',
        ])
        ->assertJsonStructure([
            'success',
            'data' => ['id', 'name', 'email'],
            'message',
        ]);
});

it('cannot login with invalid credentials', function () {
    User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $response = $this->withHeaders([
            'Origin' => 'http://localhost',
            'Referer' => 'http://localhost',
        ])
        ->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrongpassword',
        ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Invalid email or password.',
        ]);
});

it('validates login request requires email', function () {
    $response = $this->postJson('/api/login', [
        'password' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.email', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates login request requires password', function () {
    $response = $this->postJson('/api/login', [
        'email' => 'admin@example.com',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonPath('data.password', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('validates login request requires valid email format', function () {
    $response = $this->postJson('/api/login', [
        'email' => 'not-an-email',
        'password' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('data.email', fn ($errors) => is_array($errors) && count($errors) > 0);
});

it('can logout', function () {
    $user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $response = $this->actingAs($user)
        ->withHeaders([
            'Origin' => 'http://localhost',
            'Referer' => 'http://localhost',
        ])
        ->postJson('/api/logout');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
});

it('can get authenticated user', function () {
    $user = User::create([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/user');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'User retrieved successfully.',
            'data' => [
                'id' => $user->id,
                'name' => 'Admin',
                'email' => 'admin@example.com',
            ],
        ]);
});

it('blocks unauthenticated access to protected routes', function () {
    $response = $this->getJson('/api/residents');

    $response->assertStatus(401);
});

it('blocks unauthenticated access to user endpoint', function () {
    $response = $this->getJson('/api/user');

    $response->assertStatus(401);
});

it('blocks unauthenticated access to logout', function () {
    $response = $this->postJson('/api/logout');

    $response->assertStatus(401);
});
