## Goal
Make the footer "Contact" column consistent and reliable across devices: WhatsApp opens correctly (no blocked page on PC), Instagram shows the @handle next to the icon, and all items share the same row style.

## Notes on the "blocked" screenshot
The pasted HTML (`api.whatsapp.com` with the Chromium error page) is a network-level block on your PC (Edge / corporate / antivirus / DNS filter blocking `api.whatsapp.com` and `wa.me`). It's not a bug in the site — your phone works because it isn't filtered. We cannot bypass a network block from the website, but we can switch to a link format that's less commonly filtered and also expose the raw phone number so users always have a fallback.

## Changes

### 1. Footer "Get in touch" column (`src/components/Footer.tsx`)
Restructure so every row uses the same icon-style and spacing (icon + label/number). Remove the standalone "WhatsApp" word row.

Rows (in order):
- **Phone** — `Phone` icon + `+971 54 444 4518` → `tel:+971544444518`
- **WhatsApp** — `MessageCircle` icon (lucide) + `+971 54 444 4518` → switch link from `https://wa.me/...` to `https://api.whatsapp.com/send?phone=971544444518&text=...` (some PC filters block `wa.me` short-link redirector but allow the full URL). Open in new tab.
- **Email** — `Mail` icon + `dyarree@gmail.com`
- **Location** — `MapPin` icon + `Abu Dhabi, UAE`
- **Instagram** — Render directly in this column (not via `<SocialIcons />`) using the same row pattern: Instagram glyph icon + `@dyarree` text, linking to `https://www.instagram.com/dyarree`. Keep the same `text-sm opacity-70 hover:opacity-100` styling as the other rows so it matches visually.

Remove the separate `<SocialIcons className="mt-2" />` from the contact column so the styling is uniform. (Other pages that use `SocialIcons`, e.g. Contact page, are unchanged.)

### 2. Contact page (`src/pages/Contact.tsx`)
Apply the same WhatsApp change: button link becomes `https://api.whatsapp.com/send?phone=971544444518&text=Hi%2C%20I%20have%20a%20question`. Keep the existing wording/icon for the green CTA button (it's a primary action, not a contact-info row).

### 3. Property details "Contact agent" WhatsApp (if present)
Audit `src/pages/PropertyDetails.tsx` for `wa.me` and migrate to the `api.whatsapp.com/send` form with the prefilled "asking about listed property #DYR-XXXX" message that's already there.

## Out of scope
- The PC-side block itself (network/AV/DNS). If `api.whatsapp.com` is also blocked on that machine, no link change can help — only disabling the filter on the user's PC will.
- No changes to admin settings, DB, or other pages.
