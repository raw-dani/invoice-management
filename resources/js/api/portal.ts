import api from './client';
import type { Invoice, Quote } from '../types';

export interface PublicPortalCompany {
    id: number;
    name: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    tax_number?: string | null;
}

export interface PublicPortalBank {
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    instructions: string | null;
}

export interface PublicPaymentGateways {
    active: string;
    midtrans?: { enabled: boolean; mode: string; client_key?: string | null };
    xendit?: { enabled: boolean; mode: string };
    doku?: { enabled: boolean; mode: string };
    duitku?: { enabled: boolean; mode: string };
}

export interface PublicInvoiceResponse {
    invoice: Invoice;
    company: PublicPortalCompany | null;
    bank: PublicPortalBank;
    payment_gateways?: PublicPaymentGateways;
}

export interface PublicQuoteResponse {
    quote: Quote;
    company: PublicPortalCompany | null;
}

export const portalApi = {
    getInvoice: (token: string) =>
        api.get<PublicInvoiceResponse>(`/public/invoices/${token}`).then((r) => r.data),

    uploadProof: (token: string, file: File, notes?: string) => {
        const formData = new FormData();
        formData.append('proof', file);
        if (notes) formData.append('notes', notes);
        return api.post<{ message: string; invoice: Invoice }>(`/public/invoices/${token}/proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data);
    },

    getQuote: (token: string) =>
        api.get<PublicQuoteResponse>(`/public/quotes/${token}`).then((r) => r.data),

    acceptQuote: (token: string) =>
        api.post<{ message: string; quote: Quote }>(`/public/quotes/${token}/accept`).then((r) => r.data),

    rejectQuote: (token: string) =>
        api.post<{ message: string; quote: Quote }>(`/public/quotes/${token}/reject`).then((r) => r.data),
};
