'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/FileUploader';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { PaymentModal } from '@/components/PaymentModal';
import { PaymentSuccessToast } from '@/components/PaymentSuccessToast';
import { analyzeContract, payChallenge, X402PaymentError } from '@/lib/api';
import { X402Requirements } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPayingOnChain, setIsPayingOnChain] = useState(false);

  // x402 Payment Gate State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReqs, setPaymentReqs] = useState<X402Requirements | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Payment Success Side Notification Toast State
  const [showPaymentToast, setShowPaymentToast] = useState(false);
  const [confirmedTxid, setConfirmedTxid] = useState<string>('');

  const startAnalysis = async (file: File, proofTxId?: string) => {
    setIsProcessing(true);
    setCurrentStep(1);
    setErrorMsg(null);

    // Progress animation timer
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const response = await analyzeContract(file, proofTxId);
      setCurrentStep(5);

      setTimeout(() => {
        clearInterval(interval);
        router.push(`/amendments?reportId=${response.id}`);
      }, 800);

    } catch (err: any) {
      clearInterval(interval);
      setIsProcessing(false);

      if (err instanceof X402PaymentError) {
        // Intercept 402 Payment Required
        setPendingFile(file);
        setPaymentReqs(err.x402);
        setShowPaymentModal(true);
      } else {
        setErrorMsg(err.message || 'An error occurred while analyzing the contract.');
      }
    }
  };

  const handleFileSubmit = (file: File) => {
    startAnalysis(file);
  };

  const handleConfirmPayment = async () => {
    if (!pendingFile || !paymentReqs) return;
    
    try {
      setIsPayingOnChain(true);
      // Submit real Algorand TestNet transaction via backend account
      const payResult = await payChallenge(paymentReqs.reference_id);
      
      setShowPaymentModal(false);
      setIsPayingOnChain(false);

      // Trigger Side Toast Notification for Payment Success!
      if (payResult?.txid) {
        setConfirmedTxid(payResult.txid);
        setShowPaymentToast(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('justPaidTxId', payResult.txid);
        }
      }

      // Retry analyze call passing the confirmed real Algorand transaction ID
      startAnalysis(pendingFile, payResult.txid);
    } catch (err: any) {
      setIsPayingOnChain(false);
      setShowPaymentModal(false);
      setErrorMsg(err.message || 'Payment execution failed on Algorand TestNet.');
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setPendingFile(null);
    setPaymentReqs(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 daylight-grid bg-[#F8F9FA] text-[#212529]">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-mono text-[#C5A059] uppercase tracking-widest block font-bold bg-[#0A192F]/5 px-3 py-1 rounded-full border border-[#C5A059]/30 w-fit mx-auto">
          CONTRACT RISK AUDIT ENGINE
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif text-[#0A192F] tracking-tight">
          {isProcessing ? 'Analyzing Legal Document' : 'Upload Contract for Risk Audit'}
        </h1>
        <p className="text-[#212529] text-base max-w-xl mx-auto">
          {isProcessing
            ? 'Please wait while our AI engine scans clauses and evaluates liabilities.'
            : 'Select or drag your contract (PDF or DOCX) to detect high-risk terms instantly.'}
        </p>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/30 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle size={20} className="flex-shrink-0 text-red-600" />
          <div className="flex-grow">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {isProcessing ? (
        <ProcessingProgress currentStep={currentStep} />
      ) : (
        <FileUploader onFileSelect={handleFileSubmit} isLoading={isProcessing} />
      )}

      {/* x402 "Pay Now" Screen Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        amount={paymentReqs?.amount || 0.001}
        asset={paymentReqs?.asset || 'ALGO'}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
        isLoading={isPayingOnChain}
      />

      {/* Side Notification Toast After Successful Payment */}
      {showPaymentToast && (
        <PaymentSuccessToast
          txid={confirmedTxid}
          amount={paymentReqs?.amount || 0.001}
          onClose={() => setShowPaymentToast(false)}
        />
      )}
    </div>
  );
}
