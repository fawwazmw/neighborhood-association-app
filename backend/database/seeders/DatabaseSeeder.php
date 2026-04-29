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
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = Carbon::now(config('app.timezone', 'UTC'));
        $currentYear = $now->year;
        $currentMonth = $now->month;
        $lastYear = $currentYear - 1;

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
        //    (moved in at start of last year)
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
                'start_date'  => "{$lastYear}-01-01",
                'end_date'    => null,
                'is_active'   => true,
            ]);
        }

        // ──────────────────────────────────────────────
        // 5. Assign 3 contract residents → B6, B7, B8
        //    (moved in June of last year)
        // ──────────────────────────────────────────────
        $contractHouses = ['B6', 'B7', 'B8'];

        $contractHouseResidents = [];
        foreach ($contractHouses as $index => $houseNumber) {
            $contractHouseResidents[] = HouseResident::create([
                'house_id'    => $houseData[$houseNumber]->id,
                'resident_id' => $contractResidentModels[$index]->id,
                'start_date'  => "{$lastYear}-06-01",
                'end_date'    => null,
                'is_active'   => true,
            ]);
        }

        // B9 and B10 remain empty — no assignment needed.

        // ──────────────────────────────────────────────
        // 6. Fee amounts
        // ──────────────────────────────────────────────
        $feeTypes = [
            'security' => 100000,
            'cleaning' => 15000,
        ];

        // ──────────────────────────────────────────────
        // 7. Payments for LAST YEAR (full year, all paid)
        // ──────────────────────────────────────────────
        foreach ($permanentHouseResidents as $hr) {
            for ($month = 1; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => $lastYear,
                        'amount'            => $amount,
                        'status'            => 'paid',
                        'payment_date'      => sprintf('%d-%02d-10', $lastYear, $month),
                    ]);
                }
            }
        }

        // Contract residents — June-Dec last year (all paid)
        foreach ($contractHouseResidents as $hr) {
            for ($month = 6; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => $lastYear,
                        'amount'            => $amount,
                        'status'            => 'paid',
                        'payment_date'      => sprintf('%d-%02d-10', $lastYear, $month),
                    ]);
                }
            }
        }

        // ──────────────────────────────────────────────
        // 8. Payments for CURRENT YEAR
        //    - Past months: paid
        //    - Current month: mix (some paid, some unpaid)
        //    - Future months: unpaid bills generated
        // ──────────────────────────────────────────────

        // 8a. Permanent residents — full year
        foreach ($permanentHouseResidents as $idx => $hr) {
            for ($month = 1; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    if ($month < $currentMonth) {
                        // Past months — all paid
                        $status = 'paid';
                        $paymentDate = sprintf('%d-%02d-10', $currentYear, $month);
                    } elseif ($month === $currentMonth) {
                        // Current month — first 10 residents paid, rest unpaid
                        $status = $idx < 10 ? 'paid' : 'unpaid';
                        $paymentDate = $status === 'paid'
                            ? sprintf('%d-%02d-%02d', $currentYear, $month, min($now->day, 28))
                            : null;
                    } else {
                        // Future months — unpaid bills
                        $status = 'unpaid';
                        $paymentDate = null;
                    }

                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => $currentYear,
                        'amount'            => $amount,
                        'status'            => $status,
                        'payment_date'      => $paymentDate,
                    ]);
                }
            }
        }

        // 8b. Contract residents — full year current year
        foreach ($contractHouseResidents as $idx => $hr) {
            for ($month = 1; $month <= 12; $month++) {
                foreach ($feeTypes as $type => $amount) {
                    if ($month < $currentMonth) {
                        $status = 'paid';
                        $paymentDate = sprintf('%d-%02d-10', $currentYear, $month);
                    } elseif ($month === $currentMonth) {
                        // First 2 contract residents paid, last one unpaid
                        $status = $idx < 2 ? 'paid' : 'unpaid';
                        $paymentDate = $status === 'paid'
                            ? sprintf('%d-%02d-%02d', $currentYear, $month, min($now->day, 28))
                            : null;
                    } else {
                        $status = 'unpaid';
                        $paymentDate = null;
                    }

                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'fee_type'          => $type,
                        'month'             => $month,
                        'year'              => $currentYear,
                        'amount'            => $amount,
                        'status'            => $status,
                        'payment_date'      => $paymentDate,
                    ]);
                }
            }
        }

        // ──────────────────────────────────────────────
        // 9. Expenses for LAST YEAR
        // ──────────────────────────────────────────────

        // Monthly recurring — Security Guard Salary
        for ($month = 1; $month <= 12; $month++) {
            Expense::create([
                'category'     => 'Operational',
                'description'  => 'Security Guard Salary',
                'amount'       => 1500000,
                'date'         => sprintf('%d-%02d-28', $lastYear, $month),
                'is_recurring' => true,
            ]);
        }

        // Monthly recurring — Guard Post Electricity Token
        for ($month = 1; $month <= 12; $month++) {
            Expense::create([
                'category'     => 'Utilities',
                'description'  => 'Guard Post Electricity Token',
                'amount'       => 200000,
                'date'         => sprintf('%d-%02d-01', $lastYear, $month),
                'is_recurring' => true,
            ]);
        }

        // One-time expenses last year
        Expense::create(['category' => 'Repair',      'description' => 'Road Repair',          'amount' => 2500000, 'date' => "{$lastYear}-03-15", 'is_recurring' => false]);
        Expense::create(['category' => 'Repair',      'description' => 'Drainage Repair',      'amount' => 1800000, 'date' => "{$lastYear}-07-20", 'is_recurring' => false]);
        Expense::create(['category' => 'Maintenance', 'description' => 'Guard Post Painting',  'amount' => 500000,  'date' => "{$lastYear}-05-10", 'is_recurring' => false]);
        Expense::create(['category' => 'Repair',      'description' => 'Street Light Repair',  'amount' => 750000,  'date' => "{$lastYear}-09-05", 'is_recurring' => false]);

        // ──────────────────────────────────────────────
        // 10. Expenses for CURRENT YEAR (up to current month)
        // ──────────────────────────────────────────────

        // Monthly recurring — Security Guard Salary (up to current month)
        for ($month = 1; $month <= $currentMonth; $month++) {
            $day = $month === $currentMonth ? min($now->day, 28) : 28;
            Expense::create([
                'category'     => 'Operational',
                'description'  => 'Security Guard Salary',
                'amount'       => 1500000,
                'date'         => sprintf('%d-%02d-%02d', $currentYear, $month, $day),
                'is_recurring' => true,
            ]);
        }

        // Monthly recurring — Guard Post Electricity Token (up to current month)
        for ($month = 1; $month <= $currentMonth; $month++) {
            Expense::create([
                'category'     => 'Utilities',
                'description'  => 'Guard Post Electricity Token',
                'amount'       => 200000,
                'date'         => sprintf('%d-%02d-01', $currentYear, $month),
                'is_recurring' => true,
            ]);
        }

        // One-time expenses current year (scattered in past months)
        if ($currentMonth >= 2) {
            Expense::create(['category' => 'Repair',      'description' => 'Fence Repair',           'amount' => 1200000, 'date' => "{$currentYear}-02-12", 'is_recurring' => false]);
        }
        if ($currentMonth >= 3) {
            Expense::create(['category' => 'Maintenance', 'description' => 'Garden Maintenance',     'amount' => 350000,  'date' => "{$currentYear}-03-08", 'is_recurring' => false]);
        }
        if ($currentMonth >= 4) {
            Expense::create(['category' => 'Repair',      'description' => 'Water Pipe Repair',      'amount' => 800000,  'date' => "{$currentYear}-04-22", 'is_recurring' => false]);
        }

        // ──────────────────────────────────────────────
        // Summary
        // ──────────────────────────────────────────────
        $paidCount = Payment::where('status', 'paid')->count();
        $unpaidCount = Payment::where('status', 'unpaid')->count();

        $this->command->info('');
        $this->command->info('╔═══════════════════════════════════════════════════╗');
        $this->command->info('║  Neighborhood Admin Seeder Complete!              ║');
        $this->command->info('╠═══════════════════════════════════════════════════╣');
        $this->command->info('║  Data seeded for: ' . $lastYear . ' & ' . $currentYear . '                       ║');
        $this->command->info('║  Current month  : ' . $now->format('F Y') . str_repeat(' ', max(0, 22 - strlen($now->format('F Y')))) . '║');
        $this->command->info('╠═══════════════════════════════════════════════════╣');
        $this->command->info('║  Houses         : ' . str_pad(House::count(), 4) . '                            ║');
        $this->command->info('║  Residents      : ' . str_pad(Resident::count(), 4) . '(15 permanent, 3 contract)  ║');
        $this->command->info('║  Assignments    : ' . str_pad(HouseResident::count(), 4) . '                            ║');
        $this->command->info('║  Payments       : ' . str_pad(Payment::count(), 4) . '(' . $paidCount . ' paid, ' . $unpaidCount . ' unpaid)' . str_repeat(' ', max(0, 10 - strlen((string)$paidCount) - strlen((string)$unpaidCount))) . '║');
        $this->command->info('║  Expenses       : ' . str_pad(Expense::count(), 4) . '                            ║');
        $this->command->info('╠═══════════════════════════════════════════════════╣');
        $this->command->info('║  Admin Login:                                    ║');
        $this->command->info('║    Email    : admin@neighborhood.com              ║');
        $this->command->info('║    Password : password                            ║');
        $this->command->info('╚═══════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
