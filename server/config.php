<?php
return [
    'db_host' => getenv('KAMA_DB_HOST') ?: 'localhost',
    'db_name' => getenv('KAMA_DB_NAME') ?: 'kama_app',
    'db_user' => getenv('KAMA_DB_USER') ?: 'kama_user',
    'db_pass' => getenv('KAMA_DB_PASS') ?: 'change-me',
    'db_charset' => 'utf8mb4',

    // Comma-separated allowed origins, e.g. https://ztpgz.github.io,https://app.kama-services.eu
    'allowed_origins' => getenv('KAMA_ALLOWED_ORIGINS') ?: '*',

    // Outgoing mail settings for server/api/mail/send.php
    // Use valid sender on your all-inkl domain, e.g. noreply@kama-services.eu
    'mail_from' => getenv('KAMA_MAIL_FROM') ?: '',
    'mail_reply_to' => getenv('KAMA_MAIL_REPLY_TO') ?: '',

    'session_name' => 'kama_sid',
];
