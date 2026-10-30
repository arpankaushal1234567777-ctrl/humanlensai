import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { FairShowcase } from '../../components/fair/FairShowcase';

export const metadata: Metadata = {
  title: 'HumanLens AI — Live Exhibition Kiosk & De-escalation Demo',
  description: 'Interactive emotion mirror, anger detection biofeedback, and shareable de-escalation certificates for academic exhibition.'
};

export default function FairPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-[14px] bg-white/[0.07] border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">HL</span>
            </div>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <FairShowcase />
    </Suspense>
  );
}
