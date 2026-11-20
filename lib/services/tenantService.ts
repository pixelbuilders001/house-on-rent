import { getSupabaseBrowserClient } from '../supabase/client';
import { embedSignaturesIntoPdf } from './pdfAgreementService';

export interface ActiveTenantStay {
  tenant: {
    id: string;
    propertyId: string;
    roomId?: string;
    bedId?: string;
    roomNumber: string;
    bedLabel?: string;
    fullName: string;
    phone: string;
    email?: string;
    emergencyPhone?: string;
    collegeOrWork?: string;
    checkInDate: string;
    monthlyRent: number;
    depositPaid: number;
    status: 'active' | 'vacated';
    policeVerificationStatus: 'pending' | 'verified' | 'in_progress';
    tenantCategory?: string;
    familyMembersCount?: number;
  };
  property?: {
    id: string;
    name: string;
    address: string;
    area: string;
    city: string;
    type: string;
    ownerName?: string;
    ownerPhone?: string;
    upiId?: string;
    images?: string[];
  };
  room?: {
    id: string;
    roomNumber: string;
    floor?: number;
    type?: string;
    rentAmount?: number;
  };
}

export interface RentRecordItem {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  month: string;
  baseRent: number;
  electricityUnits?: number;
  electricityAmount?: number;
  wifiAmount?: number;
  foodAmount?: number;
  otherAmount?: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export interface ComplaintItem {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  roomNumber: string;
  category: 'plumbing' | 'electricity' | 'wifi' | 'cleaning' | 'roommate' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
}

export interface RoommateItem {
  id: string;
  fullName: string;
  phone?: string;
  roomNumber: string;
  bedLabel?: string;
  collegeOrWork?: string;
  checkInDate: string;
}

export interface VisitRequestItem {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  phone: string;
  preferredRoomType?: string;
  status: 'new' | 'contacted' | 'visit_scheduled' | 'converted' | 'lost';
  visitDate?: string;
  visitTime?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Fetch active tenant stay for currently logged-in user
 */
export async function fetchActiveStay(userIdentifier: {
  email?: string | null;
  phone?: string | null;
  profileId?: string | null;
  fullName?: string | null;
}): Promise<ActiveTenantStay | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    let tenantRows: any[] = [];

    // Build or condition across available identifiers
    const orFilters: string[] = [];
    if (userIdentifier.email) {
      orFilters.push(`email.ilike.${userIdentifier.email.trim()}`);
    }
    if (userIdentifier.phone) {
      const cleanPhone = userIdentifier.phone.trim().replace(/\D/g, '').slice(-10);
      orFilters.push(`phone.ilike.%${cleanPhone}%`);
    }
    if (userIdentifier.profileId) {
      orFilters.push(`profile_id.eq.${userIdentifier.profileId}`);
    }

    if (orFilters.length > 0) {
      const res = await supabase
        .from('tenants')
        .select('*')
        .neq('status', 'vacated')
        .or(orFilters.join(','))
        .order('created_at', { ascending: false })
        .limit(1);
      if (res.data && res.data.length > 0) {
        tenantRows = res.data;
      }
    }

    // 2. Fallback: if not matched yet and name is provided, match by full_name
    if (tenantRows.length === 0 && userIdentifier.fullName) {
      const nameParts = userIdentifier.fullName.trim().split(' ').filter(Boolean);
      const firstName = nameParts[0];
      if (firstName && firstName.length >= 3) {
        const nameRes = await supabase
          .from('tenants')
          .select('*')
          .neq('status', 'vacated')
          .ilike('full_name', `%${firstName}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (nameRes.data && nameRes.data.length > 0) {
          tenantRows = nameRes.data;
          // Auto-link email and profileId to this tenant row so future queries are exact
          if (userIdentifier.email || userIdentifier.profileId) {
            await supabase.from('tenants').update({
              email: userIdentifier.email || undefined,
              profile_id: userIdentifier.profileId || undefined
            }).eq('id', tenantRows[0].id);
          }
        }
      }
    }

    if (tenantRows.length === 0) {
      return null;
    }

    const t = tenantRows[0];

    // Fetch related Property details
    let propertyData: ActiveTenantStay['property'] = undefined;
    if (t.property_id) {
      const { data: propRow } = await supabase
        .from('properties')
        .select('*')
        .eq('id', t.property_id)
        .maybeSingle();

      if (propRow) {
        // Also fetch owner profile for UPI ID and contact
        let ownerPhone = propRow.owner_phone || propRow.phone || '';
        let ownerName = propRow.owner || '';
        let upiId = 'roomsaathi@upi';

        if (propRow.owner_id) {
          const { data: ownerProf } = await supabase
            .from('profiles')
            .select('full_name, phone, upi_id')
            .eq('id', propRow.owner_id)
            .maybeSingle();
          if (ownerProf) {
            if (ownerProf.phone) ownerPhone = ownerProf.phone;
            if (ownerProf.full_name) ownerName = ownerProf.full_name;
            if (ownerProf.upi_id) upiId = ownerProf.upi_id;
          }
        }

        propertyData = {
          id: propRow.id,
          name: propRow.name,
          address: propRow.address || '',
          area: propRow.area || '',
          city: propRow.city || 'Samastipur',
          type: propRow.type || 'PG',
          ownerName: ownerName || 'Property Landlord',
          ownerPhone: ownerPhone || '9876543210',
          upiId: upiId,
          images: propRow.images && propRow.images.length > 0 ? propRow.images : [propRow.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80']
        };
      }
    }

    // Fetch room info if available
    let roomData: ActiveTenantStay['room'] = undefined;
    if (t.room_id) {
      const { data: roomRow } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', t.room_id)
        .maybeSingle();

      if (roomRow) {
        roomData = {
          id: roomRow.id,
          roomNumber: roomRow.room_number || t.room_number,
          floor: roomRow.floor,
          type: roomRow.type,
          rentAmount: roomRow.rent_amount
        };
      }
    }

    return {
      tenant: {
        id: t.id,
        propertyId: t.property_id,
        roomId: t.room_id,
        bedId: t.bed_id,
        roomNumber: t.room_number,
        bedLabel: t.bed_label,
        fullName: t.full_name,
        phone: t.phone,
        email: t.email,
        emergencyPhone: t.emergency_phone,
        collegeOrWork: t.college_or_work,
        checkInDate: t.check_in_date || t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        monthlyRent: Number(t.monthly_rent || 0),
        depositPaid: Number(t.deposit_paid || 0),
        status: t.status || 'active',
        policeVerificationStatus: t.police_verification_status || 'pending',
        tenantCategory: t.tenant_category,
        familyMembersCount: t.family_members_count
      },
      property: propertyData,
      room: roomData
    };
  } catch (err) {
    console.error('Error fetching active stay:', err);
    return null;
  }
}

/**
 * Fetch rent bills and receipts for the tenant
 */
export async function fetchTenantRentRecords(tenantId: string): Promise<RentRecordItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('rent_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      propertyId: r.property_id,
      propertyName: r.property_name,
      roomNumber: r.room_number,
      month: r.month,
      baseRent: Number(r.base_rent || 0),
      electricityUnits: r.electricity_units,
      electricityAmount: Number(r.electricity_amount || 0),
      wifiAmount: Number(r.wifi_amount || 0),
      foodAmount: Number(r.food_amount || 0),
      otherAmount: Number(r.other_amount || 0),
      totalAmount: Number(r.total_amount || 0),
      status: r.status || 'pending',
      dueDate: r.due_date,
      paidDate: r.paid_date,
      paymentMethod: r.payment_method,
      transactionRef: r.transaction_ref
    }));
  } catch (err) {
    console.error('Error fetching tenant rent records:', err);
    return [];
  }
}

/**
 * Fetch complaints logged for the property/tenant
 */
export async function fetchTenantComplaints(propertyId: string, tenantName?: string): Promise<ComplaintItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    let q = supabase
      .from('complaints')
      .select('*')
      .eq('property_id', propertyId);

    if (tenantName) {
      q = q.eq('tenant_name', tenantName);
    }

    const { data, error } = await q.order('created_at', { ascending: false });
    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      propertyId: c.property_id,
      propertyName: c.property_name,
      tenantName: c.tenant_name,
      roomNumber: c.room_number,
      category: c.category || 'other',
      title: c.title,
      description: c.description,
      priority: c.priority || 'medium',
      status: c.status || 'open',
      createdAt: c.created_at,
      resolvedAt: c.resolved_at,
      adminNote: c.admin_note
    }));
  } catch (err) {
    console.error('Error fetching tenant complaints:', err);
    return [];
  }
}

/**
 * Submit a maintenance or room complaint to Supabase
 */
export async function submitTenantComplaint(complaint: {
  propertyId: string;
  propertyName: string;
  tenantName: string;
  roomNumber: string;
  category: string;
  title: string;
  description: string;
  priority: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: 'Database client not connected' };

  try {
    const complaintId = 'comp-' + Math.random().toString(36).substring(2, 9);
    const { error } = await supabase.from('complaints').insert({
      id: complaintId,
      property_id: complaint.propertyId,
      property_name: complaint.propertyName,
      tenant_name: complaint.tenantName,
      room_number: complaint.roomNumber,
      category: complaint.category,
      title: complaint.title,
      description: complaint.description,
      priority: complaint.priority,
      status: 'open',
      created_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit complaint' };
  }
}

/**
 * Fetch roommates staying in the same property or room
 */
export async function fetchRoommates(propertyId: string, currentTenantId: string, roomId?: string): Promise<RoommateItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    let q = supabase
      .from('tenants')
      .select('id, full_name, phone, room_number, bed_label, college_or_work, check_in_date')
      .eq('property_id', propertyId)
      .neq('id', currentTenantId)
      .neq('status', 'vacated');

    if (roomId) {
      q = q.eq('room_id', roomId);
    }

    const { data, error } = await q;
    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      fullName: t.full_name,
      phone: t.phone,
      roomNumber: t.room_number,
      bedLabel: t.bed_label,
      collegeOrWork: t.college_or_work,
      checkInDate: t.check_in_date
    }));
  } catch (err) {
    console.error('Error fetching roommates:', err);
    return [];
  }
}

/**
 * Fetch visit scheduled leads for user
 */
export async function fetchTenantVisits(phoneOrEmail: string): Promise<VisitRequestItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`phone.eq.${phoneOrEmail.trim()},tenant_name.ilike.%${phoneOrEmail.trim()}%`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((l: any) => ({
      id: l.id,
      propertyId: l.property_id,
      propertyName: l.property_name,
      tenantName: l.tenant_name,
      phone: l.phone,
      preferredRoomType: l.preferred_room_type,
      status: l.status || 'new',
      visitDate: l.visit_date,
      visitTime: l.visit_time,
      notes: l.notes,
      createdAt: l.created_at
    }));
  } catch (err) {
    console.error('Error fetching visits:', err);
    return [];
  }
}

/**
 * Mark a rent record as paid via UPI or online payment
 */
export async function markRentPaidOnline(
  recordId: string,
  paymentMethod: string = 'upi',
  transactionRef: string = ''
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('rent_records')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        transaction_ref: transactionRef || `UPI-${Date.now()}`
      })
      .eq('id', recordId);

    return !error;
  } catch (err) {
    console.error('Error updating rent status:', err);
    return false;
  }
}

export async function linkTenantByPhone(
  phone: string,
  userId?: string,
  userEmail?: string
): Promise<{ success: boolean; tenant?: any; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const cleaned = phone.trim().replace(/\D/g, '');
    const searchPhone = cleaned.slice(-10);

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .ilike('phone', `%${searchPhone}%`)
      .neq('status', 'vacated')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { success: false, error: 'No active tenant record found for this phone number' };
    }

    const t = data[0];

    const updates: Record<string, any> = {};
    if (userId) updates.profile_id = userId;
    if (userEmail) updates.email = userEmail;

    if (Object.keys(updates).length > 0) {
      await supabase.from('tenants').update(updates).eq('id', t.id);
    }

    if (userId) {
      await supabase.from('profiles').update({ phone: searchPhone }).eq('id', userId);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('roomsaathi_tenant_phone', searchPhone);
    }

    return { success: true, tenant: t };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to link phone' };
  }
}

export interface TenantAgreement {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantAadhaar?: string;
  ownerName: string;
  ownerPhone: string;
  roomNumber: string;
  monthlyRent: number;
  depositAmount: number;
  startDate: string;
  durationMonths: number;
  pdfFileName?: string;
  status: 'draft' | 'pending_tenant' | 'pending_owner' | 'completed';
  ownerSignature?: string;
  ownerSignedAt?: string;
  tenantSignature?: string;
  tenantSignedAt?: string;
  signingToken: string;
  pdfBase64?: string;
  signedPdfBase64?: string;
  createdAt?: string;
}

function mapAgreementRow(row: any): TenantAgreement {
  return {
    id: row.id,
    propertyId: row.property_id || row.propertyId || '',
    propertyName: row.property_name || row.propertyName || '',
    tenantId: row.tenant_id || row.tenantId || '',
    tenantName: row.tenant_name || row.tenantName || '',
    tenantPhone: row.tenant_phone || row.tenantPhone || '',
    tenantAadhaar: row.tenant_aadhaar || row.tenantAadhaar || undefined,
    ownerName: row.owner_name || row.ownerName || '',
    ownerPhone: row.owner_phone || row.ownerPhone || '',
    roomNumber: row.room_number || row.roomNumber || '',
    monthlyRent: Number(row.monthly_rent ?? row.monthlyRent ?? 0),
    depositAmount: Number(row.deposit_amount ?? row.depositAmount ?? 0),
    startDate: row.start_date || row.startDate || '',
    durationMonths: Number(row.duration_months ?? row.durationMonths ?? 11),
    pdfFileName: row.pdf_file_name || row.pdfFileName || 'rent_agreement.pdf',
    status: (row.status || 'draft') as TenantAgreement['status'],
    ownerSignature: row.owner_signature || row.ownerSignature || undefined,
    ownerSignedAt: row.owner_signed_at || row.ownerSignedAt || undefined,
    tenantSignature: row.tenant_signature || row.tenantSignature || undefined,
    tenantSignedAt: row.tenant_signed_at || row.tenantSignedAt || undefined,
    signingToken: row.signing_token || row.signingToken || row.id,
    pdfBase64: row.pdf_base64 || row.pdfBase64 || undefined,
    signedPdfBase64: row.signed_pdf_base64 || row.signedPdfBase64 || undefined,
    createdAt: row.created_at || row.createdAt
  };
}

/**
 * Fetch tenant agreement from Supabase (agreements table or complaints sync fallback)
 */
export async function fetchTenantAgreement(params: {
  tenantId?: string;
  phone?: string | null;
  fullName?: string | null;
  token?: string | null;
}): Promise<TenantAgreement | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const cleanPhone = params.phone ? params.phone.trim().replace(/\D/g, '').slice(-10) : '';

    // 1. Try querying direct agreements table
    if (params.token) {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .or(`signing_token.eq.${params.token},id.eq.${params.token}`)
        .maybeSingle();

      if (!error && data) {
        return mapAgreementRow(data);
      }
    }

    if (params.tenantId) {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('tenant_id', params.tenantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return mapAgreementRow(data[0]);
      }
    }

    if (cleanPhone) {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .ilike('tenant_phone', `%${cleanPhone}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return mapAgreementRow(data[0]);
      }
    }

    if (params.fullName) {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .ilike('tenant_name', `%${params.fullName.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return mapAgreementRow(data[0]);
      }
    }

    // 2. Fallback: Query complaints table where category = '__agreement_sync__'
    const { data: compRows } = await supabase
      .from('complaints')
      .select('*')
      .eq('category', '__agreement_sync__')
      .order('created_at', { ascending: false });

    if (compRows && compRows.length > 0) {
      for (const row of compRows) {
        try {
          const parsed = JSON.parse(row.description || '{}');
          if (!parsed || (!parsed.id && !parsed.signingToken)) continue;

          if (params.token && (parsed.signingToken === params.token || parsed.id === params.token)) {
            return parsed as TenantAgreement;
          }
          if (params.tenantId && parsed.tenantId === params.tenantId) {
            return parsed as TenantAgreement;
          }
          if (cleanPhone && parsed.tenantPhone && parsed.tenantPhone.replace(/\D/g, '').includes(cleanPhone)) {
            return parsed as TenantAgreement;
          }
          if (params.fullName && parsed.tenantName && parsed.tenantName.toLowerCase() === params.fullName.trim().toLowerCase()) {
            return parsed as TenantAgreement;
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }

    return null;
  } catch (err) {
    console.warn('Error fetching tenant agreement:', err);
    return null;
  }
}

/**
 * Submit tenant's digital signature, embed it onto the PDF, and sync to Supabase
 */
export async function submitTenantAgreementSignature(
  agreement: TenantAgreement,
  tenantSignature: string
): Promise<{ success: boolean; agreement?: TenantAgreement; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: 'Database connection unavailable' };

  try {
    const now = new Date().toISOString();
    let updatedPdf = agreement.signedPdfBase64 || agreement.pdfBase64;

    // Embed tenant signature onto PDF via pdf-lib
    if (updatedPdf) {
      try {
        updatedPdf = await embedSignaturesIntoPdf(
          updatedPdf,
          agreement.ownerSignature,
          tenantSignature,
          { ...agreement, tenantSignedAt: now }
        );
      } catch (pdfErr) {
        console.warn('PDF embedding notice:', pdfErr);
      }
    }

    const updatedAgreement: TenantAgreement = {
      ...agreement,
      tenantSignature,
      tenantSignedAt: now,
      signedPdfBase64: updatedPdf,
      status: 'completed'
    };

    // 1. Update direct agreements table
    try {
      await supabase.from('agreements').update({
        tenant_signature: tenantSignature,
        tenant_signed_at: now,
        signed_pdf_base64: updatedPdf,
        status: 'completed'
      }).eq('id', agreement.id);
    } catch (tblErr) {
      console.warn('Agreements table update notice:', tblErr);
    }

    // 2. Also update complaints sync fallback
    try {
      const { data: compSync } = await supabase
        .from('complaints')
        .select('id, description')
        .eq('category', '__agreement_sync__')
        .eq('title', agreement.id)
        .maybeSingle();

      if (compSync) {
        const prev = JSON.parse(compSync.description || '{}');
        const merged = { ...prev, ...updatedAgreement };
        await supabase.from('complaints').update({
          description: JSON.stringify(merged),
          status: 'resolved'
        }).eq('id', compSync.id);
      } else {
        await supabase.from('complaints').insert({
          property_id: agreement.propertyId,
          property_name: agreement.propertyName,
          tenant_name: agreement.tenantName,
          room_number: agreement.roomNumber,
          category: '__agreement_sync__',
          title: agreement.id,
          description: JSON.stringify(updatedAgreement),
          priority: 'low',
          status: 'resolved'
        });
      }
    } catch (compErr) {
      console.warn('Complaints agreement sync notice:', compErr);
    }

    return { success: true, agreement: updatedAgreement };
  } catch (err: any) {
    console.error('Error submitting tenant signature:', err);
    return { success: false, error: err.message || 'Failed to submit signature' };
  }
}

