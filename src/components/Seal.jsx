export default function Seal({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#12141A" stroke="#E8A33D" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#E8A33D" strokeWidth="1.2" strokeDasharray="1.5 3.4" />
      <path
        d="M22 41 L22 23 L31 23 Q38 23 38 30 Q38 37 31 37 L24 37"
        fill="none"
        stroke="#F2EFE9"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
