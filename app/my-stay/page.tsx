'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  IndianRupee,
  Receipt,
  Wrench,
  UsersRound,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  ShieldCheck,
  Send,
  Building2,
  X,
  FileText,
  Printer,
  PenLine,
  Download,
  Check,
  Sparkles,
  MapPin,
  ArrowUpRight,
  Copy,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchActiveStay,
  fetchTenantRentRecords,
  fetchTenantComplaints,
  submitTenantComplaint,
  fetchRoommates,
  fetchTenantVisits,
  markRentPaidOnline,
  fetchTenantAgreement,
  submitTenantAgreementSignature,
  type ActiveTenantStay,
  type RentRecordItem,
  type ComplaintItem,
  type RoommateItem,
  type VisitRequestItem,
  type TenantAgreement
} from '@/lib/services/tenantService';
import { TenantSignatureModal } from '@/components/agreement/TenantSignatureModal';
import { AgreementViewerModal } from '@/components/agreement/AgreementViewerModal';

export default function MyStayPage() {
  const { user, profile, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'rent' | 'agreement' | 'complaints' | 'roommates' | 'visits'>('rent');
  const [loading, setLoading] = useState(true);
  const [stay, setStay] = useState<ActiveTenantStay | null>(null);
  const [rentRecords, setRentRecords] = useState<RentRecordItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [roommates, setRoommates] = useState<RoommateItem[]>([]);
  const [visits, setVisits] = useState<VisitRequestItem[]>([]);
  const [agreement, setAgreement] = useState<TenantAgreement | null>(null);

  // Modals state
  const [showSignModal, setShowSignModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [isSigningAgreement, setIsSigningAgreement] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState<RentRecordItem | null>(null);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<RentRecordItem | null>(null);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: 'wifi',
    priority: 'medium',
    title: '',
    description: ''
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  // Load active stay and rent agreement data
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const userEmail = user?.email || profile?.email || null;
      const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || (typeof window !== 'undefined' ? localStorage.getItem('roomsaathi_tenant_phone') : null);
      const userProfileId = user?.id || null;
      const userFullName = profile?.full_name || user?.user_metadata?.full_name || null;

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const signingTokenParam = urlParams?.get('signAgreement') || urlParams?.get('token') || urlParams?.get('agreement') || null;

      try {
        let liveStay: ActiveTenantStay | null = null;
        if (user || userPhone || userEmail) {
          liveStay = await fetchActiveStay({
            email: userEmail,
            phone: userPhone,
            profileId: userProfileId,
            fullName: userFullName
          });
        }

        if (liveStay) {
          setStay(liveStay);
          const [rents, comps, mates, ag] = await Promise.all([
            fetchTenantRentRecords(liveStay.tenant.id),
            fetchTenantComplaints(liveStay.tenant.propertyId, liveStay.tenant.fullName),
            fetchRoommates(liveStay.tenant.propertyId, liveStay.tenant.id, liveStay.tenant.roomId),
            fetchTenantAgreement({
              tenantId: liveStay.tenant.id,
              phone: liveStay.tenant.phone || userPhone,
              fullName: liveStay.tenant.fullName,
              token: signingTokenParam
            })
          ]);
          setRentRecords(rents);
          setComplaints(comps);
          setRoommates(mates);
          if (ag) {
            setAgreement(ag);
            if (signingTokenParam) {
              setActiveTab('agreement');
              if (!ag.tenantSignature) {
                setShowSignModal(true);
              }
            }
          }
        } else {
          setStay(null);
          // Check for agreement by token, phone or name if stay is not linked yet
          if (signingTokenParam || userPhone || userFullName) {
            const ag = await fetchTenantAgreement({
              token: signingTokenParam,
              phone: userPhone,
              fullName: userFullName
            });
            if (ag) {
              setAgreement(ag);
              if (signingTokenParam) {
                setActiveTab('agreement');
                if (!ag.tenantSignature) {
                  setShowSignModal(true);
                }
              }
            }
          }
        }

        // Also fetch any visits requested with phone or email
        if (userPhone || userEmail) {
          const v = await fetchTenantVisits(userPhone || userEmail || '');
          setVisits(v);
        }
      } catch (err) {
        console.error('Error loading resident portal data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, profile]);

  // Periodic polling for real-time agreement sync (e.g. when owner signs in owner portal)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || (typeof window !== 'undefined' ? localStorage.getItem('roomsaathi_tenant_phone') : null);
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const signingTokenParam = urlParams?.get('signAgreement') || urlParams?.get('token') || urlParams?.get('agreement') || null;

      if (!stay && !signingTokenParam && !userPhone && !agreement) return;

      try {
        const liveAg = await fetchTenantAgreement({
          tenantId: stay?.tenant?.id,
          phone: stay?.tenant?.phone || userPhone,
          fullName: stay?.tenant?.fullName || profile?.full_name || null,
          token: signingTokenParam || agreement?.signingToken || agreement?.id
        });
        if (liveAg) {
          setAgreement(prev => {
            if (!prev) return liveAg;
            if (
              liveAg.status !== prev.status ||
              liveAg.ownerSignature !== prev.ownerSignature ||
              liveAg.tenantSignature !== prev.tenantSignature ||
              liveAg.signedPdfBase64 !== prev.signedPdfBase64
            ) {
              return liveAg;
            }
            return prev;
          });
        }
      } catch (e) {
        // quiet polling failure
      }
    }, 4500);

    return () => clearInterval(pollInterval);
  }, [stay, agreement, user, profile]);

  const handleSaveTenantSignature = async (sigDataUri: string) => {
    if (!agreement) return;
    setIsSigningAgreement(true);
    try {
      const res = await submitTenantAgreementSignature(agreement, sigDataUri);
      if (res.success && res.agreement) {
        setAgreement(res.agreement);
        setShowSignModal(false);
        setActiveTab('agreement');
      } else {
        alert(res.error || 'Failed to submit signature. Please try again.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error executing agreement signature.');
    } finally {
      setIsSigningAgreement(false);
    }
  };

  const handleDownloadAgreementPdf = () => {
    const pdfUrl = agreement?.signedPdfBase64 || agreement?.pdfBase64;
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Executed_Rent_Agreement_${(agreement?.tenantName || 'Tenant').replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeRentDue = rentRecords.find(r => r.status === 'pending' || r.status === 'overdue') || rentRecords[0];

  const handleOpenPayModal = (record: RentRecordItem) => {
    setPayingRecord(record);
    setPaymentUtr('');
    setPaymentSubmitted(false);
    setCopiedUpi(false);
    setShowPayModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!payingRecord) return;

    const ok = await markRentPaidOnline(payingRecord.id, 'UPI', paymentUtr);
    if (ok) {
      setRentRecords(prev =>
        prev.map(r =>
          r.id === payingRecord.id
            ? { ...r, status: 'paid', paidDate: new Date().toISOString().split('T')[0], paymentMethod: 'UPI', transactionRef: paymentUtr || 'UPI-VERIFIED' }
            : r
        )
      );
      setPaymentSubmitted(true);
      setTimeout(() => setShowPayModal(false), 1500);
    } else {
      alert('Could not update payment status. Please try again.');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stay || !complaintForm.title.trim()) return;

    setSubmittingComplaint(true);

    const res = await submitTenantComplaint({
      propertyId: stay.tenant.propertyId,
      propertyName: stay.property?.name || 'Property',
      tenantName: stay.tenant.fullName,
      roomNumber: stay.tenant.roomNumber,
      category: complaintForm.category,
      title: complaintForm.title,
      description: complaintForm.description,
      priority: complaintForm.priority
    });

    setSubmittingComplaint(false);
    if (res.success) {
      setComplaintSuccess(true);
      const comps = await fetchTenantComplaints(stay.tenant.propertyId, stay.tenant.fullName);
      setComplaints(comps);
      setTimeout(() => {
        setShowComplaintModal(false);
        setComplaintSuccess(false);
        setComplaintForm({ category: 'wifi', priority: 'medium', title: '', description: '' });
      }, 1200);
    } else {
      alert(res.error || 'Failed to submit complaint');
    }
  };

  const upiIdString = stay?.property?.upiId || 'roomsaathi@upi';
  const upiUrl = payingRecord && stay?.property?.upiId
    ? `upi://pay?pa=${encodeURIComponent(stay.property.upiId)}&pn=${encodeURIComponent(stay.property.ownerName || 'Owner')}&am=${payingRecord.totalAmount}&cu=INR&tn=${encodeURIComponent(`${stay.property.name} Rent ${payingRecord.month}`)}`
    : `upi://pay?pa=${encodeURIComponent(upiIdString)}&pn=Owner&am=${payingRecord?.totalAmount || 0}&cu=INR`;

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(upiIdString);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const pendingComplaintsCount = complaints.filter(c => c.status !== 'resolved').length;
  const isAgreementSigned = Boolean(agreement?.status === 'completed' || agreement?.tenantSignature);

  return (
    <div className="min-h-[85vh] bg-slate-50/60 py-6 md:py-10 pb-28 md:pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold tracking-wide uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Resident Portal · किरायेदार पोर्टल
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Stay
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your room details, pay rent directly to owner via UPI, view receipts, and raise maintenance tickets.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center">
            <div className="w-9 h-9 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading your room details from RoomSaathi...</p>
          </div>
        ) : !stay ? (
          /* Empty / Not Linked Stay State */
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              {user ? 'No Active Stay Linked Yet' : 'Sign in to View Your Active Stay'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {user
                ? `Hi ${profile?.full_name || user.email}! When your property owner onboards your mobile number (${profile?.phone || 'not set'}) or email, your room details, UPI rent invoices, and legal lease will automatically appear here.`
                : 'Sign in with your registered phone or Google account to access your digital room pass, rent payment khata, and maintenance desk.'}
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              {!user ? (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Sign In to View Stay
                </button>
              ) : (
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  Explore Rooms in Samastipur
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Active Stay Linked Portal */
          <div className="space-y-6">

            {/* Main Resident Property Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Active Resident · सक्रिय
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Since {stay.tenant.checkInDate}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {stay.property?.name || 'My Rented Property'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{stay.property?.address}, {stay.property?.area}, {stay.property?.city}</span>
                  </p>
                </div>

                {/* Owner Contact Quick Actions */}
                {stay.property?.ownerPhone && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <a
                      href={`https://wa.me/91${stay.property.ownerPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(stay.property.ownerName || 'Owner')},%20this%20is%20${encodeURIComponent(stay.tenant.fullName)}%20from%20Room%20${stay.tenant.roomNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="WhatsApp Owner"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${stay.property.ownerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                      title="Call Owner"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Owner</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Room & Stay Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Room & Bed</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block truncate">
                    Room {stay.tenant.roomNumber} {stay.tenant.bedLabel ? `· Bed ${stay.tenant.bedLabel}` : ''}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Monthly Rent</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 block">
                    ₹{stay.tenant.monthlyRent.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Security Deposit</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                    ₹{stay.tenant.depositPaid.toLocaleString('en-IN')} <span className="text-xs font-medium text-emerald-700">✓</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Resident Pass</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Quick Agreement Alert Strip if Agreement Exists */}
              {agreement && (
                <div className={`mt-4 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isAgreementSigned
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAgreementSigned ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {isAgreementSigned
                            ? 'Tenancy Agreement Executed · अनुबंध हस्ताक्षरित'
                            : 'Review & Sign Tenancy Agreement · हस्ताक्षर करें'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isAgreementSigned ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {isAgreementSigned ? 'Executed ✓' : 'Action Needed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {isAgreementSigned
                          ? `Digitally verified 11-month lease for Room ${agreement.roomNumber}.`
                          : `Owner ${agreement.ownerName} has signed. Add your digital signature to finalize.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    {!isAgreementSigned && (
                      <button
                        type="button"
                        onClick={() => setShowSignModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Sign Now</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('agreement');
                        setShowAgreementModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <span>View</span>
                    </button>
                    {(agreement.signedPdfBase64 || agreement.pdfBase64) && (
                      <button
                        type="button"
                        onClick={handleDownloadAgreementPdf}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile App Style Segmented Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto no-scrollbar">
              {[
                { id: 'rent', label: 'Rent & Khata', icon: IndianRupee, badge: activeRentDue?.status === 'pending' || activeRentDue?.status === 'overdue' ? '!' : null },
                {
                  id: 'agreement',
                  label: 'Agreement',
                  icon: FileText,
                  badge: agreement && !isAgreementSigned ? '1' : null
                },
                {
                  id: 'complaints',
                  label: 'Maintenance',
                  icon: Wrench,
                  badge: pendingComplaintsCount > 0 ? String(pendingComplaintsCount) : null
                },
                { id: 'roommates', label: 'Roommates', icon: UsersRound, badge: roommates.length > 0 ? String(roommates.length) : null },
                { id: 'visits', label: 'Visits', icon: Calendar, badge: visits.length > 0 ? String(visits.length) : null }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: RENT & INVOICES */}
            {activeTab === 'rent' && (
              <div className="space-y-4">
                {/* Active / Current Month Hero Invoice */}
                {activeRentDue ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            activeRentDue.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : activeRentDue.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {activeRentDue.status === 'paid' ? 'Paid · भुगतान पूर्ण' : activeRentDue.status === 'overdue' ? 'Overdue · बकाया' : 'Rent Due · देय'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Invoice for {activeRentDue.month}
                          </span>
                        </div>

                        <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                          ₹{activeRentDue.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Payment due date: <span className="font-semibold text-slate-700">{activeRentDue.dueDate}</span>
                        </div>
                      </div>

                      {/* Primary CTA */}
                      <div>
                        {activeRentDue.status !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(activeRentDue)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Pay Owner via UPI</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt(activeRentDue);
                              setShowReceiptModal(true);
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-4 h-4 text-emerald-600" />
                            <span>View Digital Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Itemized Rent Breakdown */}
                    <div className="pt-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Invoice Itemization · खर्च विवरण
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 block text-[11px]">Room Base Rent</span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{activeRentDue.baseRent}</span>
                        </div>
                        {Boolean(activeRentDue.electricityAmount) && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 block text-[11px]">Electricity ({activeRentDue.electricityUnits || 0}u)</span>
                            <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{activeRentDue.electricityAmount}</span>
                          </div>
                        )}
                        {Boolean(activeRentDue.wifiAmount) && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 block text-[11px]">WiFi Charge</span>
                            <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{activeRentDue.wifiAmount}</span>
                          </div>
                        )}
                        {Boolean(activeRentDue.foodAmount) && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 block text-[11px]">Food / Mess</span>
                            <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{activeRentDue.foodAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Billing History Section */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Payment History · पिछला किराया
                    </h3>
                    <span className="text-xs text-slate-400">
                      {rentRecords.length} records
                    </span>
                  </div>

                  {rentRecords.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      No invoices posted by landlord yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {rentRecords.map(record => (
                        <div
                          key={record.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              record.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {record.month}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                Due: {record.dueDate} {record.paidDate ? `· Paid: ${record.paidDate}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                                ₹{record.totalAmount.toLocaleString('en-IN')}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                                record.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {record.status}
                              </span>
                            </div>

                            {record.status === 'paid' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt(record);
                                  setShowReceiptModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                              >
                                Receipt
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(record)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TENANCY AGREEMENT */}
            {activeTab === 'agreement' && (
              <div className="space-y-5">
                {!agreement ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                      No Rent Agreement Issued Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                      Your owner hasn&apos;t generated the digital 11-month lease agreement for Room {stay?.tenant?.roomNumber || ''} yet. Once issued, you can review, sign with your finger, and download it here.
                    </p>
                    {stay?.property?.ownerPhone && (
                      <a
                        href={`https://wa.me/91${stay.property.ownerPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(stay.property.ownerName || 'Owner')},%20could%20you%20please%20generate%20the%20digital%20rent%20agreement%20for%20my%20stay%20in%20Room%20${stay.tenant.roomNumber}?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Request Agreement on WhatsApp</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status Header Banner */}
                    <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      isAgreementSigned
                        ? 'bg-gradient-to-br from-emerald-800 to-teal-900 text-white border-emerald-700 shadow-sm'
                        : 'bg-gradient-to-br from-amber-900 to-stone-900 text-white border-amber-800 shadow-sm'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="max-w-lg">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold tracking-wide uppercase mb-2">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isAgreementSigned
                              ? 'Legally Executed · पूर्ण अनुबंध'
                              : 'Pending Tenant Signature · हस्ताक्षर आवश्यक'}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            {isAgreementSigned
                              ? '11-Month Tenancy Agreement Executed'
                              : 'Review & Sign Your Tenancy Agreement'}
                          </h2>
                          <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
                            {isAgreementSigned
                              ? `Both property owner ${agreement.ownerName} and tenant ${agreement.tenantName} have signed this legal lease for Room ${agreement.roomNumber}. Permanent record stored securely.`
                              : `Owner ${agreement.ownerName} has signed. Add your digital signature to finalize legally binding contract.`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          {!isAgreementSigned && (
                            <button
                              type="button"
                              onClick={() => setShowSignModal(true)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              <PenLine className="w-4 h-4" />
                              <span>Sign Now</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAgreementModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold border border-white/30 transition-colors cursor-pointer"
                          >
                            <span>Fullscreen</span>
                          </button>
                          {(agreement.signedPdfBase64 || agreement.pdfBase64) && (
                            <button
                              type="button"
                              onClick={handleDownloadAgreementPdf}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-emerald-600" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agreement Key Terms Grid */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Monthly Rent</span>
                        <span className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 block">
                          ₹{agreement.monthlyRent.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Payable by 5th</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Security Deposit</span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                          ₹{agreement.depositAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Refundable</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                          {agreement.durationMonths || 11} Months
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">From {agreement.startDate}</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Room Allotted</span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                          Room {agreement.roomNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{agreement.propertyName}</span>
                      </div>
                    </div>

                    {/* Dual Signature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Property Owner Party */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              First Party · Landlord
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {agreement.ownerSignature ? 'Signed ✓' : 'Pending'}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {agreement.ownerName || 'Property Landlord'}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Phone: {agreement.ownerPhone || 'N/A'}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {agreement.ownerSignature ? (
                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                              <img
                                src={agreement.ownerSignature}
                                alt="Landlord Signature"
                                className="h-10 max-w-[120px] object-contain"
                              />
                              <span className="text-[10px] font-semibold text-emerald-700">Verified</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 text-center py-2">
                              Awaiting landlord signature
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tenant Party (You) */}
                      <div className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col justify-between ${
                        isAgreementSigned ? 'border-slate-200/80' : 'border-amber-300'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Second Party · Tenant (You)
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              agreement.tenantSignature ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              {agreement.tenantSignature ? 'Signed by You ✓' : 'Action Required'}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {agreement.tenantName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Phone: {agreement.tenantPhone} {agreement.tenantAadhaar ? `· Aadhaar: ${agreement.tenantAadhaar}` : ''}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {agreement.tenantSignature ? (
                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                              <img
                                src={agreement.tenantSignature}
                                alt="Tenant Signature"
                                className="h-10 max-w-[120px] object-contain"
                              />
                              <span className="text-[10px] font-semibold text-emerald-700">Verified</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSignModal(true)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              <PenLine className="w-3.5 h-3.5" />
                              <span>Draw Signature Now</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PDF Reader / Frame */}
                    {(agreement.signedPdfBase64 || agreement.pdfBase64) && (
                      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            Official Lease Document Frame
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowAgreementModal(true)}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Open Fullscreen Reader →
                          </button>
                        </div>
                        <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                          <iframe
                            src={`${agreement.signedPdfBase64 || agreement.pdfBase64}#toolbar=0`}
                            title="Agreement Document Frame"
                            className="w-full h-full border-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MAINTENANCE TICKETS */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Maintenance & Helpdesk
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Report plumbing, WiFi, electrical issues directly to property manager.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Ticket</span>
                  </button>
                </div>

                {complaints.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                    <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">No maintenance tickets raised</p>
                    <p className="text-xs text-slate-500 mb-4">Facing any issue in your room? Your owner is one ticket away.</p>
                    <button
                      type="button"
                      onClick={() => setShowComplaintModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Raise Your First Ticket</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {complaints.map(c => (
                      <div
                        key={c.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {c.status.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                              {c.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {c.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {c.description}
                        </p>

                        {c.adminNote && (
                          <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950">
                            <span className="font-bold text-emerald-800">Owner Response:</span> {c.adminNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ROOMMATES */}
            {activeTab === 'roommates' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Roommates & Co-Residents
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Other students and working professionals living in your room or flat.
                  </p>
                </div>

                {roommates.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                    <UsersRound className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">Single Occupancy / No Co-Residents Listed</p>
                    <p className="text-xs text-slate-500">Currently no other roommates assigned to this room by landlord.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {roommates.map(m => (
                      <div
                        key={m.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-4.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                              Room {m.roomNumber} {m.bedLabel ? `· Bed ${m.bedLabel}` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400">Since {m.checkInDate}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {m.fullName}
                          </h4>
                          {m.collegeOrWork && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {m.collegeOrWork}
                            </p>
                          )}
                        </div>

                        {m.phone && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                            <a
                              href={`https://wa.me/91${m.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${m.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                              title="Call Roommate"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PROPERTY VISITS */}
            {activeTab === 'visits' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Property Visits & Inquiries
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visits scheduled through RoomSaathi to view rooms and PGs.
                  </p>
                </div>

                {visits.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">No upcoming visits scheduled</p>
                    <p className="text-xs text-slate-500 mb-4">Want to explore another room or PG in Samastipur?</p>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <span>Find Rooms to Visit</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visits.map(v => (
                      <div
                        key={v.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {v.status}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Requested {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">
                          {v.propertyName}
                        </h4>

                        {v.visitDate && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mt-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Scheduled for: <b>{v.visitDate} {v.visitTime ? `at ${v.visitTime}` : ''}</b></span>
                          </div>
                        )}

                        {v.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            Note: {v.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL 1: UPI RENT PAYMENT MODAL (Mobile Bottom Sheet / Desktop Dialog)
          ========================================================================= */}
      {showPayModal && payingRecord && stay && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Owner UPI Payment</h3>
                  <p className="text-[11px] text-slate-400">Rent for {payingRecord.month}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Rent Amount */}
            <div className="text-center py-4 bg-slate-50/70 rounded-2xl border border-slate-100 my-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Amount Due</span>
              <div className="text-3xl font-black text-slate-900 mt-0.5">
                ₹{payingRecord.totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Paying to: <span className="font-semibold text-slate-800">{stay.property?.ownerName || 'Owner'}</span>
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center mb-4 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                alt="UPI Payment QR Code"
                className="w-40 h-40 mx-auto rounded-xl border border-slate-100"
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {upiIdString}
                </span>
                <button
                  type="button"
                  onClick={copyUpiToClipboard}
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Scan with GPay, PhonePe, Paytm, or BHIM</span>
            </div>

            {/* Mobile App Launch Intents */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a
                href={upiUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#5f259f] hover:bg-[#521f8a] text-white text-xs font-bold transition-colors"
              >
                <span>PhonePe</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={upiUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0086ff] hover:bg-[#0074db] text-white text-xs font-bold transition-colors"
              >
                <span>GPay / Paytm</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Confirm Payment Section */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                UPI Reference / UTR No. (Optional):
              </label>
              <input
                type="text"
                value={paymentUtr}
                onChange={e => setPaymentUtr(e.target.value)}
                placeholder="e.g. 431289901234"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm mb-3 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentSubmitted}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${
                  paymentSubmitted ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {paymentSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payment Marked as Paid!</span>
                  </>
                ) : (
                  <span>I Have Completed Payment · भुगतान हो गया</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: OFFICIAL RENT RECEIPT VOUCHER
          ========================================================================= */}
      {showReceiptModal && selectedReceipt && stay && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 p-6 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-extrabold text-lg">⌂ RoomSaathi</span>
                <span className="text-xs text-slate-400 font-medium">· Digital Receipt</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Card Body */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 mb-4">
              <div className="text-center pb-3 border-b border-dashed border-slate-200 mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedReceipt.propertyName}
                </h3>
                <p className="text-xs text-slate-500">
                  {stay.property?.address}, {stay.property?.city}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  Receipt #{selectedReceipt.id.substring(0, 10).toUpperCase()} · Month: {selectedReceipt.month}
                </span>
              </div>

              {/* Tenant info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Resident</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.tenantName}</span>
                  <span className="text-[11px] text-slate-500 block">Room {selectedReceipt.roomNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Payment Mode</span>
                  <span className="font-bold text-emerald-700">{selectedReceipt.paymentMethod || 'UPI'}</span>
                  <span className="text-[11px] text-slate-500 block">{selectedReceipt.paidDate || 'Paid'}</span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                <div className="flex justify-between">
                  <span>Room Base Rent:</span>
                  <span className="font-semibold text-slate-900">₹{selectedReceipt.baseRent}</span>
                </div>
                {Boolean(selectedReceipt.electricityAmount) && (
                  <div className="flex justify-between">
                    <span>Electricity ({selectedReceipt.electricityUnits || 0} units):</span>
                    <span className="font-semibold text-slate-900">₹{selectedReceipt.electricityAmount}</span>
                  </div>
                )}
                {Boolean(selectedReceipt.wifiAmount) && (
                  <div className="flex justify-between">
                    <span>WiFi Charge:</span>
                    <span className="font-semibold text-slate-900">₹{selectedReceipt.wifiAmount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700 font-extrabold">₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Official Stamp */}
              <div className="flex items-center justify-center pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-extrabold uppercase tracking-wider border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Paid & Verified · सत्यापन पूर्ण
                </span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RAISE MAINTENANCE TICKET MODAL
          ========================================================================= */}
      {showComplaintModal && stay && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowComplaintModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Raise Maintenance Ticket</h3>
                <p className="text-xs text-slate-400">Directly notifies {stay.property?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category (समस्या का प्रकार):
                </label>
                <select
                  value={complaintForm.category}
                  onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="wifi">WiFi & Internet</option>
                  <option value="plumbing">Plumbing & Water / नल या पानी</option>
                  <option value="electricity">Electricity & Fan / बिजली या पंखा</option>
                  <option value="cleaning">Cleaning & Hygiene / सफाई</option>
                  <option value="roommate">Roommate Issue</option>
                  <option value="other">Other / अन्य</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setComplaintForm({ ...complaintForm, priority: p })}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer border ${
                        complaintForm.priority === p
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Title (विषय):
                </label>
                <input
                  type="text"
                  required
                  value={complaintForm.title}
                  onChange={e => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  placeholder="e.g. Bathroom tap leaking or WiFi disconnected"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (विवरण):
                </label>
                <textarea
                  rows={3}
                  value={complaintForm.description}
                  onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Describe when it started and what room or switch is affected..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint || complaintSuccess}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer ${
                  complaintSuccess ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {complaintSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ticket Submitted!</span>
                  </>
                ) : submittingComplaint ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Maintenance Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tenancy Agreement Sign Canvas Modal */}
      {showSignModal && agreement && (
        <TenantSignatureModal
          tenantName={agreement.tenantName || stay?.tenant?.fullName || 'Resident'}
          propertyName={agreement.propertyName || stay?.property?.name || 'Property'}
          roomNumber={agreement.roomNumber || stay?.tenant?.roomNumber || 'Room'}
          onSaveSignature={handleSaveTenantSignature}
          onClose={() => setShowSignModal(false)}
        />
      )}

      {/* Fullscreen Tenancy Agreement Document Viewer Modal */}
      {showAgreementModal && agreement && (
        <AgreementViewerModal
          agreement={agreement}
          onOpenSignModal={() => {
            setShowAgreementModal(false);
            setShowSignModal(true);
          }}
          onClose={() => setShowAgreementModal(false)}
        />
      )}

    </div>
  );
}
