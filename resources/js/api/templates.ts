import api from './client';

export interface PdfTemplate {
    id: number;
    company_id: number | null;
    slug: string;
    name: string;
    is_active: boolean;
    is_default: boolean;
}

export const templatesApi = {
    invoice: () => api.get<{ data: PdfTemplate[] }>('/invoice-templates').then((r) => r.data.data),
    quote: () => api.get<{ data: PdfTemplate[] }>('/quote-templates').then((r) => r.data.data),
    activateInvoice: (id: number) => api.post(`/invoice-templates/${id}/activate`),
    activateQuote: (id: number) => api.post(`/quote-templates/${id}/activate`),
};