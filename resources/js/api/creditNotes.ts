import client from './client';

export interface CreditNoteItem {
  id?: number;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
}

export interface CreditNoteAllocation {
  id: number;
  invoice_id: number;
  amount: number;
  allocated_at: string;
  notes?: string;
  invoice?: {
    id: number;
    invoice_number: string;
    total: number;
    balance: number;
  };
}

export interface CreditNote {
  id: number;
  company_id: number;
  customer_id: number;
  invoice_id?: number | null;
  credit_note_number: string;
  credit_note_date: string;
  status: 'draft' | 'open' | 'applied' | 'void';
  reason?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  allocated_amount: number;
  remaining_balance: number;
  currency: string;
  notes?: string;
  customer?: {
    id: number;
    customer_number: string;
    company_name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
  };
  invoice?: {
    id: number;
    invoice_number: string;
    balance: number;
  };
  items?: CreditNoteItem[];
  allocations?: CreditNoteAllocation[];
}

export interface StatementTransaction {
  date: string;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface CustomerStatementData {
  customer: {
    id: number;
    name: string;
    number: string;
    email?: string;
    phone?: string;
    credit_limit?: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  transactions: StatementTransaction[];
}

export const creditNotesApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; customer_id?: number; status?: string }) =>
    client.get('/credit-notes', { params }),
  get: (id: number) => client.get(`/credit-notes/${id}`),
  create: (data: any) => client.post('/credit-notes', data),
  allocate: (id: number, data: { invoice_id: number; amount: number; notes?: string }) =>
    client.post(`/credit-notes/${id}/allocate`, data),
  void: (id: number) => client.post(`/credit-notes/${id}/void`),
  downloadPdf: (id: number) => client.get(`/credit-notes/${id}/pdf`, { responseType: 'blob' }),
};

export const customerStatementApi = {
  getStatement: (customerId: number, startDate?: string, endDate?: string) =>
    client.get<CustomerStatementData>(`/customers/${customerId}/statement`, {
      params: { start_date: startDate, end_date: endDate },
    }),
  downloadPdf: (customerId: number, startDate?: string, endDate?: string) =>
    client.get(`/customers/${customerId}/statement/pdf`, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
    }),
};
