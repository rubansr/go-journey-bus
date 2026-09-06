import * as React from "react";

export type Lang = "en" | "ta";

type Dict = Record<string, { en: string; ta: string }>;

const dict: Dict = {
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
