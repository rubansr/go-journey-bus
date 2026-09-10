# NXTIXA Go — Premium Upgrade

The spec is large, so I'll build it in phases, each one fully working inside the existing app (no separate demo pages). Below is what changes and the order.

## Phase 1 — Tamil Nadu network + premium search
- Replace fixed city lists with a real location catalogue (cities, towns, boarding and dropping points) that staff can extend from the portal — no code change needed to add a place or route.
- Search card: From/To autocomplete (Tamil + English names), "use my location", recent places, Today/Tomorrow/calendar, passenger count.
- Results: operator, bus type (AC/Non-AC, sleeper/seater/semi-sleeper), times, duration, fare, seats left, boarding/dropping points, rating, safety badge, live-tracking badge, cancellation policy, plus sort (cheapest, fastest, earliest, latest, top rated) and filters (AC, sleeper, seater, women-friendly, tracking).
- Seed a realistic Tamil Nadu private-bus network: Kanyakumari, Kaliyakkavilai, Nagercoil, Tirunelveli, Tenkasi, Thoothukudi, Madurai, Trichy, Thanjavur, Kumbakonam, Salem, Coimbatore, Vellore, Hosur, Chennai and more, with daily schedules.

## Phase 2 — Booking journey completion
- Full flow: bus → boarding point → dropping point → seat → passenger → review → pay → confirmation → QR ticket.
- Saved passengers, favourite routes, preferred bus type and boarding point; "Quick Book" and "Book Again" for returning travellers.
- Payment recovery: retry without re-entering anything, and an automatic refund case when money is taken but the seat isn't confirmed, with payment/booking/refund status shown.
- Polished empty and error states with useful next actions.

## Phase 3 — Tickets everywhere
- Offline ticket saved on the device (opens without internet), PDF download, print.
- WhatsApp e-ticket delivery plus resend, with email fallback; WhatsApp alerts for confirmation, boarding reminder, delay, arrival, cancellation and refund.
- Notification centre with unread counts and "mark all as read".

## Phase 4 — Safety, tracking, prediction
- Live tracking screen: map with route path, current location, next stop, ETA, trip progress, boarding countdown, bus number and permitted driver info.
- Emergency SOS during an active trip: shares live location with emergency contacts, quick dials for police, ambulance, operator and support.
- Women safety: women-only seat preference, privacy-safe neighbouring-seat hints, verified operator badges, safety rating, reporting.
- Fare prediction: current vs predicted fare, trend graph, book-now/wait advice, fare-drop alerts, clearly labelled as an estimate.

## Phase 5 — Dashboards
- Traveller dashboard: upcoming trips, history, saved passengers, favourite routes, wallet, refunds, notifications, AI picks, saved/offline tickets, payment history, safety centre, emergency contacts, profile settings.
- Admin/operator portal: buses, routes, stops, schedules (incl. recurring), bookings, users, refunds and payment-failure cases, tracking control, analytics (bookings, revenue, popular routes, peak times, occupancy, cancellation/refund/failure rates, fare trends) and revenue reports.

## Phase 6 — Experience polish
- Premium blue/purple/white identity, subtle glass, rounded cards, smooth motion, light/dark memory.
- Mobile bottom navigation (Home, Bookings, Track, AI, Profile) and an "Your trip is active" bar.
- Accessibility: large touch targets, high contrast, clear errors, and an Elderly Friendly Mode that enlarges text and buttons.
- Tamil/English across every screen, including Tanglish typing in search.
- Voice booking: large microphone, Tamil and English speech into a filled-in search and a "Please confirm your journey" review step.

## Phase 7 — AI assistant upgrade
- NXTIXA AI gains the new abilities: fare advice, boarding guidance, tracking answers, budget/comfort/fastest/safest picks, and it can prefill a booking from a Tamil or English sentence.

## Technical notes
- Data model additions: locations, stops, routes, buses with seat layouts, schedules with recurrence, passengers, payments, refunds, notifications, GPS pings, emergency contacts, safety reports, favourite routes, fare history, support cases, audit logs — all with row-level security and role checks (traveller / operator / admin).
- Server work stays in TanStack server functions; WhatsApp sending goes through a provider secret I'll ask for when we reach Phase 3 (until then it falls back to email/SMS-style delivery inside the app).
- Payments remain simulated/wallet-based unless you want a real gateway wired in.

## Open questions
- WhatsApp delivery needs an API account (Twilio or Meta Cloud API). I'll ask for the credentials at Phase 3; without them the ticket still downloads and emails.
- Real map tiles need a Mapbox token; otherwise tracking uses a stylised route-progress map.
