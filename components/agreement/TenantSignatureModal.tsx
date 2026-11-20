'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, PenTool, Type, ShieldCheck, Loader2 } from 'lucide-react';

interface TenantSignatureModalProps {
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  onSaveSignature: (sigDataUri: string) => Promise<void> | void;
  onClose: () => void;
}

export function TenantSignatureModal({
  tenantName,
  propertyName,
  roomNumber,
  onSaveSignature,
  onClose,
}: TenantSignatureModalProps) {
  const [activeMode, setActiveMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(tenantName || '');
  const [selectedFont, setSelectedFont] = useState<'cursive' | 'serif' | 'sans'>('cursive');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
  }, [activeMode]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      // prevent scroll on canvas
      if (e.cancelable) e.preventDefault();
    }
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;
    setHasDrawn(true);
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPt.x, currentPt.y);
    ctx.stroke();

    lastPointRef.current = currentPt;
  };

  const handleStopDraw = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const generateTypedSignatureDataUri = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 500;
    offscreen.height = 160;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';

    let fontStyle = 'italic 46px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    if (selectedFont === 'serif') {
      fontStyle = 'italic 38px "Playfair Display", "Times New Roman", serif';
    } else if (selectedFont === 'sans') {
      fontStyle = '600 36px "Inter", sans-serif';
    }

    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.fillText(typedName.trim() || tenantName, offscreen.width / 2, offscreen.height / 2);

    return offscreen.toDataURL('image/png');
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      let finalSigUri = '';
      if (activeMode === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) {
          alert('Please draw your signature in the box before proceeding.');
          setIsSaving(false);
          return;
        }
        finalSigUri = canvas.toDataURL('image/png');
      } else {
        if (!typedName.trim()) {
          alert('Please enter your full name for digital signature.');
          setIsSaving(false);
          return;
        }
        finalSigUri = generateTypedSignatureDataUri();
      }

      await onSaveSignature(finalSigUri);
    } catch (err) {
      console.error('Failed to save signature', err);
      alert('Error saving signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: 520,
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            padding: 4,
            borderRadius: 8,
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            <ShieldCheck size={16} />
            <span>RoomSaathi Digital Signature Verification</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            Sign Tenancy Agreement
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
            {tenantName} · Room {roomNumber} at {propertyName}
          </p>
        </div>

        {/* Toggle Mode: Draw or Type */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 14,
            gap: 4,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode('draw')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeMode === 'draw' ? '#ffffff' : 'transparent',
              color: activeMode === 'draw' ? '#0f172a' : '#64748b',
              boxShadow: activeMode === 'draw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <PenTool size={15} />
            <span>Draw (हाथ से साइन करें)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('type')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeMode === 'type' ? '#ffffff' : 'transparent',
              color: activeMode === 'type' ? '#0f172a' : '#64748b',
              boxShadow: activeMode === 'type' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Type size={15} />
            <span>Type Name (नाम टाइप करें)</span>
          </button>
        </div>

        {/* DRAW MODE */}
        {activeMode === 'draw' ? (
          <div>
            <div
              style={{
                position: 'relative',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 16,
                background: '#fafafa',
                overflow: 'hidden',
                touchAction: 'none',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 180,
                  display: 'block',
                  cursor: 'crosshair',
                  background: '#ffffff',
                }}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDrawMove}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleStopDraw}
              />

              {!hasDrawn && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    color: '#94a3b8',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ✍️ Draw your signature here with finger or mouse
                </div>
              )}

              {/* Bottom line marker */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 30,
                  left: 20,
                  right: 20,
                  borderBottom: '1px solid #e2e8f0',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={handleClearCanvas}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                <RotateCcw size={13} />
                <span>Clear Canvas</span>
              </button>
            </div>
          </div>
        ) : (
          /* TYPE MODE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Full Legal Name:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Font Style Options */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Select Signature Style:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'cursive', label: 'Cursive Script', font: 'italic "Brush Script MT", cursive' },
                  { id: 'serif', label: 'Classic Serif', font: 'italic "Playfair Display", serif' },
                  { id: 'sans', label: 'Clean Modern', font: '600 "Inter", sans-serif' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: selectedFont === f.id ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: selectedFont === f.id ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: selectedFont === f.id ? '#059669' : '#475569',
                      textAlign: 'center',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div
              style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: 16,
                background: '#ffffff',
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
              }}
            >
              <span
                style={{
                  fontSize: selectedFont === 'cursive' ? 32 : selectedFont === 'serif' ? 24 : 20,
                  fontFamily: selectedFont === 'cursive' ? '"Brush Script MT", cursive' : selectedFont === 'serif' ? 'serif' : 'sans-serif',
                  fontStyle: selectedFont === 'sans' ? 'normal' : 'italic',
                  color: '#0f172a',
                }}
              >
                {typedName.trim() || tenantName}
              </span>
            </div>
          </div>
        )}

        {/* Legal Consent Notice */}
        <div
          style={{
            margin: '16px 0',
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 11.5,
            color: '#64748b',
            lineHeight: 1.5,
          }}
        >
          ⚖️ <b>Legal Consent:</b> By clicking &quot;Apply &amp; Sign Agreement&quot;, you certify that you have reviewed the 11-month lease terms and agree that this digital signature is legally binding under the Information Technology Act.
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleConfirmSave}
          disabled={isSaving || (activeMode === 'draw' && !hasDrawn)}
          style={{
            width: '100%',
            background: isSaving || (activeMode === 'draw' && !hasDrawn) ? '#94a3b8' : '#059669',
            color: '#ffffff',
            padding: '13px 20px',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            cursor: isSaving || (activeMode === 'draw' && !hasDrawn) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
            transition: 'background 0.2s',
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Applying Signature to Contract...</span>
            </>
          ) : (
            <>
              <Check size={18} />
              <span>Apply & Sign Agreement (हस्ताक्षर पूरा करें)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
