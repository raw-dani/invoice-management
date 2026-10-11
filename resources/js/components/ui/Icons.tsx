import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export const IconBase: React.FC<IconProps> = ({ className = 'w-4 h-4', children, ...props }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
        {...props}
    >
        {children}
    </svg>
);

// Revenue / Cash / Banknotes
export const BanknotesIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H1.5m18.75 0H18a.75.75 0 01-.75-.75V4.5m0 0a60.07 60.07 0 00-15.797-2.101C1.453 2.201.727 2.741.727 3.495v1.005M18 6v12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6m15 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m9 5.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </IconBase>
);

// Invoices / Documents
export const DocumentTextIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </IconBase>
);

// Clock / Overdue / Aging / History
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
);

// Users / Customers
export const UsersIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </IconBase>
);

// Recurring / ArrowPath / Subscriptions
export const ArrowPathIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </IconBase>
);

// Bar Chart / Analytics
export const ChartBarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </IconBase>
);

// Trophy / Peak Record
export const TrophyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75a1.125 1.125 0 01-1.125-1.125V6.75A3.75 3.75 0 0110.875 3h2.25A3.75 3.75 0 0116.875 6.75v7.5c0 .621-.504 1.125-1.125 1.125h-.375v3.375zM6.75 6.75H4.875A2.625 2.625 0 002.25 9.375v.75a4.875 4.875 0 004.5 4.875v-1.5M17.25 6.75h1.875a2.625 2.625 0 012.625 2.625v.75a4.875 4.875 0 01-4.5 4.875v-1.5" />
    </IconBase>
);

// Calendar / Date Range
export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </IconBase>
);

// Star Icon
export const StarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.402z" clipRule="evenodd" />
    </svg>
);

// Check Circle / Success
export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
);

// Exclamation Circle / Warning / Alert
export const ExclamationCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </IconBase>
);

// Exclamation Triangle / High Warning
export const ExclamationTriangleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </IconBase>
);

// Trending Up / Growth
export const TrendingUpIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </IconBase>
);

// Building / Office / Company
export const BuildingOfficeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </IconBase>
);

// Building / Bank / Library
export const BuildingLibraryIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5H4.5V21m16.5 0H3" />
    </IconBase>
);

// Credit Card / Payments
export const CreditCardIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </IconBase>
);

// Bolt / Lightning / Instant
export const BoltIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </IconBase>
);

// Shield Check / Secure
export const ShieldCheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </IconBase>
);

// Wallet / Duitku
export const WalletIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </IconBase>
);

// Pause Circle
export const PauseCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
);

// Briefcase / Portfolio
export const BriefcaseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </IconBase>
);

// Lock Closed / Security / Demo
export const LockClosedIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </IconBase>
);

// Light Bulb / Tip
export const LightBulbIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.439a8.966 8.966 0 01-4.5 0m4.5 0v.75A2.25 2.25 0 0113.5 21h-3a2.25 2.25 0 01-2.25-2.25v-.75m7.5 0H7.5m9.375-9.375a6 6 0 10-9.75 0" />
    </IconBase>
);

// External Link
export const ArrowTopRightOnSquareIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </IconBase>
);

// Envelope / Mail
export const EnvelopeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </IconBase>
);

// Paper Airplane / Send Email
export const PaperAirplaneIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </IconBase>
);

// Beaker / Flask / Testing
export const BeakerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.032 14.47a4.5 4.5 0 003.182 7.68h7.572a4.5 4.5 0 003.182-7.68l-4.059-4.06a2.25 2.25 0 01-.659-1.591V3.104m-4.5 0h4.5m-4.5 0a1.5 1.5 0 00-1.5 1.5v.75h7.5v-.75a1.5 1.5 0 00-1.5-1.5" />
    </IconBase>
);

// Server / Hosting
export const ServerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 14.25v2.25a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25v-2.25m19.5 0H2.25m19.5 0V9a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 9v5.25m19.5 0v.25M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 6a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </IconBase>
);

// Cog / Settings
export const CogIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </IconBase>
);

// Sparkles / Demo Data
export const SparklesIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </IconBase>
);

// Document Duplicate / Quotes
export const DocumentDuplicateIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9H7.875c-.621 0-1.125.504-1.125 1.125v1.5m10.875 13.5h-9.75A1.125 1.125 0 016.75 16.5v-9m10.875 9.75V11.25a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0111.25 6.75v-1.5A3.375 3.375 0 007.875 1.875H6.75" />
    </IconBase>
);

// WhatsApp Icon
export const WhatsAppIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12.031 2C6.495 2 2 6.494 2 12.029c0 1.767.46 3.49 1.332 5.004L2 22l5.127-1.345a10.009 10.009 0 004.904 1.374h.005c5.534 0 10.029-4.495 10.029-10.03 0-2.68-1.044-5.2-2.94-7.094A9.96 9.96 0 0012.03 2zm5.85 14.288c-.244.686-1.42 1.309-1.956 1.393-.504.077-1.157.11-1.872-.119a16.635 16.635 0 01-3.664-1.742 12.87 12.87 0 01-3.818-4.004c-.604-.844-.82-1.782-.284-2.457.243-.306.536-.45.714-.45.18 0 .358 0 .513.008.169.009.395-.064.618.47.243.582.83 2.026.903 2.172.074.148.122.322.023.518-.098.196-.147.319-.293.49-.147.172-.31.385-.443.518-.148.147-.302.308-.13.604.172.296.766 1.26 1.642 2.04 1.127 1.004 2.079 1.314 2.375 1.462.296.147.469.123.643-.075.172-.197.74-86.862-1.092.123-.23.246-.192.42-.128.172.064 1.092.515 1.28.608.188.093.313.138.358.217.046.079.046.852-.198 1.538z" />
    </svg>
);

// Chevron Down / Right
export const ChevronDownIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </IconBase>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </IconBase>
);

// User Circle / Profile
export const UserCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.963 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </IconBase>
);

// Key / Security / Password
export const KeyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </IconBase>
);

// Eye / Show Password
export const EyeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </IconBase>
);

// Eye Slash / Hide Password
export const EyeSlashIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </IconBase>
);

// Arrow Right On Rectangle / Logout
export const ArrowRightOnRectangleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </IconBase>
);

// Bars3 / Hamburger Menu
export const Bars3Icon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </IconBase>
);

// XMark / Close
export const XMarkIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <IconBase className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </IconBase>
);

