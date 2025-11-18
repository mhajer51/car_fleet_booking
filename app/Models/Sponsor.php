<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sponsor extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'traffic_file_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
