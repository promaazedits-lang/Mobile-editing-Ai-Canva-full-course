# CapCut Mobile Editing Masterclass: landing page + course dashboard

## 1. Run
Requires Node 18+.
    npm install
    npm run dev      # http://localhost:5173
    npm run build    # production build in /dist (also type-checks)

## 2. Name, logo, photo
- Name, brand, price, bio, bonus, policies: `src/config.ts`
- Photo: put `instructor.jpg` in `/public`, set `instructorPhoto: "/instructor.jpg"` in `src/config.ts`
- Logo: text brand name is used; replace `public/favicon.svg` for the favicon. Add `public/og-image.png` (1200x630) for link previews.
- Page title/meta: `index.html` (replace [YOUR BRAND NAME])
- Instructor detail boxes and testimonials: `Instructor` and `Testimonials` in `src/components/Landing.tsx`

## 3. Payment link
`paymentLink` in `src/config.ts`. Every CTA uses it via `src/lib/payment.ts`.
Payment is NOT integrated. For Razorpay: create a Payment Link/Page and paste the URL. For full checkout, edit `src/lib/payment.ts`.

## 4. Social links
`socials` and `legal` in `src/config.ts` (WhatsApp: `https://wa.me/91XXXXXXXXXX`).

## 5. Deploy
Netlify/Vercel/Cloudflare Pages: connect the repo, build `npm run build`, output `dist`.
Or upload the `dist` folder to any static host.

## Dashboard
Preview at `/#/dashboard`. Video slots, durations and progress (saved in the browser only) are placeholders. Before selling, protect it with real login/payment verification (e.g. Teachable, Graphy, Podia, or your own backend). Do not treat this page as access control.

## Backend (added)
    cp .env.example .env   # fill in values
    npm install
    npm run server         # API on :3001
    npm run dev            # site on :5173 (proxies /api)
Production: `npm run build`, then `NODE_ENV=production npm start` (serves API + site together; needs HTTPS and a host with a persistent disk for `data.db`).
The email in `ADMIN_EMAIL` becomes admin when it signs up. Razorpay webhook URL: `https://YOURDOMAIN/api/pay/webhook`, event `payment.captured`.

## Videos (Bunny Stream)
Create a Bunny Stream video library, switch on **Security > Embed View Token Authentication**, and put `BUNNY_LIBRARY_ID`, `BUNNY_STREAM_API_KEY` and `BUNNY_TOKEN_KEY` in `.env` (on Render: Environment). In the Admin panel (`/#/admin`) open a lesson and use "Upload video file" (progress bar; the Bunny Stream Video ID is filled in automatically), or paste an existing Bunny Stream Video ID. Playback links are signed by the server, expire after 2 hours and are only issued to enrolled students.

## Login and signup (Gmail)
Email + password signup works with any email, Gmail included. For a one-tap **Continue with Google** button: Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID > Web application. Under "Authorized JavaScript origins" add your site address (for example https://your-site.onrender.com). Copy the Client ID into the `GOOGLE_CLIENT_ID` environment variable. No client secret is needed. If the variable is empty, the button simply does not appear.

The site needs the Node server (`npm start`) to log anyone in. Static hosts such as Vercel or Netlify cannot run it, which is why login/signup fail there.
