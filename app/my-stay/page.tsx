'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  DoorClosed,
  Bed,
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
  Sparkles,
  Info,
  X,
  FileText,
  Printer
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
  type ActiveTenantStay,
  type RentRecordItem,
  type ComplaintItem,
  type RoommateItem,
  type VisitRequestItem
} from '@/lib/services/tenantService';

export default function MyStayPage() {
  const { user, profile, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'rent' | 'complaints' | 'roommates' | 'visits'>('rent');
  const [loading, setLoading] = useState(true);
  const [stay, setStay] = useState<ActiveTenantStay | null>(null);
  const [rentRecords, setRentRecords] = useState<RentRecordItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [roommates, setRoommates] = useState<RoommateItem[]>([]);
  const [visits, setVisits] = useState<VisitRequestItem[]>([]);

  // Modals state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState<RentRecordItem | null>(null);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

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

  // Load active stay data
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const userEmail = user?.email || profile?.email || null;
      const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || (typeof window !== 'undefined' ? localStorage.getItem('roomsaathi_tenant_phone') : null);
      const userProfileId = user?.id || null;
      const userFullName = profile?.full_name || user?.user_metadata?.full_name || null;

      if (!user) {
        setStay(null);
        setLoading(false);
        return;
      }

      try {
        const liveStay = await fetchActiveStay({
          email: userEmail,
          phone: userPhone,
          profileId: userProfileId,
          fullName: userFullName
        });

        if (liveStay) {
          setStay(liveStay);
          const [rents, comps, mates] = await Promise.all([
            fetchTenantRentRecords(liveStay.tenant.id),
            fetchTenantComplaints(liveStay.tenant.propertyId, liveStay.tenant.fullName),
            fetchRoommates(liveStay.tenant.propertyId, liveStay.tenant.id, liveStay.tenant.roomId)
          ]);
          setRentRecords(rents);
          setComplaints(comps);
          setRoommates(mates);
        } else {
          setStay(null);
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

  const activeRentDue = rentRecords.find(r => r.status === 'pending' || r.status === 'overdue') || rentRecords[0];

  const handleOpenPayModal = (record: RentRecordItem) => {
    setPayingRecord(record);
    setPaymentUtr('');
    setPaymentSubmitted(false);
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

  const upiUrl = payingRecord && stay?.property?.upiId
    ? `upi://pay?pa=${encodeURIComponent(stay.property.upiId)}&pn=${encodeURIComponent(stay.property.ownerName || 'Host')}&am=${payingRecord.totalAmount}&cu=INR&tn=${encodeURIComponent(`${stay.property.name} Rent ${payingRecord.month}`)}`
    : '';

  return (
    <div className="container section" style={{ maxWidth: 960, minHeight: '80vh', paddingBottom: 80 }}>
      {/* Top Banner / Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow" style={{ margin: 0 }}>
            किरायेदार पोर्टल · RESIDENT PORTAL
          </span>
        </div>
      </div>

      <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-1px' }}>
        My Stay <span className="title-accent">· मेरा कमरा और किराया</span>
      </h1>
      <p className="muted" style={{ margin: '0 0 24px', fontSize: 14.5 }}>
        Track your room details, pay rent directly to host via UPI, view receipts, and raise maintenance tickets.
      </p>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
          <div className="spinner" style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Loading your room details from RoomSaathi...</p>
        </div>
      ) : !stay ? (
        /* Empty / Not Onboarded State */
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 24,
            border: '1.5px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: '#ecfdf5',
              color: '#059669',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px'
            }}
          >
            <Building2 size={32} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            {user ? 'No Active Stay Linked Yet' : 'Sign in to View Your Active Stay'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
            {user
              ? `Hi ${profile?.full_name || user.email}! When your property owner onboards your mobile number (${profile?.phone || 'not set'}) or email, your stay, rent invoices, and room details will automatically show up here.`
              : 'Sign in with your registered Google account or phone to access your room information, digital rent receipts, and maintenance desk.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {!user ? (
              <button
                type="button"
                onClick={openAuthModal}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                Sign In to View Stay
              </button>
            ) : (
              <Link
                href="/search"
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Explore Rooms in Samastipur
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Resident Active Stay Portal */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Resident Property Banner */}
          <div
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
              borderRadius: 22,
              border: '1px solid #bbf7d0',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, background: '#10b981', color: '#ffffff', padding: '3px 10px', borderRadius: 99, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={13} />
                    Active Resident · सक्रिय किरायेदार
                  </span>
                  <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>
                    Since {stay.tenant.checkInDate}
                  </span>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  {stay.property?.name || 'My Rented Property'}
                </h2>
                <p style={{ color: '#475569', fontSize: 13.5, margin: 0 }}>
                  {stay.property?.address}, {stay.property?.area}, {stay.property?.city}
                </p>
              </div>

              {/* Host Contact Quick Actions */}
              {stay.property?.ownerPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={`https://wa.me/91${stay.property.ownerPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(stay.property.ownerName || 'Host')},%20this%20is%20${encodeURIComponent(stay.tenant.fullName)}%20from%20Room%20${stay.tenant.roomNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#25d366',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp Host</span>
                  </a>

                  <a
                    href={`tel:${stay.property.ownerPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#ffffff',
                      color: '#0f172a',
                      padding: '8px 14px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    <Phone size={15} />
                    <span>Call Host</span>
                  </a>
                </div>
              )}
            </div>

            {/* Room Info Badges */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #dcfce7',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Room & Bed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  Room {stay.tenant.roomNumber} {stay.tenant.bedLabel ? `· Bed ${stay.tenant.bedLabel}` : ''}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Base Rent</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                  ₹{stay.tenant.monthlyRent.toLocaleString('en-IN')}/mo
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Security Deposit</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  ₹{stay.tenant.depositPaid.toLocaleString('en-IN')} (Paid)
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Verification Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={15} />
                  <span>Verified Resident</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, overflowX: 'auto' }}>
            {[
              { id: 'rent', label: 'Rent & Payments · किराया', icon: IndianRupee },
              { id: 'complaints', label: `Maintenance (${complaints.filter(c => c.status !== 'resolved').length}) · शिकायत`, icon: Wrench },
              { id: 'roommates', label: `Roommates (${roommates.length}) · साथी`, icon: UsersRound },
              { id: 'visits', label: `Visits (${visits.length}) · विज़िट`, icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: isActive ? '#10b981' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#475569',
                    border: isActive ? 'none' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: RENT & PAYMENTS */}
          {activeTab === 'rent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Highlight Rent Due Card */}
              {activeRentDue && (
                <div
                  style={{
                    background: activeRentDue.status === 'paid' ? '#f0fdf4' : activeRentDue.status === 'overdue' ? '#fff1f2' : '#fefce8',
                    border: `1.5px solid ${activeRentDue.status === 'paid' ? '#86efac' : activeRentDue.status === 'overdue' ? '#fca5a5' : '#fde047'}`,
                    borderRadius: 20,
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 99,
                            textTransform: 'uppercase',
                            background: activeRentDue.status === 'paid' ? '#10b981' : activeRentDue.status === 'overdue' ? '#ef4444' : '#eab308',
                            color: '#ffffff'
                          }}
                        >
                          {activeRentDue.status === 'paid' ? 'Paid · भुगतान हो चुका' : activeRentDue.status === 'overdue' ? 'Overdue · बकाया' : 'Rent Due · देय राशि'}
                        </span>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                          For {activeRentDue.month}
                        </span>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
                        ₹{activeRentDue.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                        Due by: {activeRentDue.dueDate}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {activeRentDue.status !== 'paid' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(activeRentDue)}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '12px 24px',
                            borderRadius: 14,
                            fontWeight: 700,
                            fontSize: 14,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <QrCode size={18} />
                          <span>Pay via UPI · तुरंत भुगतान</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(activeRentDue);
                            setShowReceiptModal(true);
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#059669',
                            border: '1.5px solid #10b981',
                            padding: '10px 18px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Receipt size={16} />
                          <span>View Receipt · रसीद</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10,
                      fontSize: 13
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b' }}>Base Rent:</span> <b>₹{activeRentDue.baseRent}</b>
                    </div>
                    {Boolean(activeRentDue.electricityAmount) && (
                      <div>
                        <span style={{ color: '#64748b' }}>Electricity ({activeRentDue.electricityUnits || 0}u):</span> <b>₹{activeRentDue.electricityAmount}</b>
                      </div>
                    )}
                    {Boolean(activeRentDue.wifiAmount) && (
                      <div>
                        <span style={{ color: '#64748b' }}>WiFi Charge:</span> <b>₹{activeRentDue.wifiAmount}</b>
                      </div>
                    )}
                    {Boolean(activeRentDue.foodAmount) && (
                      <div>
                        <span style={{ color: '#64748b' }}>Food / Mess:</span> <b>₹{activeRentDue.foodAmount}</b>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Past Rent Records History */}
              <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '22px' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                  Rent Payment History (पिछला किराया रिकॉर्ड)
                </h3>

                {rentRecords.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>No billing records posted by landlord yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rentRecords.map(record => (
                      <div
                        key={record.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          gap: 12,
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: record.status === 'paid' ? '#ecfdf5' : '#fff1f2',
                              color: record.status === 'paid' ? '#059669' : '#dc2626',
                              display: 'grid',
                              placeItems: 'center'
                            }}
                          >
                            <Receipt size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                              {record.month}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              Due: {record.dueDate} {record.paidDate ? `· Paid on ${record.paidDate}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                              ₹{record.totalAmount.toLocaleString('en-IN')}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: record.status === 'paid' ? '#059669' : '#dc2626',
                                textTransform: 'uppercase'
                              }}
                            >
                              {record.status}
                            </div>
                          </div>

                          {record.status === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReceipt(record);
                                setShowReceiptModal(true);
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '6px 12px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#0f172a',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <FileText size={14} />
                              <span>Receipt</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(record)}
                              style={{
                                background: '#10b981',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              Pay Now
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

          {/* TAB 2: COMPLAINTS & MAINTENANCE */}
          {activeTab === 'complaints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                    Maintenance & Helpdesk
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
                    Report plumbing, WiFi, electrical issues directly to your host.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowComplaintModal(true)}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13.5,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Plus size={16} />
                  <span>Raise New Ticket · शिकायत दर्ज करें</span>
                </button>
              </div>

              {/* Complaints List */}
              {complaints.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                  <Wrench size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 12px' }}>No issues or complaints reported yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(true)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '8px 16px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Raise Your First Ticket
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {complaints.map(c => (
                    <div
                      key={c.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        padding: '18px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 6,
                                textTransform: 'uppercase',
                                background: c.status === 'resolved' ? '#ecfdf5' : c.status === 'in_progress' ? '#eff6ff' : '#fef3c7',
                                color: c.status === 'resolved' ? '#059669' : c.status === 'in_progress' ? '#2563eb' : '#d97706'
                              }}
                            >
                              {c.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: 11.5, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                              {c.category}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                            {c.title}
                          </h4>
                          <p style={{ fontSize: 13.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                            {c.description}
                          </p>

                          {c.adminNote && (
                            <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #10b981', fontSize: 12.5, color: '#334155' }}>
                              <b>Host Note:</b> {c.adminNote}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOMMATES */}
          {activeTab === 'roommates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Roommates & Co-Residents
                </h3>
                <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
                  Other students and working professionals living in your room or flat.
                </p>
              </div>

              {roommates.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                  <UsersRound size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>No other roommates currently sharing this room.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {roommates.map(m => (
                    <div
                      key={m.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, background: '#f1f5f9', color: '#0f172a', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                            Room {m.roomNumber} {m.bedLabel ? `· Bed ${m.bedLabel}` : ''}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Since {m.checkInDate}</span>
                        </div>
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                          {m.fullName}
                        </h4>
                        {m.collegeOrWork && (
                          <div style={{ fontSize: 12.5, color: '#64748b' }}>
                            {m.collegeOrWork}
                          </div>
                        )}
                      </div>

                      {m.phone && (
                        <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                          <a
                            href={`https://wa.me/91${m.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px',
                              borderRadius: 10,
                              background: '#ecfdf5',
                              color: '#059669',
                              fontSize: 12.5,
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${m.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: '#f8fafc',
                              color: '#475569',
                              fontSize: 12.5,
                              fontWeight: 700,
                              textDecoration: 'none',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VISITS & INQUIRIES */}
          {activeTab === 'visits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Property Visits & Inquiries
                </h3>
                <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
                  Visits you scheduled through RoomSaathi to view rooms and PGs.
                </p>
              </div>

              {visits.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                  <Calendar size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 12px' }}>No upcoming property visit requests scheduled.</p>
                  <Link
                    href="/search"
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Schedule a Room Visit
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visits.map(v => (
                    <div
                      key={v.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        padding: '18px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#ecfdf5', color: '#059669', textTransform: 'uppercase' }}>
                              {v.status}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              Created: {new Date(v.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                            {v.propertyName}
                          </h4>
                          {v.visitDate && (
                            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <Calendar size={14} color="#10b981" />
                              <span>Scheduled for: <b>{v.visitDate} {v.visitTime ? `at ${v.visitTime}` : ''}</b></span>
                            </div>
                          )}
                          {v.notes && (
                            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                              Note: {v.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PAY RENT UPI MODAL */}
      {showPayModal && payingRecord && stay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }}
          onClick={() => setShowPayModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 24,
              maxWidth: 440,
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                DIRECT HOST UPI PAYMENT
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                Pay Rent for {payingRecord.month}
              </h3>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '6px 0' }}>
                ₹{payingRecord.totalAmount.toLocaleString('en-IN')}
              </div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                100% direct payment to {stay.property?.ownerName || 'Host'} ({stay.property?.upiId || 'roomsaathi@upi'})
              </p>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                alt="UPI Payment QR Code"
                style={{ width: 170, height: 170, margin: '0 auto', display: 'block', borderRadius: 8 }}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 600 }}>
                Scan with any UPI App (GPay, PhonePe, Paytm)
              </div>
            </div>

            {/* Deep Links / Intent for Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <a
                href={upiUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  borderRadius: 12,
                  background: '#6739b7',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>PhonePe</span>
              </a>
              <a
                href={upiUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  borderRadius: 12,
                  background: '#0084ff',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>GPay / Paytm</span>
              </a>
            </div>

            {/* Confirm Payment Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                UPI Ref / UTR No. (Optional):
              </label>
              <input
                type="text"
                value={paymentUtr}
                onChange={e => setPaymentUtr(e.target.value)}
                placeholder="e.g. 431289901234"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  marginBottom: 12,
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentSubmitted}
                style={{
                  width: '100%',
                  background: paymentSubmitted ? '#16a34a' : '#10b981',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {paymentSubmitted ? (
                  <>
                    <CheckCircle2 size={18} />
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

      {/* MODAL 2: RECEIPT MODAL */}
      {showReceiptModal && selectedReceipt && stay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }}
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={20} />
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 800, fontSize: 18 }}>
                <span>⌂</span> RoomSaathi Rent Receipt
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '6px 0 2px' }}>
                {selectedReceipt.propertyName}
              </h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {stay.property?.address}, {stay.property?.city}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Receipt #{selectedReceipt.id.substring(0, 10).toUpperCase()} · Month: {selectedReceipt.month}
              </div>
            </div>

            {/* Tenant details */}
            <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#334155' }}>
              <div>
                <div><b>Tenant:</b> {selectedReceipt.tenantName}</div>
                <div><b>Room / Bed:</b> {selectedReceipt.roomNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><b>Paid Date:</b> {selectedReceipt.paidDate || 'Paid'}</div>
                <div><b>Mode:</b> {selectedReceipt.paymentMethod || 'UPI'}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#64748b' }}>Room Rent:</span>
                <b>₹{selectedReceipt.baseRent}</b>
              </div>
              {Boolean(selectedReceipt.electricityAmount) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>Electricity ({selectedReceipt.electricityUnits || 0} units):</span>
                  <b>₹{selectedReceipt.electricityAmount}</b>
                </div>
              )}
              {Boolean(selectedReceipt.wifiAmount) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>WiFi Charges:</span>
                  <b>₹{selectedReceipt.wifiAmount}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '1px solid #e2e8f0', marginTop: 4, fontSize: 15 }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Total Amount Paid:</span>
                <span style={{ fontWeight: 900, color: '#059669' }}>₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Stamp & Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
              <div style={{ border: '2px solid #10b981', color: '#059669', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', transform: 'rotate(-4deg)' }}>
                PAID & VERIFIED
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RAISE COMPLAINT MODAL */}
      {showComplaintModal && stay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }}
          onClick={() => setShowComplaintModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              maxWidth: 480,
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowComplaintModal(false)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Raise Maintenance Issue (शिकायत दर्ज करें)
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>
              Directly notified to {stay.property?.name || 'Property'} owner.
            </p>

            <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Category (समस्या का प्रकार):
                </label>
                <select
                  value={complaintForm.category}
                  onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5 }}
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Priority:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {['low', 'medium', 'urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setComplaintForm({ ...complaintForm, priority: p })}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        border: complaintForm.priority === p ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                        background: complaintForm.priority === p ? '#ecfdf5' : '#ffffff',
                        color: complaintForm.priority === p ? '#059669' : '#475569'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Short Title (विषय):
                </label>
                <input
                  type="text"
                  required
                  value={complaintForm.title}
                  onChange={e => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  placeholder="e.g. Bathroom tap leaking or WiFi down"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Description (विस्तार से बताएं):
                </label>
                <textarea
                  rows={3}
                  value={complaintForm.description}
                  onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Describe when the issue started and any specific details..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint || complaintSuccess}
                style={{
                  background: complaintSuccess ? '#16a34a' : '#10b981',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6
                }}
              >
                {complaintSuccess ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Ticket Submitted!</span>
                  </>
                ) : submittingComplaint ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Maintenance Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
