"use client";

import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  Star,
  MapPin,
  Map,
  Users,
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  Check,
  Sparkles,
  Music,
  Car,
  Wind,
  Wifi,
  Utensils,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Share2,
  Bookmark,
  BadgePercent,
  ArrowRight,
  Snowflake,
} from "lucide-react";

export interface ToyxonaVenueData {
  id: number;
  name: string;
  price: string;
  capacity: string;
  img: string;
  rating: string;
  reviewsCount: string;
  distance: string;
  address: string;
  discount?: string;
  description?: string;
}

interface ToyxonaFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue?: ToyxonaVenueData | null;
  theme?: string;
  initialStep?: "detail" | "step1";
  onSuccess?: () => void;
}

const DEFAULT_GALLERY = [
  "/images/home/rest1.png",
  "/images/home/rest2.png",
  "/images/home/rest3.png",
  "/images/home/rest4.png",
  "/images/home/rest5.png",
  "/images/home/rest6.png",
];

export default function ToyxonaFlowModal({
  isOpen,
  onClose,
  venue,
  theme = "light",
  initialStep = "detail",
  onSuccess,
}: ToyxonaFlowModalProps) {
  const isDark = theme === "dark";

  const defaultVenue: ToyxonaVenueData = {
    id: 99,
    name: "The Royal Grand",
    price: "25,000,000 so'm",
    capacity: "500 - 1,200 gacha odam",
    img: "/images/home/top.png",
    rating: "4.8",
    reviewsCount: "356 ta sharh",
    distance: "1 km uzoqda",
    address: "Navoiy, O‘zbekiston ko‘chasi 27 - uy",
    discount: "10% chegirma",
    description:
      "Hasidona Koshona - bu sizning unutilmas tadbirlaringiz uchun mo'ljallangan hashamatli majmua. Modern klassika uslubidagi dizayn, keng va yorug' zal hamda professional xizmat ko'rsatish jamoasi sizning to'y, korporativ tadbir yoki yubileyingizni yuqori saviyada o'tkazishni ta'minlaydi.",
  };

  const currentVenue = venue || defaultVenue;

  const [activeImage, setActiveImage] = useState<string>(
    venue?.img && venue.img !== "/images/home/tuyxona2.png"
      ? venue.img
      : "/images/home/top.png"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (venue?.img && venue.img !== "/images/home/tuyxona2.png") {
      setActiveImage(venue.img);
    } else {
      setActiveImage("/images/home/top.png");
    }
  }, [venue]);

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setToastMessage("Havola buferga nusxalandi!");
    }
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev);
    setToastMessage(!isSaved ? "Sevimlilarga saqlandi ❤️" : "Saqlanganlardan olib tashlandi");
  };

  // Active Screen: "detail" | 1 | 2 | 3 | 4 | 5 | 6
  const [currentStep, setCurrentStep] = useState<"detail" | 1 | 2 | 3 | 4 | 5 | 6>(
    initialStep === "step1" ? 1 : "detail"
  );

  // Step 1: Date & Time State
  const dates = [
    { day: "Dush", date: "26" },
    { day: "Sesh", date: "27" },
    { day: "Chor", date: "28" },
    { day: "Pay", date: "29" },
    { day: "Jum", date: "1" },
    { day: "Shan", date: "2" },
    { day: "Yak", date: "3" },
  ];
  const [selectedDate, setSelectedDate] = useState("26");

  const times = ["11:00", "11:30", "12:00", "12:30", "17:30", "18:00", "18:30", "19:00"];
  const [selectedTime, setSelectedTime] = useState("18:00");

  // Step 2: Guest Tiers State
  const guestTiers = [
    { label: "100 - 150 kishi", priceVal: 10000000, priceText: "10,000,000 so'm" },
    { label: "150 - 200 kishi", priceVal: 15000000, priceText: "15,000,000 so'm" },
    { label: "200 - 300 kishi", priceVal: 20000000, priceText: "20,000,000 so'm" },
    { label: "300+ kishi", priceVal: 25000000, priceText: "25,000,000 so'm" },
  ];
  const [selectedGuestTier, setSelectedGuestTier] = useState(0);

  // Step 3: Catering / Menu State
  const [cateringMode, setCateringMode] = useState<"custom" | "ready">("ready");
  const [menuItems, setMenuItems] = useState<{ [key: string]: boolean }>({
    salat1: true,
    salat2: true,
    gazak1: true,
    gazak2: true,
    taom1: true,
    taom2: true,
    ichimlik1: true,
    desert1: true,
  });

  const toggleMenuItem = (id: string) => {
    setMenuItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Step 5: Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"card" | "click" | "payme">("card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculations
  const hallRentalFee = guestTiers[selectedGuestTier].priceVal;
  const cateringPerPerson = 125000;
  const guestCountAvg = [125, 175, 250, 350][selectedGuestTier];
  const cateringTotal = cateringMode === "ready" ? guestCountAvg * cateringPerPerson : 0;
  const serviceFee = 1250000;
  const grandTotal = hallRentalFee + cateringTotal + serviceFee;
  const depositAmount = 1200000;

  const handlePayDeposit = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setCurrentStep(6);
      if (onSuccess) onSuccess();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/50 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-zinc-900/90 text-white text-xs font-semibold shadow-xl flex items-center gap-2 border border-white/10 backdrop-blur-md animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className={`w-full max-w-md h-full overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-300 ${
          isDark ? "bg-[#1E1E1E] text-white" : "bg-white text-zinc-900"
        }`}
      >
        {/* =======================================================================
            VIEW 0: TO'YXONA DETAIL SCREEN (Matching 1-rasm)
           ======================================================================= */}
        {currentStep === "detail" && (
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none pb-8">
            {/* Top Image Viewport with Overlay Buttons & Thumbnails */}
            <div className="w-full h-72 sm:h-80 relative overflow-hidden shrink-0">
              <img
                src={activeImage}
                alt={currentVenue.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Top Navigation */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleToggleSave}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        isSaved ? "fill-[#FF5A00] text-[#FF5A00]" : "text-white"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bottom Gallery Previews (6 thumbnails) */}
              <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center px-4">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full">
                  {DEFAULT_GALLERY.map((thumb, idx) => {
                    const isSel = activeImage === thumb;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(thumb)}
                        className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer shadow-sm ${
                          isSel
                            ? "border-[#FF5A00] scale-105 opacity-100 ring-2 ring-[#FF5A00]/40"
                            : "border-white/80 opacity-85 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Venue Information Body */}
            <div className="p-5 space-y-4">
              {/* Badges & Rating Row */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8EE] border border-[#A7E9BE] text-[#16A34A] text-xs font-semibold">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>{currentVenue.discount || "10% chegirma"}</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>
                    {currentVenue.rating} ({currentVenue.reviewsCount})
                  </span>
                </div>
              </div>

              {/* Row 2: Title & Status */}
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {currentVenue.name}
                </h1>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#16A34A] dark:text-[#22C55E]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#22C55E]" />
                  <span>Ochiq</span>
                </div>
              </div>

              {/* Row 3: Specifications */}
              <div className="space-y-2.5 pt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 text-zinc-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                  <span>{currentVenue.price}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{currentVenue.capacity}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Map className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{currentVenue.distance}</span>
                  <span className="text-zinc-300 select-none">|</span>
                  <div className="inline-flex items-center gap-1 bg-[#16A34A] text-white px-2.5 py-0.5 rounded-lg text-xs font-bold">
                    <span className="text-[10px] font-black">%</span>
                    <span>Depozitlik</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{currentVenue.address}</span>
                </div>
              </div>

              {/* Jami narx & Band qilish Row */}
              <div className="pt-2 pb-1 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-400 block font-normal">Jami narx</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    25,000,000
                  </span>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3.5 rounded-2xl bg-[#FF5A00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF5A00]/25 cursor-pointer"
                >
                  <span>Band qilish</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Tavsif</h2>
                <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {currentVenue.description}
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: "Keng avtoturargoh", type: "parking" },
                  { label: "Akustik tizim", type: "audio" },
                  { label: "Katta sahna", type: "stage" },
                  { label: "Konditsioner", type: "ac" },
                  { label: "Professional oshxona", type: "kitchen" },
                  { label: "Yuqori tezlikdagi Wi-Fi", type: "wifi" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-2xl border ${
                      isDark
                        ? "bg-zinc-800/80 border-white/5 text-zinc-200"
                        : "bg-white border-zinc-100 text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF4ED] dark:bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center shrink-0">
                      {item.type === "parking" && <span className="font-extrabold text-sm">P</span>}
                      {item.type === "audio" && (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
                        </svg>
                      )}
                      {item.type === "stage" && (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="8" cy="11" r="5" />
                          <path d="M6 10h.01M10 10h.01" />
                          <path d="M6 13c.8 1 2 1 2.8 0" />
                          <circle cx="16" cy="13" r="5" />
                          <path d="M14 12h.01M18 12h.01" />
                          <path d="M14 15c.8-.8 2-.8 2.8 0" />
                        </svg>
                      )}
                      {item.type === "ac" && <Snowflake className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === "kitchen" && <Utensils className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === "wifi" && <Wifi className="w-5 h-5 stroke-[2.2]" />}
                    </div>
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            STEP-BY-STEP HEADER & STEPPER (For Steps 1 to 5)
           ======================================================================= */}
        {currentStep !== "detail" && currentStep !== 6 && (
          <div className="p-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (currentStep === 1) setCurrentStep("detail");
                  else setCurrentStep((prev) => ((prev as number) - 1) as any);
                }}
                className="w-9 h-9 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="font-bold text-sm tracking-tight">{currentVenue.name} to‘yxona</h3>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4-Step Stepper Progress Bar */}
            <div className="flex items-center justify-between px-2 pt-1">
              {[
                { step: 1, label: "Sana & vaqt" },
                { step: 2, label: "Mehmonlar" },
                { step: 3, label: "Menyu" },
                { step: 4, label: "Tasdiqlash" },
              ].map((item, idx) => {
                const isActive = (currentStep as number) === item.step;
                const isPassed = (currentStep as number) > item.step;

                return (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#FF6B00] text-white ring-4 ring-[#FF6B00]/20"
                            : isPassed
                            ? "bg-[#16A34A] text-white"
                            : isDark
                            ? "bg-white/10 text-zinc-400"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.step}
                      </div>
                      <span
                        className={`text-[10px] font-medium hidden sm:block ${
                          isActive ? "text-[#FF6B00] font-bold" : "text-zinc-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {idx < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors ${
                          (currentStep as number) > item.step ? "bg-[#16A34A]" : "bg-zinc-200 dark:bg-white/10"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 1: STEP 1 - SANANI VA VAQTNI BELGILASH (Figma Screen 3)
           ======================================================================= */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 pb-24">
            {/* Sanani belgilash */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calendar className="w-4 h-4 text-[#FF6B00]" />
                <span>Sanani belgilash</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {dates.map((item, idx) => {
                  const isSelected = selectedDate === item.date;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(item.date)}
                      className={`min-w-[62px] py-3 px-2 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25"
                          : isDark
                          ? "bg-[#252525] border-white/5 text-zinc-300 hover:border-white/20"
                          : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-[11px] font-medium opacity-80">{item.day}</span>
                      <span className="text-lg font-bold">{item.date}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vaqtni belgilash */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Clock className="w-4 h-4 text-[#FF6B00]" />
                <span>Vaqtni belgilash</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {times.map((t, idx) => {
                  const isSelected = selectedTime === t;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm"
                          : isDark
                          ? "bg-[#252525] border-white/5 text-zinc-300 hover:border-white/20"
                          : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Button */}
            <div
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 border-t ${
                isDark ? "bg-[#1E1E1E] border-white/5" : "bg-white border-zinc-100"
              }`}
            >
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full py-3.5 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF6B00]/25"
              >
                <span>Keyingisi</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 2: STEP 2 - MEHMONLAR SONINI TANLASH (Figma Screen 4)
           ======================================================================= */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 pb-24">
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Tadbiringiz uchun mehmonlar sonini tanlang
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tanlagan mehmonlar soningizga qarab to‘yxona ta‘riflari moslashtiriladi va narxlar
                avtomatik o‘zgaradi.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {guestTiers.map((tier, idx) => {
                const isSelected = selectedGuestTier === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedGuestTier(idx)}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-1 ring-[#FF6B00]"
                        : isDark
                        ? "border-white/5 bg-[#252525] hover:border-white/20"
                        : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block">{tier.label}</span>
                      <span className="text-xs text-zinc-400 mt-0.5 block">
                        Asosiy zal narxi: {tier.priceText}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                          : "border-zinc-300 dark:border-white/20"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Button */}
            <div
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 border-t ${
                isDark ? "bg-[#1E1E1E] border-white/5" : "bg-white border-zinc-100"
              }`}
            >
              <button
                onClick={() => setCurrentStep(3)}
                className="w-full py-3.5 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF6B00]/25"
              >
                <span>Keyingisi</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 3: STEP 3 - DASTURXON MAHSULOTLARINI TANLASH (Figma Screen 5)
           ======================================================================= */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 pb-28">
            <div>
              <h2 className="text-base font-bold tracking-tight">Dasturxon mahsulotlarini tanlang</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Dasturxon menyusi to‘yxona tomonidan taqdim etiladi. O‘zingizga ma‘qul variantni tanlang.
              </p>
            </div>

            {/* Switch Tabs: O'zimiz tayyorlaymiz vs Tayyor dasturxon */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
              <button
                onClick={() => setCateringMode("custom")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  cateringMode === "custom"
                    ? "bg-white dark:bg-[#2A2A2A] text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                O‘zimiz tayyorlaymiz
              </button>
              <button
                onClick={() => setCateringMode("ready")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  cateringMode === "ready"
                    ? "bg-[#FF6B00] text-white shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                Tayyor dasturxon
              </button>
            </div>

            {cateringMode === "custom" ? (
              <div className="p-6 rounded-2xl border text-center space-y-2 border-dashed border-zinc-300 dark:border-white/10">
                <Utensils className="w-8 h-8 text-[#FF6B00] mx-auto" />
                <h4 className="text-sm font-bold">Faqat zal ijarasi</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Dasturxon uchun mahsulotlar va taomlar buyurtmachi tomonidan taqdim etiladi.
                </p>
              </div>
            ) : (
              /* Menu Checklist Sections */
              <div className="space-y-3">
                {[
                  {
                    cat: "Salatlar",
                    items: [
                      { id: "salat1", name: "Mujskoy kapriz & Sezar salati" },
                      { id: "salat2", name: "Fransuzcha va Olivye salatlari" },
                    ],
                  },
                  {
                    cat: "Mazzali Gazaklar",
                    items: [
                      { id: "gazak1", name: "Go‘shtli assorti & Qazi plastinkasi" },
                      { id: "gazak2", name: "Pishloqli assorti va ko‘katlar" },
                    ],
                  },
                  {
                    cat: "Asosiy Taomlar",
                    items: [
                      { id: "taom1", name: "Samarqand to‘y oshi (Devzira)" },
                      { id: "taom2", name: "Qo‘y go‘shtidan tandir jiz" },
                    ],
                  },
                  {
                    cat: "Ichimliklar & Desert",
                    items: [
                      { id: "ichimlik1", name: "Tabiiy sharbatlar, kola va choy" },
                      { id: "desert1", name: "Mavsumiy mevalar va to‘y torti" },
                    ],
                  },
                ].map((section, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border space-y-2 ${
                      isDark ? "bg-[#252525] border-white/5" : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#FF6B00] block">{section.cat}</span>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const checked = menuItems[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleMenuItem(item.id)}
                            className="flex items-center justify-between cursor-pointer text-xs font-semibold"
                          >
                            <span>{item.name}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                checked
                                  ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                                  : "border-zinc-300 dark:border-white/20"
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Bar with Menu Total & Next */}
            <div
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 border-t flex items-center justify-between gap-3 ${
                isDark ? "bg-[#1E1E1E] border-white/5" : "bg-white border-zinc-100 shadow-lg"
              }`}
            >
              <div>
                <span className="text-[11px] text-zinc-400 block font-medium">1 kishi uchun:</span>
                <span className="text-sm font-extrabold text-[#FF6B00]">
                  {cateringMode === "ready" ? "125,000 UZS" : "0 UZS"}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 max-w-[200px] py-3.5 px-6 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-[#FF6B00]/25"
              >
                <span>Keyingisi</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 4: STEP 4 - BUYURTMA TAFSILOTLARI (Figma Screen 6)
           ======================================================================= */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 pb-24">
            {/* Venue Header Card */}
            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 ${
                isDark ? "bg-[#252525] border-white/5" : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img
                  src={currentVenue.img}
                  alt={currentVenue.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold">{currentVenue.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  👥 {guestTiers[selectedGuestTier].label}
                </p>
                <p className="text-xs text-[#16A34A] font-semibold mt-0.5">
                  🍽️ {cateringMode === "ready" ? "Premium Gold Catering" : "Faqat zal ijarasi"}
                </p>
              </div>
            </div>

            {/* Detailed Price Report */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? "bg-[#252525] border-white/5" : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <h4 className="text-sm font-bold border-b pb-2 border-zinc-200 dark:border-white/10">
                Detailed Price Report
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hall Rental Fee (Zal ijarasi)</span>
                  <span className="font-bold">{hallRentalFee.toLocaleString()} UZS</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Premium Catering (Dasturxon)</span>
                  <span className="font-bold">{cateringTotal.toLocaleString()} UZS</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Service & Logistics (Xizmat ko‘rsatish)</span>
                  <span className="font-bold">{serviceFee.toLocaleString()} UZS</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-white/10 text-sm">
                  <span className="font-bold">Total Amount Payable</span>
                  <span className="font-extrabold text-[#FF6B00]">
                    {grandTotal.toLocaleString()} UZS
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details Summary */}
            <div className="text-xs text-zinc-500 space-y-1 px-1">
              <div>Sana: 2024-yil {selectedDate}-sentyabr, {selectedTime}</div>
              <div>Manzil: {currentVenue.address}</div>
            </div>

            {/* Bottom Button */}
            <div
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 border-t ${
                isDark ? "bg-[#1E1E1E] border-white/5" : "bg-white border-zinc-100"
              }`}
            >
              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-3.5 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF6B00]/25"
              >
                <span>To‘lovga o‘tish</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 5: STEP 5 - XAVFSIZ TO'LOV (Figma Screen 7)
           ======================================================================= */}
        {currentStep === 5 && (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 pb-24">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Xavfsiz to‘lov</h2>
              <p className="text-xs text-zinc-400">
                To‘yxonani band qilish uchun dastlabki depozit to‘lovi talab etiladi.
              </p>
            </div>

            {/* Deposit Box */}
            <div
              className={`p-4 rounded-2xl border text-center space-y-1 ${
                isDark ? "bg-[#252525] border-white/5" : "bg-green-50/50 border-green-200"
              }`}
            >
              <span className="text-xs text-zinc-500 font-medium block">Dastlabki depozit:</span>
              <span className="text-2xl font-extrabold text-[#16A34A] block">
                {depositAmount.toLocaleString()} so‘m
              </span>
              <span className="text-[10px] text-zinc-400 block">
                (Umumiy to‘lov summasidan chegirib tashlanadi)
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-zinc-400 block">To‘lov usulini tanlang:</span>

              {[
                { id: "card", name: "Bank kartasi", sub: "Uzcard, Humo, Visa, Mastercard" },
                { id: "click", name: "Click Up", sub: "Tezkor to‘lov tizimi" },
                { id: "payme", name: "Payme", sub: "Xavfsiz to‘lov" },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-1 ring-[#FF6B00]"
                        : isDark
                        ? "border-white/5 bg-[#252525] hover:border-white/20"
                        : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{m.name}</span>
                        <span className="text-[10px] text-zinc-400 block">{m.sub}</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                          : "border-zinc-300 dark:border-white/20"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 border-t space-y-2 ${
                isDark ? "bg-[#1E1E1E] border-white/5" : "bg-white border-zinc-100"
              }`}
            >
              <button
                onClick={handlePayDeposit}
                disabled={isProcessingPayment}
                className="w-full py-3.5 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF6B00]/25 disabled:opacity-50 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>To‘lov amalga oshirilmoqda...</span>
                  </>
                ) : (
                  <span>Depozitni to‘lash ({depositAmount.toLocaleString()} UZS)</span>
                )}
              </button>

              <button
                onClick={() => setCurrentStep(4)}
                disabled={isProcessingPayment}
                className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 6: STEP 6 - MUVAFFAQIYATLI TASDIQLASH (Figma Screen 8)
           ======================================================================= */}
        {currentStep === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shadow-lg shadow-[#16A34A]/20">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight">To‘yxona band qilindi!</h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Sizning buyurtmangiz muvaffaqiyatli qabul qilindi. Tasdiq kodi va chek profilingizga
                yuborildi.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div
              className={`w-full p-4 rounded-2xl border text-left space-y-2.5 text-xs ${
                isDark ? "bg-[#252525] border-white/5" : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-zinc-400">To‘yxona:</span>
                <span className="font-bold">{currentVenue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sana:</span>
                <span className="font-bold">2024-yil {selectedDate}-sentyabr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vaqt:</span>
                <span className="font-bold">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mehmonlar:</span>
                <span className="font-bold">{guestTiers[selectedGuestTier].label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Paket:</span>
                <span className="font-bold text-[#16A34A]">
                  {cateringMode === "ready" ? "Premium Paket" : "Faqat zal"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-white/10 font-bold">
                <span>To‘langan depozit:</span>
                <span className="text-[#16A34A] font-extrabold">
                  {depositAmount.toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Return Button */}
            <div className="w-full pt-4">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-[#FF6B00] hover:bg-[#E05000] text-white font-bold text-sm shadow-md shadow-[#FF6B00]/25 active:scale-95 transition-all"
              >
                Bosh sahifaga qaytish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
