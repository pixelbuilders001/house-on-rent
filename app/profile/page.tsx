'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserRound,
  ShieldCheck,
  LogOut,
  Calculator,
  Users,
  Heart,
  Bell,
  ExternalLink,
  Building2,
  MapPin,
  ChevronRight,
  MessageCircle,
  PhoneCall,
  LogIn,
  Home,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export default function Profile() {
  const { user, profile, savedIds, signOut, openAuthModal } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'RoomSaathi Resident';
  const email = user?.email || profile?.email || '';
  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;
  const userInitial = (displayName.charAt(0) || 'R').toUpperCase();

  return (
    <div className="min-h-[80vh] bg-slate-50/60 py-6 md:py-10 pb-28 md:pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold tracking-wide uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Resident Account · मेरा अकाउंट
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Profile & Services
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your stay, shortlisted rooms, and tenant assistance in Samastipur.
          </p>
        </div>

        {/* User Account Card */}
        {user ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-6 transition-all">
            {/* User Profile Header */}
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                  {userInitial}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {displayName}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Resident
                  </span>
                </div>

                {email && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {email}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800/80 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Samastipur, Bihar</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-100">
              <Link
                href="/saved"
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 hover:bg-rose-50/60 border border-slate-100 hover:border-rose-200 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Wishlist</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600">
                  {savedIds.length} {savedIds.length === 1 ? 'Room' : 'Rooms'}
                </span>
              </Link>

              <Link
                href="/my-stay"
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Home className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">My Stay</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                  Active Portal
                </span>
              </Link>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Brokerage</span>
                <span className="text-sm font-bold text-emerald-700">
                  ₹0 Zero
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Logged Out Welcome Card */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-sm shadow-emerald-500/20">
              ⌂
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">
              Welcome to RoomSaathi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
              Sign in to manage your rented room, pay owner via UPI, track shortlisted listings, and contact verified owners in Samastipur.
            </p>

            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer w-full sm:w-auto"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Continue · साइन इन करें</span>
            </button>

            {/* Micro value props */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                100% Zero Brokerage
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Verified Student Rooms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Direct Owner Contact
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Resident & Tenancy Portal */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2.5">
            Tenancy & Rent · किरायेदार पोर्टल
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <Link
              href="/my-stay"
              className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      My Stay · मेरा कमरा
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Monthly rent, UPI payments, rent receipts & maintenance tickets
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
            </Link>
          </div>
        </div>

        {/* Section 2: Explore & Resident Utilities */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2.5">
            Explore & Utilities · सेवाएँ और टूल्स
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {/* Wishlist */}
            <Link
              href="/saved"
              className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Heart className="w-5 h-5 fill-rose-500 group-hover:fill-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Saved Rooms · पसंदीदा कमरे
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {savedIds.length} {savedIds.length === 1 ? 'room' : 'rooms'} shortlisted for comparison
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
            </Link>

            {/* Rent Calculator */}
            <Link
              href="/calculator"
              className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Rent & Expense Calculator · खर्च कैलकुलेटर
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Calculate electricity, food, deposit & monthly student budget
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
            </Link>

            {/* Roommates */}
            <Link
              href="/roommates"
              className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Find Roommates · रूममेट खोजें
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Connect with students & working professionals in Samastipur
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
            </Link>

            {/* Alerts */}
            <Link
              href="/alerts"
              className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    Vacancy Alerts · कमरों के अलर्ट
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Get notified when room rents drop or new PGs open near you
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
            </Link>
          </div>
        </div>

        {/* Section 3: Landlord Portal Card */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2.5">
            Property Owners · मकान मालिक
          </div>

          <a
            href={OWNER_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-gradient-to-r from-sky-50 to-indigo-50/50 hover:from-sky-100/70 hover:to-indigo-100/70 rounded-2xl border border-sky-200/80 p-4 sm:p-4.5 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-sky-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-sky-950">
                      Property Owner Portal · मकान मालिक
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold">
                      Owner
                    </span>
                  </div>
                  <p className="text-xs text-sky-800/80 truncate mt-0.5">
                    List your rooms, manage tenants, send rent reminders & digital khata
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </a>
        </div>

        {/* Section 4: Samastipur Local Resident Helpdesk */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Need Help Finding a Room in Samastipur?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our local support team assists with zero brokerage visits (10 AM - 8 PM).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href="https://wa.me/917461824651?text=Hi%20RoomSaathi,%20I%20need%20help%20finding%20a%20room%20in%20Samastipur"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href="tel:7461824651"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* Section 5: Account Sign Out (Bottom) */}
        {user && (
          <div className="mt-8 pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-200 text-rose-600 text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log Out · बाहर निकलें</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2.5">
              Signed in as {email || displayName}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
