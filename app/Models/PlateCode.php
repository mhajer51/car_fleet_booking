<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlateCode extends Model
{
    use HasFactory;

    protected $fillable = ['plate_category_id', 'title'];

    public function category()
    {
        return $this->belongsTo(PlateCategory::class, 'plate_category_id');
    }
}
