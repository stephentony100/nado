// Desktop treatment for every screen: no floating card on a backdrop — the
// content simply sits directly on the page's own background, centered with
// a wider max-width than the mobile column so it reads as a normal
// responsive web page rather than a phone screen pasted onto a desktop.
export function AppShell({
  children,
  wide = false,
  tone = "light",
}: {
  children: React.ReactNode;
  wide?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <div className={`min-h-dvh w-full ${tone === "dark" ? "bg-ink" : "bg-bg"}`}>
      <div
        className={`mx-auto h-dvh w-full ${wide ? "sm:max-w-[1040px]" : "sm:max-w-[600px]"}`}
      >
        {children}
      </div>
    </div>
  );
}
