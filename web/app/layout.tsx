import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HumanLens AI — Multimodal Communication De-escalation',
  description: 'Understand behavioral and emotional signals, detect potential escalation, and provide users with a real-time opportunity to pause, reflect, and respond constructively.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-white selection:text-black">
        {/* Subtle Apple-like ambient lighting in background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/[0.03] rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-sky-500/[0.02] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 -right-40 w-[450px] h-[450px] bg-emerald-500/[0.02] rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
