<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id', 'user_id', 'subject_type', 'subject_id',
        'action', 'description', 'properties',
    ];

    protected $casts = ['properties' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    public static function record(string $action, string $description, ?Model $subject = null, array $properties = []): self
    {
        $user = auth()->user();

        return self::create([
            'company_id' => $user?->company_id ?? $subject?->company_id,
            'user_id' => $user?->id,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'action' => $action,
            'description' => $description,
            'properties' => $properties,
        ]);
    }
}