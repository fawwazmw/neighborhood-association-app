<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class House extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'houses';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'house_number',
        'address',
    ];

    /**
     * Get all house_resident records for this house.
     */
    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    /**
     * The residents that belong to this house.
     */
    public function residents(): BelongsToMany
    {
        return $this->belongsToMany(Resident::class, 'house_residents')
            ->withPivot('start_date', 'end_date', 'is_active')
            ->withTimestamps();
    }

    /**
     * Get the current active resident of this house.
     */
    public function activeResident()
    {
        return $this->houseResidents()
            ->where('is_active', true)
            ->with('resident')
            ->first();
    }

    /**
     * Get the occupancy status of this house.
     */
    protected function occupancyStatus(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->houseResidents()->where('is_active', true)->exists()
                ? 'Occupied'
                : 'Vacant',
        );
    }
}
