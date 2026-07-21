// Shared desktop framing for every chat/form-style screen: on narrow
// viewports this is invisible (the panel already fills 100% width), on
// wider viewports it centers a capped-height, rounded, shadowed panel on
// a dark backdrop instead of letting the mobile-width column float alone
// on the plain page background.
export function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh w-full bg-ink sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-10">
      <div
        className={`mx-auto h-dvh w-full sm:h-[min(860px,90dvh)] sm:overflow-hidden sm:rounded-[28px] sm:shadow-[0_50px_100px_-30px_rgba(0,0,0,0.65)] sm:ring-1 sm:ring-white/10 ${
          wide ? "sm:max-w-[820px]" : "max-w-[480px] sm:max-w-[480px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
