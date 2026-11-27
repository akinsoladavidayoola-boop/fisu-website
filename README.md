# FISU Official Website Starter Package

This is an editable, mobile-friendly website starter for the Federation of Ifaki Students' Union.

## Included
- `index.html` — public website and admin portal interface
- `styles.css` — branding and responsive layout
- `app.js` — Supabase login, role check, and content manager
- `config.js` — place to add the Supabase Project URL and publishable key
- `schema.sql` — database tables and Row Level Security policies

## 1. Connect your Supabase project
1. Open `config.js` in a text editor.
2. Replace `(https://pezpkbtkmosllflwfxsg.supabase.co/rest/v1/)` with your Supabase Project URL.
3. Replace `sb_publishable_vIRu3tcG9XBZfzy3pYnRLg_s5jrTN8n` with the publishable key (or legacy anon key).
4. Save the file.

Only use the public publishable/anon key here. NEVER use the `service_role` key, database password, or secret key in browser code.

## 2. Database
Your `user_roles` table and first `super_admin` role were already created during setup. If starting over on a fresh project, run `schema.sql` in Supabase SQL Editor. If the tables already exist, do not blindly rerun conflicting older SQL; review the statements first.

The admin portal checks `user_roles` for the signed-in user's role. Content editing is protected by Supabase Row Level Security policies. Only authorised users with a role in `user_roles` can create, edit or delete site content.

## 3. Test on your computer
Open `index.html` in a modern browser after setting `config.js`. For best results, serve the folder with a local static web server rather than opening as a file. The site uses Supabase JS from a CDN and Google Fonts, so an internet connection is needed.

## 4. Publish online
Upload the complete folder to a static hosting provider such as Netlify, Vercel, or your web host. Connect your chosen domain `fisu.org.ng` after hosting is configured. The domain must first be registered and its DNS records configured with the hosting provider.

## 5. Add website content
1. Open the published website and choose **Admin**.
2. Sign in with the FISU admin email and password you created in Supabase Authentication.
3. Add content under News, Leadership, Projects, or Resources.
4. Tick “Publish this content” to make it visible publicly.
5. Use Edit or Delete in the content manager to maintain entries.

## Important limitations in this starter
- This is a working first version, not yet a live website. It has not been deployed to `fisu.org.ng`.
- Content is stored in Supabase; uploaded image files are not yet supported. Use public image URLs for now.
- The initial content manager covers news, leadership, projects, and resources. Dedicated elections, Miss Ifaki, gallery uploads, document library, contact submissions, and multi-admin management can be added as later modules.
- Keep admin passwords private. Enable email confirmation and strong passwords according to your organisation's security policy.
