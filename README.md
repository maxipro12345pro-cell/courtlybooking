# PadelPoint Booking

Lightweight online booking module for the PadelPoint indoor padel club.

This repository is focused on one flow:

1. Select a date.
2. Select one of 9 indoor courts.
3. Select a 1-hour slot.
4. Create a temporary booking hold.
5. Proceed to checkout.
6. Pay and confirm the booking.

## Product scope

- Single-club booking system for PadelPoint.
- 9 indoor courts total:
  - 6 blue courts
  - 3 terracotta courts
- Fixed price: `500 MDL / hour`.
- Fixed slot duration: `60 minutes`.
- Opening hours: `07:00–22:00`.
- Payment is required before booking confirmation.
- Payment layer is provider-agnostic and ready to replace the mock provider.
- CRM fields are prepared for future amoCRM integration.

## Routes

- `/` — booking entry page
- `/booking` — booking module
- `/checkout?bookingId=...` — payment checkout
- `/payment-success` — successful payment confirmation
- `/api/payments/create` — create mock payment
- `/api/payments/confirm` — confirm mock payment
- `/api/payments/webhook` — future webhook endpoint
- `/api/payments/refund` — refund placeholder

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Project structure

```txt
app/
  api/payments/       Payment API routes
  booking/            Booking page and client flow
  checkout/           Checkout page and payment UI
  payment-success/    Confirmation page
components/
  booking/            Interactive court map and schedule
  layout/             Minimal booking shell
  ui/                 Brand UI
lib/
  domain/             Club config and domain types
  payments/           Provider abstraction and mock service
```

## Brand note

Place the real logo in:

```txt
public/brand/padelpoint-logo.svg
```

Then update `components/ui/BrandLogo.tsx` to render the image instead of the temporary `PP` mark.
