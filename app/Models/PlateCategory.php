<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlateCategory extends Model
{
    use HasFactory;

    protected $fillable = ['plate_source_id', 'title'];

    public function source()
    {
        return $this->belongsTo(PlateSource::class, 'plate_source_id');
    }

    public function codes()
    {
        return $this->hasMany(PlateCode::class, 'plate_category_id');
    }
}
