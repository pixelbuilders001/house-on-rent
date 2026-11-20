'use client';

import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  FileText, 
  PenLine, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';
import { TenantAgreement } from '@/lib/services/tenantService';

interface AgreementViewerModalProps {
  agreement: TenantAgreement;
  onOpenSignModal?: () => void;
  onClose: () => void;
}

export function AgreementViewerModal({
  agreement,
  onOpenSignModal,
  onClose,
}: AgreementViewerModalProps) {
  const isCompleted = agreement.status === 'completed' || Boolean(agreement.tenantSignature);
  const pdfUrl = agreement.signedPdfBase64 || agreement.pdfBase64;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Rent_Agreement_${agreement.tenantName.replace(/\s+/g, '_')}_Room_${agreement.roomNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 920,
          width: '100%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: isCompleted ? '#ecfdf5' : '#eff6ff',
                color: isCompleted ? '#059669' : '#2563eb',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <FileText size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Rent Agreement · {agreement.propertyName}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: isCompleted ? '#dcfce7' : '#fef3c7',
                    color: isCompleted ? '#166534' : '#92400e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>{isCompleted ? 'Fully Executed (हस्ताक्षरित)' : 'Awaiting Tenant Signature'}</span>
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Room {agreement.roomNumber} · Tenant: {agreement.tenantName} · Host: {agreement.ownerName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isCompleted && onOpenSignModal && (
              <button
                type="button"
                onClick={onOpenSignModal}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                }}
              >
                <PenLine size={14} />
                <span>Sign Agreement</span>
              </button>
            )}

            {pdfUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Download PDF"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Print PDF"
                >
                  <Printer size={14} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: 6,
                borderRadius: 8,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Verification Sub-bar */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: agreement.ownerSignature ? '#059669' : '#64748b' }}>
              <CheckCircle2 size={15} color={agreement.ownerSignature ? '#059669' : '#94a3b8'} />
              <span>
                <b>Landlord:</b> {agreement.ownerName} {agreement.ownerSignature ? '(Signed ✓)' : '(Pending)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: agreement.tenantSignature ? '#059669' : '#d97706' }}>
              <CheckCircle2 size={15} color={agreement.tenantSignature ? '#059669' : '#f59e0b'} />
              <span>
                <b>Tenant:</b> {agreement.tenantName} {agreement.tenantSignature ? '(Signed ✓)' : '(Awaiting Signature ✍️)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 11.5 }}>
            <ShieldCheck size={14} color="#059669" />
            <span>RoomSaathi Legal OS · 11-Month Standard Tenancy</span>
          </div>
        </div>

        {/* PDF Body Container */}
        <div style={{ flex: 1, background: '#525659', position: 'relative' }}>
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              title="Tenancy Agreement Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                color: '#ffffff',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <FileText size={48} style={{ opacity: 0.7 }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>No PDF Generated Yet</div>
              <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400 }}>
                The landlord has initialized your agreement details, but the contract file is pending generation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
