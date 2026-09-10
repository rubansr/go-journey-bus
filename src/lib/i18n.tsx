import * as React from "react";

export type Lang = "en" | "ta";

type Dict = Record<string, { en: string; ta: string }>;

const dict: Dict = {
  wallet: { en: "Wallet", ta: "வாலட்" },
  wallet_sub: { en: "Add money once, book in one tap and get refunds instantly.", ta: "ஒரு முறை பணம் சேர்த்து, ஒரே தட்டில் முன்பதிவு செய்யுங்கள்." },
  wallet_balance: { en: "Wallet balance", ta: "வாலட் இருப்பு" },
  wallet_note: { en: "Refunds land here instantly — no bank waiting time.", ta: "பணத்திரும்பம் உடனே இங்கே வரும்." },
  add_money: { en: "Add money", ta: "பணம் சேர்" },
  amount: { en: "Amount", ta: "தொகை" },
  enter_amount: { en: "Enter a valid amount", ta: "சரியான தொகையை உள்ளிடவும்" },
  added_to_wallet: { en: "added to your wallet", ta: "வாலட்டில் சேர்க்கப்பட்டது" },
  demo_payment: { en: "Demo top-up — no real money is charged.", ta: "டெமோ பணம் — உண்மையான கட்டணம் இல்லை." },
  transactions: { en: "Transaction history", ta: "பரிவர்த்தனை வரலாறு" },
  no_transactions: { en: "No transactions yet.", ta: "இதுவரை பரிவர்த்தனை இல்லை." },
  use_wallet: { en: "Pay using wallet", ta: "வாலட் மூலம் செலுத்து" },
  paid_from_wallet: { en: "Paid from wallet", ta: "வாலட்டில் இருந்து செலுத்தியது" },
  payable_now: { en: "Payable now", ta: "இப்போது செலுத்த வேண்டியது" },
  live_tracking: { en: "Live bus tracking", ta: "நேரடி பேருந்து கண்காணிப்பு" },
  journey_progress: { en: "Journey progress", ta: "பயண முன்னேற்றம்" },
  current_stop: { en: "Current stop", ta: "தற்போதைய நிறுத்தம்" },
  next_stop: { en: "Next stop", ta: "அடுத்த நிறுத்தம்" },
  eta: { en: "Arriving", ta: "வந்து சேரும் நேரம்" },
  delay_alert: { en: "Bus is delayed by", ta: "பேருந்து தாமதம்" },
  minutes: { en: "minutes", ta: "நிமிடங்கள்" },
  tracking_demo_note: { en: "Location updates every few seconds. Demo data is used in this preview.", ta: "இடத் தகவல் சில வினாடிகளுக்கு ஒருமுறை புதுப்பிக்கப்படும்." },
  show_at_boarding: { en: "Show this QR at boarding", ta: "ஏறும்போது இந்த QR-ஐ காட்டவும்" },
  download_ticket: { en: "Download ticket", ta: "டிக்கெட் பதிவிறக்கு" },
  share_ticket: { en: "Share ticket", ta: "டிக்கெட் பகிர்" },
  copied: { en: "Ticket details copied", ta: "டிக்கெட் விவரம் நகலெடுக்கப்பட்டது" },
  refund_status: { en: "Refund status", ta: "பணத்திரும்ப நிலை" },
  refund_credited: { en: "Refunded to your wallet", ta: "உங்கள் வாலட்டில் திரும்ப வழங்கப்பட்டது" },
  refund_not_eligible: { en: "Not eligible for refund (cancelled too close to departure).", ta: "பணத்திரும்பத்திற்கு தகுதி இல்லை." },
  refund_policy: { en: "Cancel 24h before: 90% back · 6h: 70% · 1h: 50%", ta: "24 மணி நேரம் முன்: 90% · 6 மணி: 70% · 1 மணி: 50%" },
  ticket_not_found: { en: "Ticket not found", ta: "டிக்கெட் கிடைக்கவில்லை" },
  view_ticket: { en: "View ticket & tracking", ta: "டிக்கெட் & கண்காணிப்பு" },
  upcoming: { en: "Upcoming", ta: "வரவிருக்கும்" },
  completed: { en: "Completed", ta: "முடிந்தது" },
  all: { en: "All", ta: "அனைத்தும்" },
  admin_portal: { en: "Operator portal", ta: "ஆபரேட்டர் போர்டல்" },
  admin_sub: { en: "Manage verified operators, schedules, fares and seat availability.", ta: "ஆபரேட்டர்கள், அட்டவணை, கட்டணம், இருக்கைகளை நிர்வகிக்கவும்." },
  staff_only: { en: "Staff access required", ta: "ஊழியர் அனுமதி தேவை" },
  staff_only_sub: { en: "This portal is for NXTIXA Go admins and bus operators.", ta: "இந்த பகுதி நிர்வாகிகள் மற்றும் ஆபரேட்டர்களுக்கானது." },
  claim_admin: { en: "Claim admin access (first user)", ta: "நிர்வாக அணுகலைப் பெறு" },
  admin_granted: { en: "You are now an admin", ta: "நீங்கள் இப்போது நிர்வாகி" },
  admin_exists: { en: "An admin already exists. Ask them for access.", ta: "ஏற்கனவே நிர்வாகி உள்ளார்." },
  role_admin: { en: "Admin", ta: "நிர்வாகி" },
  role_operator: { en: "Operator", ta: "ஆபரேட்டர்" },
  tab_schedules: { en: "Schedules", ta: "அட்டவணை" },
  tab_inventory: { en: "Bus inventory", ta: "பேருந்து பட்டியல்" },
  tab_bookings: { en: "Bookings", ta: "முன்பதிவுகள்" },
  schedule_updated: { en: "Schedule updated", ta: "அட்டவணை புதுப்பிக்கப்பட்டது" },
  schedule_added: { en: "Schedule published", ta: "அட்டவணை வெளியிடப்பட்டது" },
  add_schedule: { en: "Add schedule", ta: "அட்டவணை சேர்" },
  publish_schedule: { en: "Publish schedule", ta: "அட்டவணையை வெளியிடு" },
  scheduled_departures: { en: "departures scheduled", ta: "புறப்பாடுகள்" },
  no_schedules: { en: "No departures on this date.", ta: "இந்த தேதியில் புறப்பாடு இல்லை." },
  fare: { en: "Fare", ta: "கட்டணம்" },
  total_seats: { en: "Total seats", ta: "மொத்த இருக்கைகள்" },
  delay_mins: { en: "Delay (min)", ta: "தாமதம் (நிமிடம்)" },
  status: { en: "Status", ta: "நிலை" },
  passenger_note: { en: "Passenger alert", ta: "பயணிகள் அறிவிப்பு" },
  note_placeholder: { en: "e.g. Heavy rain near Salem", ta: "எ.கா. சேலம் அருகே மழை" },
  release_all_seats: { en: "Release all seats", ta: "அனைத்து இருக்கைகளையும் விடுவி" },
  bus_inventory: { en: "Verified bus inventory", ta: "சரிபார்க்கப்பட்ட பேருந்துகள்" },
  operator_name: { en: "Operator name", ta: "ஆபரேட்டர் பெயர்" },
  add_operator: { en: "Add operator", ta: "ஆபரேட்டர் சேர்" },
  add_operator_first: { en: "Add an operator first", ta: "முதலில் ஆபரேட்டரை சேர்க்கவும்" },
  operator_added: { en: "Operator added", ta: "ஆபரேட்டர் சேர்க்கப்பட்டது" },
  trips_done: { en: "trips", ta: "பயணங்கள்" },
  verified: { en: "Verified", ta: "சரிபார்க்கப்பட்டது" },
  unverified: { en: "Unverified", ta: "சரிபார்க்கப்படவில்லை" },
  verify: { en: "Verify", ta: "சரிபார்" },
  revoke: { en: "Revoke", ta: "நீக்கு" },
  recent_bookings: { en: "Recent bookings", ta: "சமீபத்திய முன்பதிவுகள்" },
  no_bookings_yet: { en: "No bookings yet.", ta: "முன்பதிவுகள் இல்லை." },
  net_revenue: { en: "Net revenue", ta: "நிகர வருவாய்" },
  departure: { en: "Departure", ta: "புறப்பாடு" },
  duration_hours: { en: "Duration (hours)", ta: "கால அளவு (மணி)" },
  bus_type: { en: "Bus type", ta: "பேருந்து வகை" },
  close: { en: "Close", ta: "மூடு" },
  nav_wallet: { en: "Wallet", ta: "வாலட்" },
  nav_admin: { en: "Operator portal", ta: "ஆபரேட்டர் போர்டல்" },
  brand_tag: { en: "AI-powered bus travel", ta: "AI துணையுடன் பேருந்து பயணம்" },
  nav_home: { en: "Home", ta: "முகப்பு" },
  nav_search: { en: "Find buses", ta: "பேருந்து தேடு" },
  nav_bookings: { en: "My tickets", ta: "என் டிக்கெட்டுகள்" },
  sign_in: { en: "Sign in", ta: "உள்நுழை" },
  sign_out: { en: "Sign out", ta: "வெளியேறு" },
  hero_title: { en: "Book buses you can actually trust", ta: "நம்பிக்கையான பேருந்து முன்பதிவு" },
  hero_sub: {
    en: "Verified operators, live seat sync, instant refunds to wallet and AI that picks the right seat for you.",
    ta: "சரிபார்க்கப்பட்ட ஆபரேட்டர்கள், நேரடி இருக்கை புதுப்பிப்பு, உடனடி பணத்திரும்பம், மற்றும் சிறந்த இருக்கையை தேர்வு செய்யும் AI.",
  },
  from: { en: "From", ta: "இருந்து" },
  to: { en: "To", ta: "வரை" },
  date: { en: "Date", ta: "தேதி" },
  search_buses: { en: "Search buses", ta: "பேருந்துகளைத் தேடு" },
  today: { en: "Today", ta: "இன்று" },
  tomorrow: { en: "Tomorrow", ta: "நாளை" },
  popular_routes: { en: "Popular routes", ta: "பிரபல வழித்தடங்கள்" },
  operators: { en: "Trusted operators", ta: "நம்பகமான ஆபரேட்டர்கள்" },
  why_us: { en: "Why NXTIXA Go", ta: "ஏன் NXTIXA Go" },
  ai_features: { en: "AI that travels with you", ta: "உங்களுடன் பயணிக்கும் AI" },
  reviews: { en: "What travellers say", ta: "பயணிகள் கூறுவது" },
  safety: { en: "Safety & trust", ta: "பாதுகாப்பு & நம்பிக்கை" },
  buses_found: { en: "buses found", ta: "பேருந்துகள் கிடைத்தன" },
  no_buses: { en: "No buses on this route yet. Try another date or city.", ta: "இந்த வழியில் பேருந்து இல்லை. வேறு தேதியை முயற்சிக்கவும்." },
  seats_left: { en: "seats left", ta: "இருக்கைகள் மீதம்" },
  select_seats: { en: "Select seats", ta: "இருக்கைகளைத் தேர்வு செய்" },
  available: { en: "Available", ta: "கிடைக்கிறது" },
  booked: { en: "Booked", ta: "பதிவானது" },
  selected: { en: "Selected", ta: "தேர்ந்தது" },
  women: { en: "Women", ta: "பெண்கள்" },
  ai_pick: { en: "AI pick", ta: "AI தேர்வு" },
  ai_recommend: { en: "Let AI pick my seats", ta: "AI இருக்கையை தேர்வு செய்யட்டும்" },
  boarding: { en: "Boarding point", ta: "ஏறும் இடம்" },
  dropping: { en: "Dropping point", ta: "இறங்கும் இடம்" },
  passengers: { en: "Passengers", ta: "பயணிகள்" },
  name: { en: "Full name", ta: "முழு பெயர்" },
  age: { en: "Age", ta: "வயது" },
  gender: { en: "Gender", ta: "பாலினம்" },
  male: { en: "Male", ta: "ஆண்" },
  female: { en: "Female", ta: "பெண்" },
  other: { en: "Other", ta: "மற்றவை" },
  contact: { en: "Contact details", ta: "தொடர்பு விவரம்" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Mobile number", ta: "கைபேசி எண்" },
  password: { en: "Password", ta: "கடவுச்சொல்" },
  fare_breakdown: { en: "Fare breakdown", ta: "கட்டண விவரம்" },
  base_fare: { en: "Base fare", ta: "அடிப்படை கட்டணம்" },
  gst: { en: "GST (5%)", ta: "ஜிஎஸ்டி (5%)" },
  total: { en: "Total payable", ta: "மொத்தம்" },
  payment: { en: "Payment method", ta: "கட்டண முறை" },
  pay_now: { en: "Pay securely & confirm", ta: "பாதுகாப்பாக செலுத்தி உறுதி செய்" },
  booking_confirmed: { en: "Booking confirmed", ta: "முன்பதிவு உறுதியானது" },
  my_tickets: { en: "My tickets", ta: "என் டிக்கெட்டுகள்" },
  no_tickets: { en: "No tickets yet. Your next journey starts with a search.", ta: "இன்னும் டிக்கெட் இல்லை. தேடலுடன் பயணத்தை தொடங்குங்கள்." },
  cancel_ticket: { en: "Cancel ticket", ta: "டிக்கெட் ரத்து" },
  cancelled: { en: "Cancelled", ta: "ரத்து செய்யப்பட்டது" },
  confirmed: { en: "Confirmed", ta: "உறுதியானது" },
  refund_note: { en: "Refund goes to your NXTIXA wallet instantly.", ta: "பணத்திரும்பம் உடனே உங்கள் NXTIXA வாலட்டுக்கு வரும்." },
  create_account: { en: "Create account", ta: "கணக்கை உருவாக்கு" },
  welcome_back: { en: "Welcome back", ta: "மீண்டும் வருக" },
  continue_google: { en: "Continue with Google", ta: "Google மூலம் தொடரவும்" },
  loading: { en: "Loading…", ta: "ஏற்றுகிறது…" },
  use_my_location: { en: "Use my location", ta: "என் இருப்பிடம்" },
  recent_places: { en: "Recent places", ta: "சமீபத்திய இடங்கள்" },
  swap_places: { en: "Swap places", ta: "இடங்களை மாற்று" },
  day_after: { en: "Day after", ta: "நாளை மறுநாள்" },
  cheapest_tag: { en: "Lowest fare", ta: "குறைந்த கட்டணம்" },
  women_friendly: { en: "Women friendly", ta: "பெண்களுக்கு பாதுகாப்பு" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict | string) => string };

const LanguageContext = React.createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => String(k) });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("nxtixa-lang");
    if (stored === "ta" || stored === "en") setLangState(stored);
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("nxtixa-lang", l);
    document.documentElement.lang = l;
  }, []);

  const t = React.useCallback(
    (k: string) => {
      const entry = dict[k];
      return entry ? entry[lang] : k;
    },
    [lang],
  );

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return React.useContext(LanguageContext);
}
