import { Link } from "@tanstack/react-router";
import { Bus, PhoneCall, ShieldCheck, Smartphone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-primary-foreground">
              <Bus className="size-4" aria-hidden />
            </span>
            <span className="font-display text-base font-bold">NXTIXA Go</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Safer, smarter bus travel across South India — verified operators, live tracking and instant refunds.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Travel</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/search" search={{ from: "Chennai", to: "Coimbatore", date: new Date().toISOString().slice(0, 10), pax: 1 }}>
                Chennai → Coimbatore
              </Link>
            </li>
            <li>
              <Link to="/search" search={{ from: "Chennai", to: "Madurai", date: new Date().toISOString().slice(0, 10), pax: 1 }}>
                Chennai → Madurai
              </Link>
            </li>
            <li>
              <Link to="/search" search={{ from: "Bengaluru", to: "Chennai", date: new Date().toISOString().slice(0, 10), pax: 1 }}>
                Bangalore → Chennai
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <PhoneCall className="size-4" aria-hidden /> 24×7 Tamil & English helpline
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden /> Emergency SOS during travel
            </li>
            <li className="flex items-center gap-2">
              <Smartphone className="size-4" aria-hidden /> Offline QR e-tickets
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Trust</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Payments are verified end-to-end and refunds land in your wallet instantly. Demo data is used for bus
            schedules in this preview.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NXTIXA Go. All rights reserved.
      </div>
    </footer>
  );
}
