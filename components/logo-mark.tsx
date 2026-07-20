// Nado mark: a chat bubble whose bottom tears into a receipt edge.
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M9 15Q9 8 16 8L32 8Q39 8 39 15L39 31L35.5 35.5L31.5 31L27.5 35.5L23.5 31L19.5 35.5L15.5 31L11.5 35.5L9 31Z"
        fill="#F2B33D"
      />
      <rect x="14" y="15" width="16" height="3.4" rx="1.7" fill="#0E1526" />
      <rect x="14" y="22" width="10.5" height="3.4" rx="1.7" fill="#0E1526" />
    </svg>
  );
}
