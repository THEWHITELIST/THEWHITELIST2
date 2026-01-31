import { useState } from "react";
import { Car, Plane, Train, Hotel, Phone, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ViewMode } from "./types";

interface TransferOption {
  id: string;
  type: "arrival" | "departure";
  enabled: boolean;
  location: string;
  internalContact: string;
}

interface TransferOptionsProps {
  viewMode: ViewMode;
  startDate?: string;
  endDate?: string;
}

// Internal contact numbers (concierge only)
const INTERNAL_CONTACTS = {
  airport: "+33 1 XX XX XX XX",
  train: "+33 1 XX XX XX XX",
  hotel: "+33 1 XX XX XX XX",
};

export function TransferOptions({ viewMode, startDate, endDate }: TransferOptionsProps) {
  const [arrivalTransfer, setArrivalTransfer] = useState<TransferOption>({
    id: "arrival",
    type: "arrival",
    enabled: false,
    location: "airport",
    internalContact: INTERNAL_CONTACTS.airport,
  });

  const [departureTransfer, setDepartureTransfer] = useState<TransferOption>({
    id: "departure",
    type: "departure",
    enabled: false,
    location: "airport",
    internalContact: INTERNAL_CONTACTS.airport,
  });

  // Format dates for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case "airport":
        return <Plane className="w-4 h-4" />;
      case "train":
        return <Train className="w-4 h-4" />;
      case "hotel":
        return <Hotel className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const updateArrivalLocation = (location: string) => {
    setArrivalTransfer((prev) => ({
      ...prev,
      location,
      internalContact: INTERNAL_CONTACTS[location as keyof typeof INTERNAL_CONTACTS] || "",
    }));
  };

  const updateDepartureLocation = (location: string) => {
    setDepartureTransfer((prev) => ({
      ...prev,
      location,
      internalContact: INTERNAL_CONTACTS[location as keyof typeof INTERNAL_CONTACTS] || "",
    }));
  };

  // Client view: only show if transfers are enabled
  if (viewMode === "client") {
    if (!arrivalTransfer.enabled && !departureTransfer.enabled) {
      return null;
    }

    return (
      <div className="mb-6 p-5 rounded-xl border border-amber-500/10 bg-[#12121a]">
        <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-500" />
          Transferts Prives
        </h3>

        <div className="space-y-3">
          {arrivalTransfer.enabled && (
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-amber-500" />
              <span>
                Transfert d'arrivee - {arrivalTransfer.location === "airport" ? "Aeroport" : arrivalTransfer.location === "train" ? "Gare" : "Hotel"}
                {startDate && ` (${formatDate(startDate)})`}
              </span>
            </div>
          )}
          {departureTransfer.enabled && (
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-amber-500" />
              <span>
                Transfert de depart - {departureTransfer.location === "airport" ? "Aeroport" : departureTransfer.location === "train" ? "Gare" : "Hotel"}
                {endDate && ` (${formatDate(endDate)})`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Concierge view: full editing
  return (
    <div className="mb-6 p-5 rounded-xl border border-amber-500/10 bg-[#12121a]">
      <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
        <Car className="w-5 h-5 text-amber-500" />
        Options Voiturier / Transferts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Arrival Transfer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="arrival-transfer"
              checked={arrivalTransfer.enabled}
              onCheckedChange={(checked) =>
                setArrivalTransfer((prev) => ({ ...prev, enabled: !!checked }))
              }
              className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <Label htmlFor="arrival-transfer" className="text-white font-medium">
              Transfert d'arrivee
              {startDate && (
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  ({formatDate(startDate)})
                </span>
              )}
            </Label>
          </div>

          {arrivalTransfer.enabled && (
            <div className="ml-7 space-y-3">
              <div className="flex gap-2">
                {["airport", "train", "hotel"].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => updateArrivalLocation(loc)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      arrivalTransfer.location === loc
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {getLocationIcon(loc)}
                    {loc === "airport" ? "Aeroport" : loc === "train" ? "Gare" : "Hotel"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <Phone className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-400">Contact interne:</span>
                <Input
                  value={arrivalTransfer.internalContact}
                  onChange={(e) =>
                    setArrivalTransfer((prev) => ({
                      ...prev,
                      internalContact: e.target.value,
                    }))
                  }
                  className="flex-1 h-8 bg-transparent border-none text-amber-500 text-sm p-0 focus-visible:ring-0"
                  placeholder="+33 1 XX XX XX XX"
                />
              </div>
            </div>
          )}
        </div>

        {/* Departure Transfer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="departure-transfer"
              checked={departureTransfer.enabled}
              onCheckedChange={(checked) =>
                setDepartureTransfer((prev) => ({ ...prev, enabled: !!checked }))
              }
              className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <Label htmlFor="departure-transfer" className="text-white font-medium">
              Transfert de depart
              {endDate && (
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  ({formatDate(endDate)})
                </span>
              )}
            </Label>
          </div>

          {departureTransfer.enabled && (
            <div className="ml-7 space-y-3">
              <div className="flex gap-2">
                {["airport", "train", "hotel"].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => updateDepartureLocation(loc)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      departureTransfer.location === loc
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {getLocationIcon(loc)}
                    {loc === "airport" ? "Aeroport" : loc === "train" ? "Gare" : "Hotel"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <Phone className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-400">Contact interne:</span>
                <Input
                  value={departureTransfer.internalContact}
                  onChange={(e) =>
                    setDepartureTransfer((prev) => ({
                      ...prev,
                      internalContact: e.target.value,
                    }))
                  }
                  className="flex-1 h-8 bg-transparent border-none text-amber-500 text-sm p-0 focus-visible:ring-0"
                  placeholder="+33 1 XX XX XX XX"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 italic">
        Les contacts internes ne seront pas visibles par le client.
      </p>
    </div>
  );
}
