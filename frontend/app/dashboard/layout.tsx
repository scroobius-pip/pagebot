import Script from 'next/script';
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return <div className='w-full'>
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" defer></Script>
        {children}
    </div>
}