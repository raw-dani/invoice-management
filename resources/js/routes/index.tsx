import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CustomerListPage from '../features/customers/CustomerListPage';
import CustomerDetailPage from '../features/customers/CustomerDetailPage';
import CustomerFormPage from '../features/customers/CustomerFormPage';
import ProductListPage from '../features/products/ProductListPage';
import ProductDetailPage from '../features/products/ProductDetailPage';
import ProductFormPage from '../features/products/ProductFormPage';
import InvoiceListPage from '../features/invoices/InvoiceListPage';
import InvoiceDetailPage from '../features/invoices/InvoiceDetailPage';
import InvoiceFormPage from '../features/invoices/InvoiceFormPage';
import QuoteListPage from '../features/quotes/QuoteListPage';
import QuoteDetailPage from '../features/quotes/QuoteDetailPage';
import QuoteFormPage from '../features/quotes/QuoteFormPage';
import PaymentListPage from '../features/payments/PaymentListPage';
import PaymentDetailPage from '../features/payments/PaymentDetailPage';
import SubscriptionListPage from '../features/subscriptions/SubscriptionListPage';
import SubscriptionDetailPage from '../features/subscriptions/SubscriptionDetailPage';
import SubscriptionFormPage from '../features/subscriptions/SubscriptionFormPage';
import EmailTemplatesPage from '../features/email/EmailTemplatesPage';
import TemplatesPage from '../features/templates/TemplatesPage';
import ActivityLogPage from '../features/activity/ActivityLogPage';
import ReportsPage from '../features/reports/ReportsPage';
import SettingsPage from '../features/settings/SettingsPage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import UsersPage from '../features/users/UsersPage';
import ProfilePage from '../features/profile/ProfilePage';

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <DashboardPage /> },

                    { path: '/customers', element: <CustomerListPage /> },
                    { path: '/customers/new', element: <CustomerFormPage /> },
                    { path: '/customers/:id', element: <CustomerDetailPage /> },
                    { path: '/customers/:id/edit', element: <CustomerFormPage /> },

                    { path: '/products', element: <ProductListPage /> },
                    { path: '/products/new', element: <ProductFormPage /> },
                    { path: '/products/:id', element: <ProductDetailPage /> },
                    { path: '/products/:id/edit', element: <ProductFormPage /> },

                    { path: '/invoices', element: <InvoiceListPage /> },
                    { path: '/invoices/new', element: <InvoiceFormPage /> },
                    { path: '/invoices/:id', element: <InvoiceDetailPage /> },
                    { path: '/invoices/:id/edit', element: <InvoiceFormPage /> },

                    { path: '/quotes', element: <QuoteListPage /> },
                    { path: '/quotes/new', element: <QuoteFormPage /> },
                    { path: '/quotes/:id', element: <QuoteDetailPage /> },
                    { path: '/quotes/:id/edit', element: <QuoteFormPage /> },

                    { path: '/payments', element: <PaymentListPage /> },
                    { path: '/payments/:id', element: <PaymentDetailPage /> },

                    { path: '/subscriptions', element: <SubscriptionListPage /> },
                    { path: '/subscriptions/new', element: <SubscriptionFormPage /> },
                    { path: '/subscriptions/:id', element: <SubscriptionDetailPage /> },
                    { path: '/subscriptions/:id/edit', element: <SubscriptionFormPage /> },
                    { path: '/email-templates', element: <EmailTemplatesPage /> },
                    { path: '/templates', element: <TemplatesPage /> },
                    { path: '/activity-log', element: <ActivityLogPage /> },
                    { path: '/reports', element: <ReportsPage /> },
                    { path: '/settings', element: <SettingsPage /> },
                    { path: '/notifications', element: <NotificationsPage /> },
                    { path: '/users', element: <UsersPage /> },
                    { path: '/profile', element: <ProfilePage /> },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
]);
