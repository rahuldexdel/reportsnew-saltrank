<?php
require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

while (true) {
    echo "[".date('H:i:s')."] Running sync:search-console\n";
    $kernel->call('sync:search-console');
     sleep(120);
}
