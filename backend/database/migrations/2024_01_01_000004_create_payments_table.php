<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_resident_id')->constrained('house_residents')->cascadeOnDelete();
            $table->enum('fee_type', ['security', 'cleaning']);
            $table->tinyInteger('month');
            $table->integer('year');
            $table->decimal('amount', 12, 2);
            $table->date('payment_date')->nullable();
            $table->enum('status', ['paid', 'unpaid'])->default('unpaid');
            $table->timestamps();

            $table->unique(['house_resident_id', 'fee_type', 'month', 'year'], 'payment_unique_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
