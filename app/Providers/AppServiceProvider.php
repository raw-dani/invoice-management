<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        spl_autoload_register(function ($class) {
            if (str_starts_with($class, 'OneLogin\\')) {
                $relative = substr($class, 9);
                $file = base_path('vendor/onelogin/php-saml/src/' . str_replace('\\', '/', $relative) . '.php');
                if (file_exists($file)) {
                    require_once $file;
                }
            } elseif (str_starts_with($class, 'RobRichards\\XMLSecLibs\\')) {
                $relative = substr($class, 22);
                $file = base_path('vendor/robrichards/xmlseclibs/src/' . str_replace('\\', '/', $relative) . '.php');
                if (file_exists($file)) {
                    require_once $file;
                }
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);
    }
}
