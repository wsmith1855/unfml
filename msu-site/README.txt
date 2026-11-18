SETUP (10 minutes)

1. COMMENT FORM KEY
   - Go to web3forms.com and create a free access key using an anonymous email address that is not tied to you.
   - In the Web3Forms dashboard, turn on hCaptcha for that form (this is the bot check).
   - Open voices.html and replace YOUR_ACCESS_KEY_HERE with your key.
   - Until you do, the form shows an "unavailable" message and sends nothing.
   - Free plan limit: 250 submissions per month.

2. PUBLISHING A COMMENT
   - Submissions arrive in your private inbox. Nothing posts automatically.
   - To publish one, open assets/comments.js and add an entry to window.COMMENTS (an example is in the file). Save and re-upload.
   - Moderation checklist: remove names of private individuals, contact info, confidential info, harassment, and anything that could identify the writer.

3. HOSTING
   - Plain static files, relative paths. Works on GitHub Pages, Netlify, Cloudflare Pages.
   - Use an account and email not linked to you. Strip file metadata before uploading.
   - Share buttons use the page's real address once deployed.

PRIVACY NOTE
   - The site makes no outside requests on load. The hCaptcha script loads only when someone clicks "Write a comment".
