<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'logo',
        'signature',
        'stamp',
        'qris',
        'address',
        'city',
        'province',
        'country',
        'phone',
        'email',
        'website',
        'tax_number',
        'authorized_signer_name',
        'authorized_signer_title',
        'show_signature_on_pdf',
        'show_stamp_on_pdf',
        'show_qris_on_pdf',
        'show_paid_watermark',
    ];

    protected $casts = [
        'show_signature_on_pdf' => 'boolean',
        'show_stamp_on_pdf'     => 'boolean',
        'show_qris_on_pdf'      => 'boolean',
        'show_paid_watermark'   => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function toImageDataUri(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, 'data:')) return $path;

        // Check storage/app/public/
        if (Storage::disk('public')->exists($path)) {
            $diskPath = Storage::disk('public')->path($path);
            $type = pathinfo($diskPath, PATHINFO_EXTENSION) ?: 'png';
            $data = file_get_contents($diskPath);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        // Check public_path
        $cleanPath = ltrim(str_replace(['/storage/', 'storage/'], '', $path), '/');
        if (Storage::disk('public')->exists($cleanPath)) {
            $diskPath = Storage::disk('public')->path($cleanPath);
            $type = pathinfo($diskPath, PATHINFO_EXTENSION) ?: 'png';
            $data = file_get_contents($diskPath);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        return null;
    }

    public function getLogoDataUriAttribute(): ?string
    {
        return $this->toImageDataUri($this->logo);
    }

    public function getSignatureDataUriAttribute(): ?string
    {
        return $this->toImageDataUri($this->signature);
    }

    public function getStampDataUriAttribute(): ?string
    {
        return $this->toImageDataUri($this->stamp);
    }

    public function getQrisDataUriAttribute(): ?string
    {
        return $this->toImageDataUri($this->qris);
    }
}
