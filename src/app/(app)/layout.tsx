import { ReactNode } from 'react';

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
