"use client";

import { useEffect, useState } from "react";

// Set by the onboarding page right after a brand-new seller is created —
// its mere presence is the "show the tour" signal, so returning sellers
// (who never pass through onboarding again) never trip it.
const TOUR_PENDING_KEY = "nado_tour_pending";

const STEPS = [
  {
    title: "Type your order",
    body: 'Write it like you\'d text a customer — "5 cartons of Indomie, 2 bags of rice, delivery 5,000". Nado turns it into a clean invoice.',
  },
  {
    title: "Invoices show up here",
    body: "Every saved invoice appears in this feed, right below the order that created it.",
  },
  {
    title: "Share and get paid",
    body: 'Each invoice card has "Copy payment link" to send to your buyer, and "Invoice" to download a copy.',
  },
  {
    title: "Track your sales",
    body: "Switch to the Dashboard tab anytime to see your total sales, pending invoices, and full history.",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(TOUR_PENDING_KEY) === "1") {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.removeItem(TOUR_PENDING_KEY);
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-[360px] rounded-[20px] bg-white p-5 shadow-[0_30px_60px_-20px_rgba(14,21,38,0.5)]">
        <div className="mb-3 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`}
            />
          ))}
        </div>
        <h2 className="mb-1.5 font-display text-[17px] font-bold text-text">{current.title}</h2>
        <p className="mb-5 text-[13.5px] leading-[1.5] text-muted">{current.body}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={dismiss}
            className="text-[13px] font-semibold text-muted"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
            className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-bold text-accent-ink"
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
