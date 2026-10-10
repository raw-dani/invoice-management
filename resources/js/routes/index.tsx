import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

const withSuspense = (Component: React.ComponentType) => (
    <Suspense fallback={<LoadingFallback />}>
        <Component />
    </Suspense>
);

const LoginPage = React.lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../features/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const CustomerListPage = React.lazy(() => import('../features/customers/CustomerListPage'));
const CustomerDetailPage = React.lazy(() => import('../features/customers/CustomerDetailPage'));
const CustomerFormPage = React.lazy(() => import('../features/customers/CustomerFormPage'));
const ProductListPage = React.lazy(() => import('../features/products/ProductListPage'));
const ProductDetailPage = React.lazy(() => import('../features/products/ProductDetailPage'));
const ProductFormPage = React.lazy(() => import('../features/products/ProductFormPage'));
const InvoiceListPage = React.lazy(() => import('../features/invoices/InvoiceListPage'));
const InvoiceDetailPage = React.lazy(() => import('../features/invoices/InvoiceDetailPage'));
const InvoiceFormPage = React.lazy(() => import('../features/invoices/InvoiceFormPage'));
const QuoteListPage = React.lazy(() => import('../features/quotes/QuoteListPage'));
const QuoteDetailPage = React.lazy(() => import('../features/quotes/QuoteDetailPage'));
const QuoteFormPage = React.lazy(() => import('../features/quotes/QuoteFormPage'));
const PaymentListPage = React.lazy(() => import('../features/payments/PaymentListPage'));
const PaymentDetailPage = React.lazy(() => import('../features/payments/PaymentDetailPage'));
const SubscriptionListPage = React.lazy(() => import('../features/subscriptions/SubscriptionListPage'));
const SubscriptionDetailPage = React.lazy(() => import('../features/subscriptions/SubscriptionDetailPage'));
const SubscriptionFormPage = React.lazy(() => import('../features/subscriptions/SubscriptionFormPage'));
const EmailTemplatesPage = React.lazy(() => import('../features/email/EmailTemplatesPage'));
const TemplatesPage = React.lazy(() => import('../features/templates/TemplatesPage'));
const ActivityLogPage = React.lazy(() => import('../features/activity/ActivityLogPage'));
const ReportsPage = React.lazy(() => import('../features/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('../features/settings/SettingsPage'));
const NotificationsPage = React.lazy(() => import('../features/notifications/NotificationsPage'));
const UsersPage = React.lazy(() => import('../features/users/UsersPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));

export const router = createBrowserRouter([
    { path: '/login', element: withSuspense(LoginPage) },
    { path: '/register', element: withSuspense(RegisterPage) },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: withSuspense(DashboardPage) },

                    { path: '/customers', element: withSuspense(CustomerListPage) },
                    { path: '/customers/new', element: withSuspense(CustomerFormPage) },
                    { path: '/customers/:id', element: withSuspense(CustomerDetailPage) },
                    { path: '/customers/:id/edit', element: withSuspense(CustomerFormPage) },

                    { path: '/products', element: withSuspense(ProductListPage) },
                    { path: '/products/new', element: withSuspense(ProductFormPage) },
                    { path: '/products/:id', element: withSuspense(ProductDetailPage) },
                    { path: '/products/:id/edit', element: withSuspense(ProductFormPage) },

                    { path: '/invoices', element: withSuspense(InvoiceListPage) },
                    { path: '/invoices/new', element: withSuspense(InvoiceFormPage) },
                    { path: '/invoices/:id', element: withSuspense(InvoiceDetailPage) },
                    { path: '/invoices/:id/edit', element: withSuspense(InvoiceFormPage) },

                    { path: '/quotes', element: withSuspense(QuoteListPage) },
                    { path: '/quotes/new', element: withSuspense(QuoteFormPage) },
                    { path: '/quotes/:id', element: withSuspense(QuoteDetailPage) },
                    { path: '/quotes/:id/edit', element: withSuspense(QuoteFormPage) },

                    { path: '/payments', element: withSuspense(PaymentListPage) },
                    { path: '/payments/:id', element: withSuspense(PaymentDetailPage) },

                    { path: '/subscriptions', element: withSuspense(SubscriptionListPage) },
                    { path: '/subscriptions/new', element: withSuspense(SubscriptionFormPage) },
                    { path: '/subscriptions/:id', element: withSuspense(SubscriptionDetailPage) },
                    { path: '/subscriptions/:id/edit', element: withSuspense(SubscriptionFormPage) },
                    { path: '/email-templates', element: withSuspense(EmailTemplatesPage) },
                    { path: '/templates', element: withSuspense(TemplatesPage) },
                    { path: '/activity-log', element: withSuspense(ActivityLogPage) },
                    { path: '/reports', element: withSuspense(ReportsPage) },
                    { path: '/settings', element: withSuspense(SettingsPage) },
                    { path: '/notifications', element: withSuspense(NotificationsPage) },
                    { path: '/users', element: withSuspense(UsersPage) },
                    { path: '/profile', element: withSuspense(ProfilePage) },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
]);
