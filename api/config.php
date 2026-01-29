<?php
/**
 * API config (server-side only)
 *
 * IMPORTANT:
 * - Do NOT expose this file publicly.
 * - Keep it outside web root if possible.
 */

declare(strict_types=1);

// OpenAI
const OPENAI_API_KEY = '***********';
const OPENAI_MODEL   = 'gpt-4o-mini';

// Simple admin token to protect endpoints.
// Set a long random string.
const ADMIN_TOKEN    = '01';

// Safety limits
const MAX_ITEMS_PER_REQUEST = 80;          // max items per translate call
const MAX_CHARS_PER_REQUEST = 12000;       // max total input characters

