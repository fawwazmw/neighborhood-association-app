<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Expense;
use App\Models\Resident;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ──────────────────────────────────────────────
        // 0. Disable FK checks & truncate all tables
        // ──────────────────────────────────────────────
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        User::truncate();
        Payment::truncate();
        Expense::truncate();
        HouseResident::truncate();
        Resident::truncate();
        House::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ──────────────────────────────────────────────
        // 0a. Create admin user
        // ──────────────────────────────────────────────
        User::create([
            'name'     => 'Administrator',
            'email'    => 'admin@neighborhood.com',
            'password' => Hash::make('password'),
        ]);

        // ──────────────────────────────────────────────
        // 1. Create 20 houses (A1-A10, B1-B10)
        // ──────────────────────────────────────────────
        $houseData = [];
        foreach (['A', 'B'] as $block) {
            for ($i = 1; $i <= 10; $i++) {
                $number = $block . $i;
                $houseData[$number] = House::create([
                    'house_number' => $number,
                    'address'      => "Neighborhood 05, Block {$block} No. {$i}",
                ]);
            }
        }

        // ──────────────────────────────────────────────
        // 2. Create 15 permanent residents
        // ──────────────────────────────────────────────
        $permanentResidents = [
            ['full_name' => 'Budi Santoso',     'phone_number' => '081234567801', 'marital_status' => true],
            ['full_name' => 'Siti Rahayu',      'phone_number' => '081234567802', 'marital_status' => true],
            ['full_name' => 'Ahmad Hidayat',    'phone_number' => '081234567803', 'marital_status' => true],
            ['full_name' => 'Dewi Lestari',     'phone_number' => '081234567804', 'marital_status' => true],
            ['full_name' => 'Eko Prasetyo',     'phone_number' => '081234567805', 'marital_status' => false],
            ['full_name' => 'Fitri Handayani',  'phone_number' => '081234567806', 'marital_status' => true],
            ['full_name' => 'Gunawan Wibowo',   'phone_number' => '081234567807', 'marital_status' => true],
            ['full_name' => 'Hana Permata',     'phone_number' => '081234567808', 'marital_status' => false],
            ['full_name' => 'Irfan Maulana',    'phone_number' => '081234567809', 'marital_status' => true],
            ['full_name' => 'Joko Widodo',      'phone_number' => '081234567810', 'marital_status' => true],
            ['full_name' => 'Kartini Sari',     'phone_number' => '081234567811', 'marital_status' => true],
            ['full_name' => 'Lukman Hakim',     'phone_number' => '081234567812', 'marital_status' => false],
            ['full_name' => 'Maya Anggraini',   'phone_number' => '081234567813', 'marital_status' => true],
            ['full_name' => 'Nur Fadilah',      'phone_number' => '081234567814', 'marital_status' => true],
            ['full_name' => 'Oscar Pratama',    'phone_number' => '081234567815', 'marital_status' => false],
        ];

        $permanentResidentModels = [];
        foreach ($permanentResidents as $data) {
            $permanentResidentModels[] = Resident::create(array_merge($data, [
                'resident_status' => 'permanent',
            ]));
        }

        // ──────────────────────────────────────────────
        // 3. Create 3 contract residents
        // ──────────────────────────────────────────────
        $contractResidents = [
            ['full_name' => 'Putri Ayu',       'phone_number' => '081234567816', 'marital_status' => false],
            ['full_name' => 'Qori Ramadhan',   'phone_number' => '081234567817', 'marital_status' => true],
            ['full_name' => 'Rini Susanti',    'phone_number' => '081234567818', 'marital_status' => false],
        ];

        $contractResidentModels = [];
        foreach ($contractResidents as $data) {
            $contractResidentModels[] = Resident::create(array_merge($data, [
                'resident_status' => 'contract',
            ]));
        }

        // ──────────────────────────────────────────────
        // 4. Assign 15 permanent residents → A1-A10, B1-B5
        // ──────────────────────────────────────────────
        $permanentHouses = [
            'A1', 'A2', 'A3', 'A4', 'A5',
            'A6', 'A7', 'A8', 'A9', 'A10',
            'B1', 'B2', 'B3', 'B4', 'B5',
        ];

        $permanentHouseResidents = [];
        foreach ($permanentHouses as $index => $houseNumber) {
            $permanentHouseResidents[] = HouseResident::create([
                'house_id'    => $houseData[$houseNumber]->id,
                'resident_id' => $permanentResidentModels[$index]->id,
                'start_date'  => '2023-01-01',
                'end_date'    => null,
                'is_active'   => true,
            ]);
        }

        // ──────────────────────────────────────────────
        // 5. Assign 3 contract residents → B6, B7, B8
        // ──────────────────────────────────────────────
        $contractHouses = ['B6', 'B7', 'B8'];

        $contractHouseResidents = [];
        foreach ($contractHouses as $index => $houseNumber) {
            $contractHouseResidents[] = HouseResident::create([
                'house_id'    => $houseData[$houseNumber]->id,
                'resident_id' => $contractResidentModels[$index]->id,
                'start_date'  => '2024-06-01',
                'end_date'    => null,
                'is_active'   => true,
            ]);
        }

        // B9 and B10 remain empty — no assignment needed.

        // ──────────────────────────────────────────────
        // 6. Generate payment records for 2024
        // ──────────────────────────────────────────────
        $feeTypes = [
            'security' => 100000,
            'cleaning' => 15000,
        ];

        // 6a. Permanent residents — full year (Jan–Dec 2024)
        foreach ($permanentHouseResidents as $hr) {
            for ($month = 1; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    $isPaid = $month <= 10;

                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => 2024,
                        'amount'            => $amount,
                        'status'            => $isPaid ? 'paid' : 'unpaid',
                        'payment_date'      => $isPaid
                            ? sprintf('2024-%02d-10', $month)
                            : null,
                    ]);
                }
            }
        }

        // 6b. Contract residents — June–Dec 2024 only
        foreach ($contractHouseResidents as $hr) {
            for ($month = 6; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    $isPaid = $month <= 10;

                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => 2024,
                        'amount'            => $amount,
                        'status'            => $isPaid ? 'paid' : 'unpaid',
                        'payment_date'      => $isPaid
                            ? sprintf('2024-%02d-10', $month)
                            : null,
                    ]);
                }
            }
        }

        // ──────────────────────────────────────────────
        // 7. Generate expense records for 2024
        // ──────────────────────────────────────────────

        // 7a. Monthly recurring — Security Guard Salary (28th of each month)
        for ($month = 1; $month <= 12; $month++) {
            Expense::create([
                'category'     => 'Operational',
                'description'  => 'Security Guard Salary',
                'amount'       => 1500000,
                'date'         => sprintf('2024-%02d-28', $month),
                'is_recurring' => true,
            ]);
        }

        // 7b. Monthly recurring — Guard Post Electricity Token (1st of each month)
        for ($month = 1; $month <= 12; $month++) {
            Expense::create([
                'category'     => 'Utilities',
                'description'  => 'Guard Post Electricity Token',
                'amount'       => 200000,
                'date'         => sprintf('2024-%02d-01', $month),
                'is_recurring' => true,
            ]);
        }

        // 7c. One-time expenses
        $oneTimeExpenses = [
            ['category' => 'Repair',       'description' => 'Road Repair',          'amount' => 2500000, 'date' => '2024-03-15'],
            ['category' => 'Repair',       'description' => 'Drainage Repair',      'amount' => 1800000, 'date' => '2024-07-20'],
            ['category' => 'Maintenance',  'description' => 'Guard Post Painting',  'amount' => 500000,  'date' => '2024-05-10'],
            ['category' => 'Repair',       'description' => 'Street Light Repair',  'amount' => 750000,  'date' => '2024-09-05'],
        ];

        foreach ($oneTimeExpenses as $expense) {
            Expense::create(array_merge($expense, [
                'is_recurring' => false,
            ]));
        }

        // ──────────────────────────────────────────────
        // Summary
        // ──────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════╗');
        $this->command->info('║  Neighborhood Admin Seeder Complete!         ║');
        $this->command->info('╠══════════════════════════════════════════════╣');
        $this->command->info('║  Houses          : ' . House::count() . ' houses                ║');
        $this->command->info('║  Residents       : ' . Resident::count() . ' residents             ║');
        $this->command->info('║    - Permanent   : ' . Resident::where('resident_status', 'permanent')->count() . ' permanent            ║');
        $this->command->info('║    - Contract    : ' . Resident::where('resident_status', 'contract')->count() . ' contract              ║');
        $this->command->info('║  HouseResidents  : ' . HouseResident::count() . ' assignments          ║');
        $this->command->info('║  Payments        : ' . Payment::count() . ' payment records      ║');
        $this->command->info('║    - Paid        : ' . Payment::where('status', 'paid')->count() . '                         ║');
        $this->command->info('║    - Unpaid      : ' . Payment::where('status', 'unpaid')->count() . '                          ║');
        $this->command->info('║  Expenses        : ' . Expense::count() . ' expense records      ║');
        $this->command->info('╠══════════════════════════════════════════════╣');
        $this->command->info('║  Admin Login:                                ║');
        $this->command->info('║    Email    : admin@neighborhood.com         ║');
        $this->command->info('║    Password : password                       ║');
        $this->command->info('╚══════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
