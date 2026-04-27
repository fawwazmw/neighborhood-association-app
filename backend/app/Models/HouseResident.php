<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HouseResident extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'house_residents';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'house_id',
        'resident_id',
        'start_date',
        'end_date',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Get the house that this record belongs to.
     */
    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    /**
     * Get the resident that this record belongs to.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /**
     * Get all payments for this house_resident.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
