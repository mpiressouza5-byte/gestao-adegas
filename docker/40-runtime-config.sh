#!/bin/sh
set -eu

# Inject the EasyPanel runtime variables into a small browser-readable file.
# Supabase URL and Publishable key are public client configuration values.
printf 'window.__APP_CONFIG__ = { VITE_SUPABASE_URL: "%s", VITE_SUPABASE_ANON_KEY: "%s" };\n' \
  "${VITE_SUPABASE_URL:-}" \
  "${VITE_SUPABASE_ANON_KEY:-}" \
  > /usr/share/nginx/html/runtime-config.js

echo "Runtime application configuration generated."
