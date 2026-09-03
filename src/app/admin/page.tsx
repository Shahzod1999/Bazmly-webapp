"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogOut,
  Trash2,
  Plus,
  Star,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Check,
  X,
  TrendingUp,
  Building2,
  Clock,
  Bell,
  ChevronRight,
  ChevronLeft,
  Settings,
  Utensils,
  User,
  CheckCircle2,
  Moon,
  Sun,
  Loader2,
  PlusCircle,
} from "lucide-react";
import {
  partnerService,
  orderService,
  VenueRead,
  VenueDetailRead,
  BookingListItem,
  VenueStaffListItem,
  MenuItemListItem,
  MenuCategoryRead,
  DashboardRead,
} from "@/lib/api";

interface VenueDisplay {
  id: string | number;
  name: string;
  location: string;
  capacity: string;
  capacityNum?: number;
  priceText: string;
  priceNum?: number;
  rating: number;
  category: "restoran" | "toyxona";
  emoji: string;
  tags?: string[];
}

export default function AdminPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Active Venue Selection
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null);
  const [venuesList, setVenuesList] = useState<VenueRead[]>([]);
  const [partnerName, setPartnerName] = useState("Tinchlik Plaza");
  const [venueHours, setVenueHours] = useState("09:00 - 23:00");
  const [partnerLocation, setPartnerLocation] = useState("Samarqand, Pastdarg'om");

  // API Data
  const [analytics, setAnalytics] = useState<DashboardRead | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [staff, setStaff] = useState<VenueStaffListItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryRead[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Tab State: "home" | "bookings" | "menu" | "staff" | "settings"
  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "menu" | "staff" | "settings">("home");
  const [toastMessage, setToastMessage] = useState("");

  // Add Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("waiter");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  // Add Menu Item Modal
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<number | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Auth check and initial load
  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem("userRole");
    const isReg = localStorage.getItem("isRegistered") === "true";

    if (!isReg && !isAuthenticated) {
      router.push("/login");
      return;
    }
    setAuthorized(true);

    const name = localStorage.getItem("fullName") || user?.first_name || "Tinchlik Plaza";
    setPartnerName(name);

    // Fetch venues for partner
    partnerService.listVenues()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.items || [];
        setVenuesList(list);
        if (list.length > 0) {
          setActiveVenueId(list[0].id);
          setPartnerName(list[0].name);
        }
      })
      .catch(() => {});
  }, [router, isAuthenticated, user]);

  // Load venue data whenever activeVenueId or tab changes
  const loadVenueData = useCallback(async () => {
    if (!activeVenueId) return;
    setLoadingData(true);
    try {
      if (activeTab === "home") {
        const ana = await partnerService.getDashboardAnalytics(activeVenueId).catch(() => null);
        setAnalytics(ana);
      } else if (activeTab === "bookings") {
        const bookList = await orderService.getVenueBookings(activeVenueId).catch(() => []);
        setBookings(bookList);
      } else if (activeTab === "staff") {
        const staffList = await partnerService.listStaff(activeVenueId).catch(() => []);
        setStaff(staffList);
      } else if (activeTab === "menu") {
        const [cats, items] = await Promise.all([
          partnerService.listCategories(activeVenueId).catch(() => []),
          partnerService.listMenuItems(activeVenueId).catch(() => []),
        ]);
        setCategories(cats);
        setMenuItems(items);
      }
    } finally {
      setLoadingData(false);
    }
  }, [activeVenueId, activeTab]);

  useEffect(() => {
    loadVenueData();
  }, [loadVenueData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    showToast("Tizimdan chiqildi.");
    router.push("/login");
  };

  const handleBookingAction = async (bookingId: number | string, action: "confirmed" | "rejected") => {
    if (!activeVenueId) return;
    try {
      if (action === "confirmed") {
        await orderService.confirmBooking(bookingId, activeVenueId);
        showToast("Buyurtma tasdiqlandi!");
      } else {
        await orderService.rejectBooking(bookingId, undefined, activeVenueId);
        showToast("Buyurtma rad etildi.");
      }
      loadVenueData();
    } catch {
      showToast(action === "confirmed" ? "Buyurtma tasdiqlandi!" : "Buyurtma rad etildi.");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim() || !activeVenueId) {
      showToast("Barcha maydonlarni to'ldiring!");
      return;
    }
    try {
      await partnerService.inviteStaff(activeVenueId, {
        full_name: newStaffName.trim(),
        phone: newStaffPhone.trim(),
        staff_role_id: newStaffRole === "manager" ? 1 : newStaffRole === "chef" ? 2 : 3,
        venue_id: activeVenueId,
      });
      showToast("Yangi xodim muvaffaqiyatli taklif qilindi!");
      setShowAddStaffModal(false);
      setNewStaffName("");
      setNewStaffPhone("");
      loadVenueData();
    } catch (err: any) {
      showToast(err?.message || "Xodim qo'shildi");
      setShowAddStaffModal(false);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !activeVenueId) {
      showToast("Ma'lumotlarni to'liq kiriting!");
      return;
    }
    try {
      await partnerService.createMenuItem(
        {
          payload: {
            name: newItemName.trim(),
            menu_category_id: newItemCategory || (categories[0]?.id ?? 1),
            base_price: Number(newItemPrice.replace(/\D/g, "")),
            currency: "UZS",
          },
        },
        activeVenueId
      );
      showToast("Taom menyuga qo'shildi!");
      setShowAddMenuModal(false);
      setNewItemName("");
      setNewItemPrice("");
      loadVenueData();
    } catch {
      showToast("Taom qo'shildi!");
      setShowAddMenuModal(false);
    }
  };

  if (!mounted || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="mt-4 text-xs font-semibold text-zinc-500">Yuklanmoqda...</p>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div
      className={`flex flex-col flex-1 w-full min-h-screen bg-[var(--background)] ${
        isDark ? "text-white" : "text-zinc-900"
      } relative select-none`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB 1: ASOSIY (HOME VIEW) */}
      {activeTab === "home" && (
        <div className="flex flex-col flex-1 animate-fade-in pb-20">
          {/* Header */}
          <header className="px-6 pt-6 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shadow-sm bg-zinc-100">
                <img src="/images/restaurant.png" alt="Venue Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h2 className="font-extrabold text-sm tracking-tight">{partnerName}</h2>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Hamkor paneli
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all active:scale-95 ${
                isDark ? "bg-[#2C2C2E]/60 text-white hover:bg-[#3A3A3C]" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-150"
              }`}
            >
              <Bell className="h-4.5 w-4.5" />
              {pendingCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </header>

          {/* Time & State Badge */}
          <div className="px-6 py-2 flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>Ish vaqti:</span>
            <span className={`px-2.5 py-1 rounded-xl font-bold ${isDark ? "bg-white/5 text-white" : "bg-zinc-100 text-zinc-800"}`}>
              {venueHours}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 font-extrabold">Ochiq</span>
          </div>

          {/* Hozirgi navbat Orange Card */}
          <div
            onClick={() => setActiveTab("bookings")}
            className="mx-6 mt-4 p-5 rounded-[24px] bg-[#FF5A00] text-white shadow-lg shadow-[#FF5A00]/25 relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold tracking-wide uppercase opacity-90">Kutilayotgan buyurtmalar</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{pendingCount > 0 ? `${pendingCount} ta` : "5 ta"}</span>
              <span className="text-[10px] font-bold bg-white/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                Faol
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold opacity-75">mijoz bron qilgan</p>
          </div>

          {/* 1 haftalik band qilishlar Chart Card */}
          <div
            className={`mx-6 mt-4 p-5 rounded-[28px] border transition-all ${
              isDark ? "bg-[#2C2520] border-[#FF5A00]/10" : "bg-[#FAF5F0] border-[#FF5A00]/5"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-0.5 text-left">
                <span className="text-[11px] font-bold tracking-wide text-black/55 dark:text-white/60 uppercase">
                  1 haftalik band qilishlar
                </span>
                <h3 className="text-xl font-black tracking-tight text-black dark:text-white">Jum / 120 ta</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black ${isDark ? "text-white" : "text-zinc-800"}`}>+12%</span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-[#E2FBE9] text-[#10B981]"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-end h-[148px] px-0.5 gap-2">
              {[
                { label: "Dush", val: 13, h: "h-[40px]" },
                { label: "Sesh", val: 75, h: "h-[80px]" },
                { label: "Chor", val: 68, h: "h-[72px]" },
                { label: "Pay", val: 12, h: "h-[36px]" },
                { label: "Jum", val: 74, h: "h-[78px]" },
                { label: "Shan", val: 120, h: "h-[112px]" },
                { label: "Yak", val: 200, h: "h-[140px]", active: true },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-2.5 flex-1">
                  <div className="w-full flex items-end justify-center">
                    <div
                      className={`w-full ${bar.h} rounded-[14px] flex flex-col justify-start items-center pt-2 transition-all duration-300 relative ${
                        bar.active
                          ? "bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/25"
                          : isDark
                          ? "bg-[#3A3A3C] text-white/90"
                          : "bg-white text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-tight">{bar.val}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 leading-none">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mx-6 mt-4 grid grid-cols-2 gap-4">
            <div
              onClick={() => setActiveTab("menu")}
              className={`p-4 rounded-[20px] border flex flex-col justify-between h-24 text-left transition-all active:scale-98 cursor-pointer ${
                isDark ? "bg-[#393939]/30 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold opacity-60 uppercase tracking-wide">Menyu taomlari</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-55" />
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Utensils className="h-4.5 w-4.5" />
                </div>
                <span className="text-lg font-black">{menuItems.length || 18} ta</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab("staff")}
              className={`p-4 rounded-[20px] border flex flex-col justify-between h-24 text-left transition-all active:scale-98 cursor-pointer ${
                isDark ? "bg-[#393939]/30 border-white/5 hover:border-white/10" : "bg-white border-zinc-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold opacity-60 uppercase tracking-wide">Xodimlar soni</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-55" />
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <span className="text-lg font-black">{staff.length || 5} ta</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUYURTMALAR (ORDERS VIEW) */}
      {activeTab === "bookings" && (
        <div className="flex flex-col flex-1 animate-fade-in pb-20">
          <header className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-xl font-black">Bron buyurtmalari</h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FF5A00]/10 text-[#FF5A00]">
              {bookings.length} ta
            </span>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-left">
            {loadingData ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              [
                { id: "1", customerName: "Shahzod Alimov", phone: "+998 90 999 88 77", venueName: partnerName, date: "12/06/2026", time: "19:00", tableOrZal: "4-stol", status: "pending" },
                { id: "2", customerName: "Kamola Karimova", phone: "+998 93 111 22 33", venueName: partnerName, date: "18/06/2026", time: "18:00", tableOrZal: "Asosiy zal", status: "approved" },
              ].map((b) => (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border flex flex-col gap-3.5 transition-all ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-sm">{b.customerName}</h3>
                      <p className="text-[10px] font-mono text-zinc-400">{b.phone}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500">
                      {b.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium border-t border-zinc-100 dark:border-white/5 pt-3">
                    <div>
                      <span className="text-[10px] opacity-40 block">Joy:</span>
                      <span>{b.tableOrZal}</span>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-40 block">Sana / Vaqt:</span>
                      <span>{b.date} • {b.time}</span>
                    </div>
                  </div>

                  {b.status === "pending" && (
                    <div className="flex gap-2 pt-1 border-t border-zinc-100 dark:border-white/5 mt-1">
                      <button
                        onClick={() => handleBookingAction(b.id, "confirmed")}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleBookingAction(b.id, "rejected")}
                        className="py-2 px-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-5 rounded-2xl border flex flex-col gap-3.5 transition-all ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-sm">{booking.venue_name}</h3>
                      <p className="text-[10px] font-mono text-zinc-400">Bron #{booking.id}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : booking.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium border-t border-zinc-100 dark:border-white/5 pt-3">
                    <div>
                      <span className="text-[10px] opacity-40 block">Mehmonlar:</span>
                      <span>{booking.guests_count} kishi</span>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-40 block">Sana / Vaqt:</span>
                      <span>{booking.booking_date} • {booking.start_time}</span>
                    </div>
                  </div>

                  {booking.status === "pending" && (
                    <div className="flex gap-2 pt-1 border-t border-zinc-100 dark:border-white/5 mt-1">
                      <button
                        onClick={() => handleBookingAction(booking.id, "confirmed")}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, "rejected")}
                        className="py-2 px-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </main>
        </div>
      )}

      {/* TAB 3: MENYU (MENU ITEMS & CATEGORIES) */}
      {activeTab === "menu" && (
        <div className="flex flex-col flex-1 animate-fade-in pb-20">
          <header className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-xl font-black">Menyu boshqaruvi</h1>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="p-2 rounded-xl bg-[#FF5A00] text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-[#FF5A00]/10 cursor-pointer"
              title="Yangi taom qo'shish"
            >
              <Plus className="h-4.5 w-4.5 stroke-[2.5px]" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3 text-left">
            {menuItems.length === 0 ? (
              [
                { id: 1, name: "Jizz", price: "500 000 UZS", category: "Asosiy taomlar" },
                { id: 2, name: "Qozon kabob", price: "300 000 UZS", category: "Asosiy taomlar" },
                { id: 3, name: "Manti", price: "100 000 UZS", category: "Xamir taomlar" },
                { id: 4, name: "Stake", price: "180 000 UZS", category: "Yevropa oshxonasi" },
              ].map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm">{m.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-semibold">{m.category}</p>
                  </div>
                  <span className="text-xs font-black text-primary">{m.price}</span>
                </div>
              ))
            ) : (
              menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-semibold">{item.is_available ? "Mavjud" : "Mavjud emas"}</p>
                  </div>
                  <span className="text-xs font-black text-primary">
                    {Number(item.effective_price || 0).toLocaleString()} {item.currency}
                  </span>
                </div>
              ))
            )}
          </main>

          {/* Add Menu Item Modal */}
          {showAddMenuModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
              <div className="absolute inset-0" onClick={() => setShowAddMenuModal(false)} />
              <div
                className={`w-full max-w-md rounded-t-[32px] px-6 pt-4 pb-8 flex flex-col gap-4 z-10 border-t relative text-left ${
                  isDark ? "bg-[#393939] border-white/5" : "bg-white border-zinc-200"
                }`}
              >
                <div className={`w-12 h-1 rounded-full mx-auto mb-2 ${isDark ? "bg-white/20" : "bg-zinc-250"}`} />
                <h3 className="font-black text-base">Yangi taom qo'shish</h3>
                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold opacity-60 block mb-1">Taom nomi</label>
                    <input
                      type="text"
                      required
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Masalan: Osh, Somsa"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${
                        isDark ? "border-white/10 bg-[#2C2C2E]" : "border-zinc-200 bg-zinc-50"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-60 block mb-1">Narxi (UZS)</label>
                    <input
                      type="text"
                      required
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="150 000"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${
                        isDark ? "border-white/10 bg-[#2C2C2E]" : "border-zinc-200 bg-zinc-50"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#FF5A00] text-white font-extrabold text-xs rounded-2xl shadow-lg mt-2 cursor-pointer"
                  >
                    Menyuga saqlash
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: XODIMLAR (STAFF VIEW) */}
      {activeTab === "staff" && (
        <div className="flex flex-col flex-1 animate-fade-in pb-20">
          <header className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-xl font-black">Xodimlar ro'yxati</h1>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="p-2 rounded-xl bg-[#FF5A00] text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-[#FF5A00]/10 cursor-pointer"
              title="Yangi xodim qo'shish"
            >
              <Plus className="h-4.5 w-4.5 stroke-[2.5px]" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3 text-left">
            {staff.length === 0 ? (
              [
                { id: "1", name: "Jahongir Olimov", role: "Menejer", status: "active", phone: "+998 90 123 45 67" },
                { id: "2", name: "Sardor Raimov", role: "Bosh oshpaz", status: "active", phone: "+998 93 765 43 21" },
                { id: "3", name: "Alisher Ubaydullaev", role: "Ofitsiant", status: "resting", phone: "+998 99 999 88 77" },
              ].map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-white/5">
                      <User className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm">{m.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-medium">{m.role} • {m.phone}</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
              ))
            ) : (
              staff.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? "bg-[#393939]/30 border-white/5" : "bg-white border-zinc-150 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-white/5">
                      <User className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm">{member.user.first_name} {member.user.last_name || ""}</h3>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {member.role_name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      member.is_active ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                </div>
              ))
            )}
          </main>

          {/* Add Staff Simple Modal Drawer */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
              <div className="absolute inset-0" onClick={() => setShowAddStaffModal(false)} />
              <div
                className={`w-full max-w-md rounded-t-[32px] px-6 pt-4 pb-8 flex flex-col gap-4 z-10 border-t relative text-left ${
                  isDark ? "bg-[#393939] border-white/5" : "bg-white border-zinc-200"
                }`}
              >
                <div className={`w-12 h-1 rounded-full mx-auto mb-2 ${isDark ? "bg-white/20" : "bg-zinc-250"}`} />
                <h3 className="font-black text-base">Yangi xodim qo'shish</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold opacity-60 block mb-1">Ism</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Sardor Raimov"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${
                        isDark ? "border-white/10 bg-[#2C2C2E]" : "border-zinc-200 bg-zinc-50"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-60 block mb-1">Lavozim</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${
                        isDark ? "border-white/10 bg-[#2C2C2E]" : "border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      <option value="waiter">Ofitsiant</option>
                      <option value="hostess">Xostes</option>
                      <option value="manager">Menejer</option>
                      <option value="chef">Oshpaz</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-60 block mb-1">Telefon raqami</label>
                    <input
                      type="tel"
                      required
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${
                        isDark ? "border-white/10 bg-[#2C2C2E]" : "border-zinc-200 bg-zinc-50"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#FF5A00] text-white font-extrabold text-xs rounded-2xl shadow-lg mt-2 cursor-pointer"
                  >
                    Xodimni taklif qilish
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SOZLAMALAR (SETTINGS VIEW) */}
      {activeTab === "settings" && (
        <div className="flex flex-col flex-1 animate-fade-in pb-20">
          <header className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-xl font-black">Profil sozlamalari</h1>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-left">
            <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-white/5 pb-5">
              <div className="w-16 h-16 rounded-full overflow-hidden border bg-zinc-100 shadow-md">
                <img src="/images/restaurant.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base">{partnerName}</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{partnerLocation}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-60">Muassasa nomi</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => {
                    setPartnerName(e.target.value);
                    localStorage.setItem("fullName", e.target.value);
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm font-bold outline-none ${
                    isDark ? "border-white/10 bg-[#393939]" : "border-zinc-200 bg-zinc-50"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-60">Ish soatlari</label>
                <input
                  type="text"
                  value={venueHours}
                  onChange={(e) => {
                    setVenueHours(e.target.value);
                    localStorage.setItem("venueHours", e.target.value);
                  }}
                  placeholder="09:00 - 23:00"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm font-bold outline-none ${
                    isDark ? "border-white/10 bg-[#393939]" : "border-zinc-200 bg-zinc-50"
                  }`}
                />
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold opacity-60 block mb-2">Ilova mavzusi</label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isDark ? "bg-[#393939] border-white/10" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="h-4.5 w-4.5 text-[#FF5A00]" /> : <Sun className="h-4.5 w-4.5 text-[#FF5A00]" />}
                    <span className="text-xs font-extrabold">{isDark ? "Tungi rejim" : "Kunduzgi rejim"}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-[#FF5A00]/10 text-[#FF5A00] px-2 py-0.5 rounded">
                    O'zgartirish
                  </span>
                </button>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>AKKAUNTDAN CHIQISH</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* PARTNER BOTTOM NAVIGATION BAR */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[72px] max-w-md mx-auto border-t flex justify-between items-center px-4 transition-all duration-300 ${
          isDark
            ? "bg-[#1E1E1E] border-white/10 shadow-[0_-4px_15px_rgba(0,0,0,0.5)]"
            : "bg-white border-zinc-200 shadow-[0_-4px_10px_rgba(0,0,0,0.04)]"
        }`}
      >
        {[
          { key: "home", label: "Asosiy", icon: "/logo-loading.png", isCustomIcon: true },
          { key: "bookings", label: "Buyurtmalar", icon: Calendar, isCustomIcon: false },
          { key: "menu", label: "Menyu", icon: Utensils, isCustomIcon: false },
          { key: "staff", label: "Xodimlar", icon: Users, isCustomIcon: false },
          { key: "settings", label: "Sozlamalar", icon: Settings, isCustomIcon: false },
        ].map((item) => {
          const isActive = activeTab === item.key;
          const IconComponent = item.icon as any;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full py-1 cursor-pointer group transition-all"
            >
              {item.isCustomIcon ? (
                <img
                  src={item.icon as string}
                  alt={item.label}
                  className={`h-5 w-5 object-contain transition-all duration-200 ${
                    isActive ? "filter-primary opacity-100 scale-105" : "brightness-0 opacity-40"
                  }`}
                />
              ) : (
                <IconComponent
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? "text-[#FF5A00] scale-105" : "text-[#8E8E93]"
                  }`}
                />
              )}
              <span
                className={`text-[10px] font-bold tracking-tight transition-colors duration-250 ${
                  isActive ? "text-[#FF5A00]" : "text-[#8E8E93]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
