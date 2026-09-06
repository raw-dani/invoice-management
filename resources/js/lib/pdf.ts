import api from '../api/client';

/**
 * Download a PDF from a URL that requires Bearer auth.
 * Uses fetch to attach the auth header (since <a href> can't send Bearer token),
 * then triggers a blob download.
 */
export async function downloadPdf(url: string, filename: string): Promise<void> {
    const token = localStorage.getItem('auth_token');

    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } : {},
    });

    if (!res.ok) {
        throw new Error(`Failed to download PDF: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
}

export async function openPdfInNewTab(url: string): Promise<void> {
    const token = localStorage.getItem('auth_token');

    // Fetch and convert to blob URL so the new tab can preview without losing the header
    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } : {},
    });

    if (!res.ok) {
        throw new Error(`Failed to open PDF: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
}

export const pdfUrls = {
    invoice: (id: number) => `/api/invoices/${id}/pdf`,
    quote:   (id: number) => `/api/quotes/${id}/pdf`,
    receipt: (id: number) => `/api/payments/${id}/receipt`,
};

// Re-export so tsconfig considers this file used
export { api };
