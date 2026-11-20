import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TenantAgreement } from './tenantService';

/**
 * Converts a Data URI (e.g. data:application/pdf;base64,... or data:image/png;base64,...) to Uint8Array
 */
export function dataUriToUint8Array(dataUri: string): Uint8Array {
  const base64 = dataUri.split(',')[1] || dataUri;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts Uint8Array to Data URI
 */
export function uint8ArrayToDataUri(bytes: Uint8Array, mimeType: string = 'application/pdf'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Embeds owner and tenant signatures onto the last page of any PDF agreement
 */
export async function embedSignaturesIntoPdf(
  pdfData: string | Uint8Array,
  ownerSignatureDataUri?: string,
  tenantSignatureDataUri?: string,
  agreement?: TenantAgreement
): Promise<string> {
  let pdfBytes: Uint8Array;
  if (typeof pdfData === 'string') {
    pdfBytes = dataUriToUint8Array(pdfData);
  } else {
    pdfBytes = pdfData;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const leftMargin = 50;

  // Embed Owner Signature
  if (ownerSignatureDataUri) {
    try {
      const ownerPngBytes = dataUriToUint8Array(ownerSignatureDataUri);
      const ownerPngImage = await pdfDoc.embedPng(ownerPngBytes);
      
      // Draw signature on landlord box (x: 75, y: 115)
      lastPage.drawImage(ownerPngImage, {
        x: leftMargin + 25,
        y: 115,
        width: 140,
        height: 45,
      });

      lastPage.drawText(`Digitally Signed by Owner: ${new Date(agreement?.ownerSignedAt || Date.now()).toLocaleString('en-IN')}`, {
        x: leftMargin + 20,
        y: 98,
        size: 6.5,
        font: fontRegular,
        color: rgb(0.1, 0.5, 0.2),
      });
    } catch (e) {
      console.error('Failed to embed owner signature', e);
    }
  }

  // Embed Tenant Signature
  if (tenantSignatureDataUri) {
    try {
      const tenantPngBytes = dataUriToUint8Array(tenantSignatureDataUri);
      const tenantPngImage = await pdfDoc.embedPng(tenantPngBytes);
      
      // Draw signature on tenant box (x: 315, y: 115)
      lastPage.drawImage(tenantPngImage, {
        x: leftMargin + 265,
        y: 115,
        width: 140,
        height: 45,
      });

      lastPage.drawText(`Digitally Signed by Tenant: ${new Date(agreement?.tenantSignedAt || Date.now()).toLocaleString('en-IN')}`, {
        x: leftMargin + 260,
        y: 98,
        size: 6.5,
        font: fontRegular,
        color: rgb(0.1, 0.4, 0.7),
      });

      // Digital verification stamp badge
      lastPage.drawRectangle({
        x: width - 165,
        y: 40,
        width: 115,
        height: 22,
        color: rgb(0.9, 0.98, 0.92),
        borderColor: rgb(0.2, 0.65, 0.3),
        borderWidth: 0.8,
      });

      lastPage.drawText('VERIFIED DIGITAL CONTRACT', {
        x: width - 160,
        y: 48,
        size: 6.5,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.2),
      });
    } catch (e) {
      console.error('Failed to embed tenant signature', e);
    }
  }

  const outputBytes = await pdfDoc.save();
  return uint8ArrayToDataUri(outputBytes);
}
