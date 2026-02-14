import React from 'react';

// Common Icon Props
interface IconProps {
    className?: string;
    size?: number;
    color?: string;
}

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 5c5.5 0 9.7 4.2 11 7-1.3 2.8-5.5 7-11 7S2.3 14.8 1 12c1.3-2.8 5.5-7 11-7Zm0 3.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Zm0 2A1.8 1.8 0 1 1 12 13.8 1.8 1.8 0 0 1 12 10.2Z" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L11 13.6V4a1 1 0 0 1 1-1ZM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
    </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 .8 1.6L14 13.1V19a1 1 0 0 1-1.5.86l-3-1.8A1 1 0 0 1 9 17.2v-4.1L4.2 5.6A1 1 0 0 1 4 5Z" />
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const PinIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
        <circle cx="12" cy="7" r="2.5" />
        <path d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
);

export const OrdersIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 7h13v10H3V7Z" />
        <path d="M16 10h3l2 2v5h-5v-7Z" />
        <circle cx="7" cy="20" r="1" fill="currentColor" stroke="none" />
        <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
);

export const CurrencyIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export const ShoppingCartIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

export const BanIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
