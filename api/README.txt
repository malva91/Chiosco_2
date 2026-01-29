API folder (server-side)

1) Edit api/config.php
   - OPENAI_API_KEY
   - ADMIN_TOKEN (long random string)

2) Upload the whole project to your hosting (Apache+PHP).

3) In admin panel -> Traduzioni:
   - Insert the ADMIN_TOKEN in "Token API (admin)"
   - Select a target language
   - Click "Auto-traduci mancanti"

Security note:
- Keep api/config.php private.
- Consider moving api/config.php outside web root and requiring it via absolute path.
