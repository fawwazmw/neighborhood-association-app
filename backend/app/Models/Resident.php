<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Resident extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'residents';

    /**
     * The attributes that are mass assignable.
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'id_photo',
        'resident_status',
        'phone_number',
        'marital_status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'marital_status' => 'boolean',
        ];
    }

    /**
     * Get all house_resident records for this resident.
     */
    public function houseResidents(): HasMany
    {
        return $this->hasMany(HouseResident::class);
    }

    /**
     * The houses that belong to this resident.
     */
    public function houses(): BelongsToMany
    {
        return $this->belongsToMany(House::class, 'house_residents')
            ->withPivot('start_date', 'end_date', 'is_active')
            ->withTimestamps();
    }
}
