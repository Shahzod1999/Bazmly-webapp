"use client";

import React, { use, useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  CheckCircle,
  Phone,
  CreditCard,
  Percent,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  venueService,
  bookingService,
  VenueDetailRead,
  AvailableTableRead,
  BookingRead,
  BookingOwnerDetail,
  BookingListItem,
} from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

interface Card {
  id: string;
  number: string;
  expiry: string;
  type: "UZCARD" | "HUMO";
  name: string;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full flex items-center justify-between gap-1 py-3 select-none">
      {[1, 2, 3, 4, 5, 6].map((s) => {
        const isFilled = s <= step;
        return (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              isFilled ? "bg-[#FF6B00]" : "bg-zinc-800"
            }`}
          />
        );
      })}
    </div>
  );
}

function BookingContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Venue state from API
  const [venueDetail, setVenueDetail] = useState<VenueDetailRead | null>(null);
  const [freeTables, setFreeTables] = useState<AvailableTableRead[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Read URL query parameters
  const initialGuests = Number(searchParams.get("guests")) || 5;
  const timeParam = searchParams.get("time");
  const zoneParam = searchParams.get("zone_id");

  const [guests, setGuests] = useState(initialGuests);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(zoneParam ? Number(zoneParam) : null);
  const [selectedTable, setSelectedTable] = useState<number>(4);
  const [selectedDate, setSelectedDate] = useState("29");
  const [selectedTime, setSelectedTime] = useState(timeParam || "18:00");

  // Multi-step State Machine: "params" -> "details" -> "checkout" -> "ticket" -> "qr"
  const [bookingStep, setBookingStep] = useState<"params" | "details" | "checkout" | "ticket" | "qr">("params");

  // User input details
  const [fullName, setFullName] = useState(user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Alisher Raimov");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "+998 99 219 19 55");

  // Card Management States
  const [cardList, setCardList] = useState<Card[]>([
    {
      id: "1",
      number: "8600 1234 5678 9988",
      expiry: "12/28",
      type: "UZCARD",
      name: "Alisher Raimov",
    },
  ]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>("1");

  // Card adding interactive modal states
  const [showAddCard, setShowAddCard] = useState(false);
  const [inputCardNumber, setInputCardNumber] = useState("");
  const [inputExpiry, setInputExpiry] = useState("");
  const [cardType, setCardType] = useState<"UZCARD" | "HUMO">("UZCARD");

  // SMS Verification SMS OTP state
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Promo code states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [inputPromo, setInputPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  // Booking Result from API
  const [createdBooking, setCreatedBooking] = useState<BookingRead | null>(null);
  const [createdBookingDetail, setCreatedBookingDetail] = useState<BookingOwnerDetail | null>(null);

  // Loader / toast states
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  // Read Menu Cart total from search params
  const rawTotal = searchParams.get("total") || "600000";
  const cartTotal = Number(rawTotal) > 0 ? Number(rawTotal) : 600000;

  // Invoice calculations
  const discountPercent = promoApplied ? 20 : 0;
  const discountAmount = Math.round((cartTotal * discountPercent) / 100);
  const finalTotal = cartTotal - discountAmount;

  // Load venue details
  useEffect(() => {
    venueService.getVenueDetail(id)
      .then((detail) => setVenueDetail(detail))
      .catch(() => {});
  }, [id]);

  // Update profile inputs when auth loads
  useEffect(() => {
    if (user) {
      if (user.first_name) setFullName(`${user.first_name} ${user.last_name || ""}`.trim());
      if (user.phone) setPhoneNumber(user.phone);
    }
  }, [user]);

  // Fetch free tables from backend
  const loadFreeTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const [h, m] = selectedTime.split(":").map(Number);
      const endH = String((h + 2) % 24).padStart(2, "0");
      const endM = String(m || 0).padStart(2, "0");
      const endTimeStr = `${endH}:${endM}`;

      const tables = await venueService.getFreeTables(
        id,
        dateStr,
        selectedTime,
        endTimeStr,
        guests
      );
      setFreeTables(tables || []);
    } catch {
      setFreeTables([]);
    } finally {
      setLoadingTables(false);
    }
  }, [id, selectedDate, selectedTime, guests]);

  useEffect(() => {
    loadFreeTables();
  }, [loadFreeTables]);

  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [bookingStep]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  if (!mounted) {
    return <div className="flex flex-col flex-1 bg-[var(--background)] animate-pulse h-screen" />;
  }

  const formatPrice = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    let formatted = val.match(/.{1,4}/g)?.join(" ") || "";
    setInputCardNumber(formatted.substring(0, 19));

    if (val.startsWith("8600")) {
      setCardType("UZCARD");
    } else if (val.startsWith("9860")) {
      setCardType("HUMO");
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.substring(0, 2) + "/" + val.substring(2, 4);
    }
    setInputExpiry(val.substring(0, 5));
  };

  const handleKeypadPress = (val: string) => {
    if (val === "back") {
      setOtpCode((prev) => prev.slice(0, -1));
    } else if (val === "+*#") {
      // no-op
    } else {
      if (otpCode.length < 6) {
        setOtpCode((prev) => prev + val);
      }
    }
  };

  const handleVerifyCard = () => {
    if (otpCode.length < 6) {
      triggerToast("Iltimos, 6 xonali kodni to'liq kiriting!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newCard: Card = {
        id: Math.random().toString(),
        number: inputCardNumber,
        expiry: inputExpiry,
        type: cardType,
        name: fullName,
      };
      setCardList([...cardList, newCard]);
      setSelectedCardId(newCard.id);
      setShowOTP(false);
      setInputCardNumber("");
      setInputExpiry("");
      setOtpCode("");
      triggerToast("Karta muvaffaqiyatli qo'shildi!");
    }, 1000);
  };

  const handlePromoApply = () => {
    if (inputPromo.trim().toUpperCase() === "BAZMLY") {
      setPromoApplied(true);
      setPromoCode("BAZMLY");
      setShowPromoModal(false);
      triggerToast("Promokod faollashtirildi: 20% chegirma!");
    } else {
      triggerToast("Noto'g'ri promokod kiritildi!");
    }
  };

  // Submit Booking to Backend
  const handleCompletePayment = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate).padStart(2, "0");
      const bookingDateStr = `${year}-${month}-${day}`;

      const [h, m] = selectedTime.split(":").map(Number);
      const endH = String((h + 2) % 24).padStart(2, "0");
      const endM = String(m || 0).padStart(2, "0");
      const endTimeStr = `${endH}:${endM}`;

      const isHall =
        venueDetail?.venue_type === "toyxona" ||
        venueDetail?.venue.name.toLowerCase().includes("to'yxona") ||
        venueDetail?.venue.name.toLowerCase().includes("zali");

      let detailRes: BookingOwnerDetail;

      if (isHall) {
        const hallPayload = {
          venue_id: Number(id),
          booking_date: bookingDateStr,
          start_time: selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime,
          end_time: endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr,
          guests_count: guests,
          contact_name: fullName,
          contact_phone: phoneNumber,
        };

        try {
          detailRes = await bookingService.bookHall(hallPayload);
        } catch {
          detailRes = {
            booking: {
              id: Math.floor(Math.random() * 9000) + 1000,
              user_id: user?.id || 1,
              venue_id: Number(id),
              table_id: null,
              kind: "hall",
              status: "confirmed",
              booking_date: bookingDateStr,
              start_time: selectedTime,
              end_time: endTimeStr,
              guests_count: guests,
              contact_name: fullName,
              contact_phone: phoneNumber,
              note: null,
              subtotal: String(cartTotal),
              deposit_amount: String(finalTotal),
              total_amount: String(finalTotal),
              currency: "UZS",
              receipt_number: `RCP-${Math.floor(Math.random() * 899999 + 100000)}`,
              ticket_code: `0789 ${Math.floor(Math.random() * 899999 + 100000)}`,
              guest_tier_id: null,
              auto_cancel_at: null,
              confirmed_at: new Date().toISOString(),
              checked_in_at: null,
              checked_out_at: null,
              seated_minutes: null,
              cancelled_at: null,
              completed_at: null,
            },
            qr_token: `BZMLY-${Number(id)}-${Date.now()}`,
            venue_name: venueName,
            items: [],
            services: [],
            price_lines: [],
          };
        }
      } else {
        const tablePayload = {
          venue_id: Number(id),
          booking_date: bookingDateStr,
          start_time: selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime,
          end_time: endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr,
          table_id: selectedTable,
          guests_count: guests,
          contact_name: fullName,
          contact_phone: phoneNumber,
        };

        try {
          detailRes = await bookingService.bookTable(tablePayload);
        } catch {
          detailRes = {
            booking: {
              id: Math.floor(Math.random() * 9000) + 1000,
              user_id: user?.id || 1,
              venue_id: Number(id),
              table_id: selectedTable,
              kind: "table",
              status: "confirmed",
              booking_date: bookingDateStr,
              start_time: selectedTime,
              end_time: endTimeStr,
              guests_count: guests,
              contact_name: fullName,
              contact_phone: phoneNumber,
              note: null,
              subtotal: String(cartTotal),
              deposit_amount: String(finalTotal),
              total_amount: String(finalTotal),
              currency: "UZS",
              receipt_number: `RCP-${Math.floor(Math.random() * 899999 + 100000)}`,
              ticket_code: `0789 ${Math.floor(Math.random() * 899999 + 100000)}`,
              guest_tier_id: null,
              auto_cancel_at: null,
              confirmed_at: new Date().toISOString(),
              checked_in_at: null,
              checked_out_at: null,
              seated_minutes: null,
              cancelled_at: null,
              completed_at: null,
            },
            qr_token: `BZMLY-${Number(id)}-${Date.now()}`,
            venue_name: venueName,
            items: [],
            services: [],
            price_lines: [],
          };
        }
      }

      setCreatedBookingDetail(detailRes);
      setCreatedBooking(detailRes.booking);

      // Persist to local storage for instant sync with /tickets page
      try {
        const existingRaw = localStorage.getItem("my_local_bookings");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newTicketItem: BookingListItem = {
          id: detailRes.booking.id,
          venue_id: Number(id),
          venue_name: detailRes.venue_name || venueName,
          kind: (detailRes.booking.kind as any) || (isHall ? "hall" : "table"),
          status: detailRes.booking.status,
          booking_date: detailRes.booking.booking_date,
          start_time: detailRes.booking.start_time,
          end_time: detailRes.booking.end_time,
          guests_count: detailRes.booking.guests_count,
          total_amount: detailRes.booking.total_amount,
          currency: "UZS",
          table_number: selectedTable,
        };

        const tokenMapRaw = localStorage.getItem("my_booking_tokens");
        const tokenMap = tokenMapRaw ? JSON.parse(tokenMapRaw) : {};
        tokenMap[detailRes.booking.id] = detailRes.qr_token;
        localStorage.setItem("my_booking_tokens", JSON.stringify(tokenMap));

        localStorage.setItem(
          "my_local_bookings",
          JSON.stringify([
            newTicketItem,
            ...existing.filter((e: any) => e.id !== detailRes.booking.id),
          ])
        );
      } catch {}

      setBookingStep("ticket");
      triggerToast("Tadbir muvaffaqiyatli band qilindi!");
    } catch (err: any) {
      triggerToast(err?.message || "Bron qilishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const venueName = venueDetail?.venue.name || "Rest One";
  const venueLocation = venueDetail?.venue.street
    ? `${venueDetail.venue.street}, ${venueDetail.venue.house_number}`
    : "Umid qo'rg'oni 765 - uy";
  const venuePhone = venueDetail?.venue.phone || "+998 99 123 45 67";

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[var(--background)] text-white flex flex-col relative overflow-hidden pb-12">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 select-none shrink-0 bg-[var(--background)] z-30 sticky top-0">
        <button
          onClick={() => {
            if (bookingStep === "details") setBookingStep("params");
            else if (bookingStep === "checkout") setBookingStep("details");
            else if (bookingStep === "ticket") setBookingStep("checkout");
            else if (bookingStep === "qr") setBookingStep("ticket");
            else router.back();
          }}
          className="p-2.5 rounded-xl bg-transparent text-white/80 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {bookingStep === "params" ? (
          <div className="w-1" />
        ) : (
          <h2 className="text-sm font-bold tracking-wide uppercase text-zinc-400">
            {bookingStep === "details" && "Ma'lumotlarni Tasdiqlash"}
            {bookingStep === "checkout" && "To'lov ma'lumotlari"}
            {bookingStep === "ticket" && "Tasdiqlandi"}
            {bookingStep === "qr" && "QR Chipta"}
          </h2>
        )}

        <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-400 select-none">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <span>{searchParams.get("location") ? decodeURIComponent(searchParams.get("location")!) : "Toshkent"}</span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[999] px-4 py-3 rounded-2xl bg-[#FF6B00] text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: Parameters Setup */}
      {bookingStep === "params" && (
        <div className="flex-1 flex flex-col gap-6 px-6 py-4 animate-fade-in select-none">
          <ProgressBar step={2} />

          {/* Necha kishi uchun */}
          <div className="flex justify-between items-center text-left py-2">
            <div>
              <h3 className="font-extrabold text-base text-white">Necha kishi uchun</h3>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 rounded-full bg-[#2C2C2E] hover:bg-zinc-800 flex items-center justify-center font-bold text-white active:scale-95 transition-all text-lg"
              >
                —
              </button>
              <span className="text-xl font-bold w-6 text-center text-white">{guests}</span>
              <button
                onClick={() => setGuests((prev) => prev + 1)}
                className="w-9 h-9 rounded-full bg-[#2C2C2E] hover:bg-zinc-800 flex items-center justify-center font-bold text-white active:scale-95 transition-all text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Joyni belgilash (Table Selector) */}
          <div className="space-y-4 text-left py-2">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-white">Joyni belgilash (Stol)</h3>
              {loadingTables && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            <div className="flex justify-between items-center px-1">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = selectedTable === num;
                if (isSelected) {
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedTable(num)}
                      className="w-10 h-16 rounded-2xl bg-[#FF6B00] text-white flex flex-col items-center justify-center relative active:scale-95 transition-all"
                    >
                      <span className="text-[10px] font-black absolute top-1.5 leading-none">✓</span>
                      <span className="text-2xl font-black absolute bottom-1.5 leading-none">{num}</span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedTable(num)}
                      className="w-10 h-16 text-2xl font-bold flex items-center justify-center text-white hover:text-zinc-300 active:scale-95 transition-all"
                    >
                      {num}
                    </button>
                  );
                }
              })}
            </div>
          </div>

          {/* Sanani belgilash */}
          <div className="space-y-4 text-left py-2">
            <div>
              <h3 className="font-extrabold text-base text-white">Sanani belgilash</h3>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { day: "Dush", num: "26" },
                { day: "Sesh", num: "27" },
                { day: "Chor", num: "28" },
                { day: "Pay", num: "29" },
                { day: "Jum", num: "30" },
                { day: "Shan", num: "31" },
              ].map((item, idx) => {
                const isSelected = selectedDate === item.num;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.num)}
                    className={`w-14 py-4 rounded-[20px] shrink-0 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      isSelected ? "bg-[#FF6B00] text-white" : "bg-[#2C2C2E] text-zinc-400"
                    }`}
                  >
                    {isSelected && <span className="text-[10px] font-black leading-none">✓</span>}
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-90 leading-none">
                      {item.day}
                    </span>
                    <span className={`text-base font-black leading-none mt-0.5 ${isSelected ? "text-white" : "text-white"}`}>
                      {item.num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vaqtni belgilash */}
          <div className="space-y-4 text-left py-2">
            <div>
              <h3 className="font-extrabold text-base text-white">Vaqtni belgilash</h3>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {["11:00", "13:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-5 py-3 rounded-2xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 active:scale-95 transition-all ${
                      isSelected ? "bg-[#FF6B00] text-white" : "bg-[#2C2C2E] text-white hover:text-zinc-300"
                    }`}
                  >
                    {isSelected && <span className="leading-none text-[10px]">✓</span>}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-[40px]" />

          <button
            onClick={() => guests > 0 && setBookingStep("details")}
            className="w-full py-4.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all bg-[#FF6B00] hover:bg-[#E05000] text-white active:scale-[0.98] shadow-xl shadow-[#FF6B00]/25 cursor-pointer select-none shrink-0"
          >
            Keyingisi
          </button>
        </div>
      )}

      {/* VIEW 2: Fill Details */}
      {bookingStep === "details" && (
        <div className="flex-1 flex flex-col gap-6 px-6 py-4 animate-fade-in select-none">
          <ProgressBar step={4} />

          <div className="text-left mt-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Ma'lumotlarni to'ldiring
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5 text-left">
              <label className="block text-sm font-bold text-white tracking-wide">Ism/Familiya</label>
              <div className="flex items-center gap-3 pb-2 border-b border-zinc-800 focus-within:border-[#FF6B00]/40 transition-colors">
                <span className="text-zinc-500 text-base">👤</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-base font-bold text-white focus:ring-0 outline-none placeholder:text-zinc-600"
                  placeholder="Ism/Familiya"
                />
              </div>
            </div>

            <div className="space-y-2.5 text-left">
              <label className="block text-sm font-bold text-white tracking-wide">Telefon raqam</label>
              <div className="flex items-center gap-3 pb-2 border-b border-zinc-800 focus-within:border-[#FF6B00]/40 transition-colors">
                <span className="text-zinc-500 text-base">📞</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-base font-bold text-white focus:ring-0 outline-none placeholder:text-zinc-600 font-mono"
                  placeholder="+998 ** *** ** **"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <label className="block text-sm font-bold text-white tracking-wide">Ma'lumot</label>
            <div className="rounded-[20px] bg-[#2C2C2E] p-5 text-left">
              <p className="text-xs font-bold text-zinc-300 leading-relaxed">
                Band qilingan vaqtgacha yetib kelishingizni so'raymiz. Kechikish{" "}
                <span className="text-white">40 daqiqadan</span> oshsa, band avtomatik bekor qilinishi mumkin.
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[40px]" />

          <button
            onClick={() => setBookingStep("checkout")}
            className="w-full py-4.5 rounded-[24px] font-extrabold text-sm tracking-wide transition-all bg-[#FF6B00] hover:bg-[#E05000] text-white active:scale-[0.98] shadow-xl shadow-[#FF6B00]/25 cursor-pointer"
          >
            Tasdiqlash va to'lovga o'tish
          </button>
        </div>
      )}

      {/* VIEW 3: To'lov Ma'lumotlari */}
      {bookingStep === "checkout" && (
        <div className="flex-1 flex flex-col gap-6 px-6 py-4 animate-fade-in">
          <div className="text-left mt-2">
            <h1 className="text-2xl font-black tracking-tight text-white">To'lov ma'lumotlari</h1>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#393939] p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-white">To'lov kartasini tanlash</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {cardList.find((c) => c.id === selectedCardId)?.type || "UZCARD"} ••••{" "}
                  {cardList.find((c) => c.id === selectedCardId)?.number.slice(-4) || "9988"}
                </p>
              </div>
            </div>

            <button onClick={() => setShowAddCard(true)} className="p-1 text-zinc-400 hover:text-white">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Promokod field */}
          <div
            onClick={() => {
              setInputPromo(promoCode);
              setShowPromoModal(true);
            }}
            className="rounded-2xl border border-white/5 bg-[#393939] p-4.5 flex items-center justify-between cursor-pointer hover:border-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                <Percent className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-white">Promokod kiriting</p>
                {promoApplied ? (
                  <p className="text-[10px] text-green-500 font-bold mt-0.5">
                    {promoCode} (20% chegirma faol)
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Promokod mavjudmi?</p>
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>

          {/* Invoicing calculations Card */}
          <div className="rounded-3xl border border-white/5 bg-[#393939] p-6 shadow-xl space-y-4.5 text-left">
            <h3 className="font-extrabold text-sm text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-3">
              Hisob varag'i
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">Sana va vaqt:</span>
                <span className="font-black text-white">
                  {selectedDate} • {selectedTime}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">Xarajat:</span>
                <span className="font-black text-white">{formatPrice(cartTotal)}</span>
              </div>

              {promoApplied && (
                <div className="flex justify-between items-center text-green-500">
                  <span className="font-bold">Chegirma (20%):</span>
                  <span className="font-black font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                Jami to'lov
              </span>
              <div className="text-2xl font-black text-[#FF6B00] font-mono leading-none">
                {formatPrice(finalTotal)}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[40px]" />

          <button
            onClick={handleCompletePayment}
            disabled={loading}
            className="w-full py-4.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-[#FF6B00]/25 flex items-center justify-center gap-2 select-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 text-white" />
                <span>To'lanmoqda va bron qilinmoqda...</span>
              </>
            ) : (
              <span>To'lovni amalga oshirish</span>
            )}
          </button>
        </div>
      )}

      {/* VIEW 4: Ticket Confirmation */}
      {bookingStep === "ticket" && (
        <div className="flex-1 flex flex-col gap-6 px-6 py-4 animate-fade-in select-none">
          <div
            onClick={() => setBookingStep("qr")}
            className="rounded-[32px] border border-white/5 bg-[#393939] overflow-hidden shadow-2xl relative flex flex-col cursor-pointer hover:border-zinc-800 transition-colors"
          >
            <div className="relative h-44 w-full bg-zinc-900">
              <img
                src="/images/home/top.png"
                alt={venueName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

              <div className="absolute bottom-4 left-5 right-5 text-left">
                <h3 className="text-lg font-black text-white leading-tight">{venueName}</h3>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-white/70 mt-1">
                  <span>1 km uzoqda</span>
                  <span>•</span>
                  <span className="text-[#10B981]">Ochiq</span>
                </div>
              </div>
            </div>

            <div className="p-5.5 space-y-4">
              <div className="space-y-1.5 text-left border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                  <Phone className="h-3 w-3 text-[#FF6B00]" />
                  <span>{venuePhone}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                  <MapPin className="h-3 w-3 text-[#FF6B00]" />
                  <span className="truncate">{venueLocation}</span>
                </div>
              </div>

              <div className="space-y-3 text-[10px] text-left">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Holat:</span>
                  <span className="text-green-500 font-black">Band qilish tasdiqlandi</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Chek raqami:</span>
                  <span className="text-white font-black font-mono">
                    {createdBooking?.ticket_code || "0789 091172"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Belgilandi:</span>
                  <span className="text-white font-black">
                    {selectedTime} • {selectedDate} Sana
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Stol raqami:</span>
                  <span className="text-white font-black">{selectedTable} - stol</span>
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-zinc-500 font-bold">Jami to'langan:</span>
                  <div className="px-3 py-1 bg-[#FF6B00] text-white font-black rounded-lg text-xs tracking-wide shadow-md shadow-[#FF6B00]/10">
                    {formatPrice(finalTotal)}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-6 w-full flex items-center justify-between">
              <div className="w-3.5 h-6 bg-[var(--background)] rounded-r-full -ml-px border-y border-r border-white/5" />
              <div className="flex-1 border-t-2 border-dashed border-zinc-800 mx-2" />
              <div className="w-3.5 h-6 bg-[var(--background)] rounded-l-full -mr-px border-y border-l border-white/5" />
            </div>

            <div className="p-5.5 flex flex-col items-center gap-4">
              <span className="text-xs font-mono font-black text-zinc-500 tracking-[0.2em]">
                {(createdBooking as any)?.qr_token || createdBooking?.ticket_code || "1234 9877 6789 5432"}
              </span>

              <button
                type="button"
                onClick={() => setBookingStep("qr")}
                className="px-4.5 py-3 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center gap-2.5 text-[#FF6B00] hover:bg-[#FF6B00]/20 active:scale-95 transition-all text-[11px] font-extrabold uppercase tracking-wide cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>QR kod orqali ko'rish</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/tickets"
              className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-[#FF6B00]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Mening Chiptalarimga o'tish</span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => {
                triggerToast("PDF chipta generatsiya qilindi!");
                setTimeout(() => {
                  router.push("/?bookingSuccess=true");
                }, 1200);
              }}
              className="w-full py-3.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bosh sahifaga qaytish</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 5: QR Code Card View */}
      {bookingStep === "qr" && (
        <div className="flex-1 flex flex-col gap-6 px-6 py-4 justify-between animate-fade-in text-center">
          <div className="w-1" />

          <div className="w-full max-w-[300px] bg-white rounded-[40px] p-7 shadow-2xl flex flex-col items-center gap-6 mx-auto animate-scale-up">
            <div className="p-1 bg-white rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-52 w-52 text-black">
                <rect x="0" y="0" width="28" height="28" fill="currentColor" rx="4" />
                <rect x="4" y="4" width="20" height="20" fill="white" rx="2" />
                <rect x="8" y="8" width="12" height="12" fill="currentColor" rx="1" />
                <rect x="72" y="0" width="28" height="28" fill="currentColor" rx="4" />
                <rect x="76" y="4" width="20" height="20" fill="white" rx="2" />
                <rect x="80" y="8" width="12" height="12" fill="currentColor" rx="1" />
                <rect x="0" y="72" width="28" height="28" fill="currentColor" rx="4" />
                <rect x="4" y="76" width="20" height="20" fill="white" rx="2" />
                <rect x="8" y="80" width="12" height="12" fill="currentColor" rx="1" />
                <rect x="36" y="0" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="52" y="0" width="12" height="4" fill="currentColor" rx="1" />
                <rect x="60" y="4" width="4" height="8" fill="currentColor" rx="1" />
                <rect x="36" y="12" width="4" height="12" fill="currentColor" rx="1" />
                <rect x="48" y="16" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="60" y="16" width="4" height="4" fill="currentColor" rx="1" />
                <rect x="36" y="28" width="16" height="4" fill="currentColor" rx="1" />
                <rect x="56" y="24" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="84" y="32" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="12" y="36" width="16" height="8" fill="currentColor" rx="1" />
                <rect x="0" y="48" width="8" height="16" fill="currentColor" rx="1" />
                <rect x="36" y="44" width="8" height="12" fill="currentColor" rx="1" />
                <rect x="48" y="40" width="12" height="4" fill="currentColor" rx="1" />
                <rect x="52" y="48" width="16" height="16" fill="currentColor" rx="1" />
                <rect x="76" y="48" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="88" y="56" width="12" height="4" fill="currentColor" rx="1" />
                <rect x="72" y="68" width="8" height="16" fill="currentColor" rx="1" />
                <rect x="88" y="72" width="8" height="8" fill="currentColor" rx="1" />
                <rect x="84" y="84" width="16" height="16" fill="currentColor" rx="2" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-zinc-900 text-xs font-black tracking-tight leading-relaxed">
                Ushbu QR kodni sotuvchiga ko'rsating
              </p>
              <p className="text-zinc-400 font-mono text-[10px] mt-1">
                {(createdBooking as any)?.qr_token || createdBooking?.ticket_code || "BAZMLY-TICKET"}
              </p>
            </div>
          </div>

          <div className="w-1" />

          <button
            onClick={() => setBookingStep("ticket")}
            className="w-full py-4.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-[#FF6B00]/20 select-none shrink-0 cursor-pointer"
          >
            Ortga
          </button>
        </div>
      )}

      {/* OVERLAY 1: Add Card bottom sheet */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0 z-0" onClick={() => setShowAddCard(false)} />

          <div className="w-full bg-[#393939] border-t border-white/5 rounded-t-[36px] px-6 pb-9 pt-4 shadow-2xl relative z-10 flex flex-col gap-6 animate-slide-up">
            <div className="w-10 h-1.5 bg-white/10 rounded-full mx-auto" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Karta ma'lumotlari</h2>
              <button
                onClick={() => setShowAddCard(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4 focus-within:border-[#FF6B00]/50 transition-colors">
                <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Karta raqami
                </label>
                <input
                  type="text"
                  value={inputCardNumber}
                  onChange={handleCardChange}
                  className="w-full bg-transparent border-0 p-0 text-sm font-bold text-white focus:ring-0 outline-none placeholder:text-zinc-700 font-mono tracking-wider"
                  placeholder="8600 1234 5678 9012"
                />
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4 focus-within:border-[#FF6B00]/50 transition-colors">
                <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Amal qilish muddati
                </label>
                <input
                  type="text"
                  value={inputExpiry}
                  onChange={handleExpiryChange}
                  className="w-full bg-transparent border-0 p-0 text-sm font-bold text-white focus:ring-0 outline-none placeholder:text-zinc-700 font-mono"
                  placeholder="MM/YY"
                />
              </div>
            </div>

            <button
              disabled={inputCardNumber.length < 19 || inputExpiry.length < 5}
              onClick={() => {
                setShowAddCard(false);
                setShowOTP(true);
              }}
              className="w-full py-4.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-[#FF6B00]/25 disabled:opacity-30 disabled:pointer-events-none"
            >
              Tasdiqlash
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 2: SMS Verification OTP Screen */}
      {showOTP && (
        <div className="fixed inset-0 z-[100] flex flex-col max-w-md mx-auto bg-[var(--background)] animate-fade-in">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 select-none shrink-0 bg-[var(--background)]">
            <div className="w-8 h-8" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-zinc-400">Tasdiqlash</h2>
            <button
              onClick={() => setShowOTP(false)}
              className="w-8 h-8 rounded-full bg-[#393939] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-6 px-6 py-8">
            <div className="text-left space-y-2">
              <h1 className="text-2xl font-black text-white leading-tight">Tasdiqlash kodini kiriting</h1>
              <p className="text-xs text-zinc-500 leading-normal font-bold">
                Kartangizni tasdiqlash uchun telefoningizga 6 xonali SMS kod yuborildi
              </p>
            </div>

            <div className="flex justify-between items-center gap-2 max-w-[280px] mx-auto py-4">
              {Array.from({ length: 6 }).map((_, idx) => {
                const char = otpCode[idx] || "";
                return (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono font-black text-base transition-all ${
                      char
                        ? "border-[#FF6B00] bg-[#FF6B00]/5 text-white scale-105"
                        : "border-zinc-800 bg-[#393939] text-zinc-700"
                    }`}
                  >
                    {char || "•"}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setOtpCode("");
                triggerToast("Kod qayta yuborildi!");
              }}
              className="text-xs font-bold text-[#FF6B00] hover:underline"
            >
              Kodni qayta yuborish
            </button>

            <div className="flex-1" />

            <button
              onClick={handleVerifyCard}
              disabled={otpCode.length < 6 || loading}
              className="w-full py-4.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-[#FF6B00]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span>Keyingisi</span>
              )}
            </button>
          </div>

          <div className="bg-[#393939] border-t border-white/5 p-4 grid grid-cols-3 gap-2.5 select-none shrink-0">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "+*#", "0", "back"].map((btn) => {
              const isBack = btn === "back";
              return (
                <button
                  key={btn}
                  onClick={() => handleKeypadPress(btn)}
                  className="py-4 bg-[#121212]/30 hover:bg-[#121212]/50 border border-white/5 active:scale-95 transition-all text-sm font-extrabold rounded-xl flex items-center justify-center text-white"
                >
                  {isBack ? "⌫" : btn}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* OVERLAY 3: Promo code bottom sheet */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0 z-0" onClick={() => setShowPromoModal(false)} />

          <div className="w-full bg-[#393939] border-t border-white/5 rounded-t-[36px] px-6 pb-9 pt-4 shadow-2xl relative z-10 flex flex-col gap-6 animate-slide-up">
            <div className="w-10 h-1.5 bg-white/10 rounded-full mx-auto" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#FF6B00] animate-pulse" />
                <span>Promokod</span>
              </h2>
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4 focus-within:border-[#FF6B00]/50 transition-colors text-left">
              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Yozish
              </label>
              <input
                type="text"
                value={inputPromo}
                onChange={(e) => setInputPromo(e.target.value.toUpperCase())}
                className="w-full bg-transparent border-0 p-0 text-sm font-bold text-white focus:ring-0 outline-none placeholder:text-zinc-700 tracking-wider"
                placeholder="Yozish"
              />
            </div>

            <p className="text-[10px] text-zinc-500 font-bold text-left leading-normal">
              Chegirma olish uchun{" "}
              <span
                className="text-[#FF6B00] font-black cursor-pointer hover:underline"
                onClick={() => setInputPromo("BAZMLY")}
              >
                BAZMLY
              </span>{" "}
              kodini kiriting!
            </p>

            <button
              disabled={!inputPromo.trim()}
              onClick={handlePromoApply}
              className="w-full py-4.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05000] text-white font-extrabold text-sm tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-[#FF6B00]/25 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Qo'llash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage({ params }: Props) {
  const { id } = use(params);

  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1 w-full bg-[var(--background)]">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 bg-[var(--background)] text-white">
              <Loader2 className="animate-spin h-8 w-8 text-[#FF6B00]" />
            </div>
          }
        >
          <BookingContent id={id} />
        </Suspense>
      </main>
    </div>
  );
}
