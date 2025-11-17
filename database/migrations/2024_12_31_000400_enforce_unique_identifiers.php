<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureUniqueIndex('cars', 'cars_number_unique', 'number');
        $this->ensureUniqueIndex('drivers', 'drivers_license_number_unique', 'license_number');
        $this->ensureUniqueIndex('users', 'users_employee_number_unique', 'employee_number');
    }

    public function down(): void
    {
        $this->dropUniqueIndexIfExists('cars', 'cars_number_unique');
        $this->dropUniqueIndexIfExists('drivers', 'drivers_license_number_unique');
        $this->dropUniqueIndexIfExists('users', 'users_employee_number_unique');
    }

    private function ensureUniqueIndex(string $table, string $indexName, string $column): void
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($column, $indexName): void {
            $table->unique($column, $indexName);
        });
    }

    private function dropUniqueIndexIfExists(string $table, string $indexName): void
    {
        if (! $this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($indexName): void {
            $table->dropUnique($indexName);
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        $tableName = $connection->getTablePrefix() . $table;

        if ($driver === 'mysql') {
            $database = $connection->getDatabaseName();

            $result = DB::table('information_schema.statistics')
                ->where('table_schema', $database)
                ->where('table_name', $tableName)
                ->where('index_name', $indexName)
                ->exists();

            return $result;
        }

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$tableName}')");

            foreach ($indexes as $index) {
                if (($index->name ?? '') === $indexName) {
                    return true;
                }
            }

            return false;
        }

        return false;
    }
};
