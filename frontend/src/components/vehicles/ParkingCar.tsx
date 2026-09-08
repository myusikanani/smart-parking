interface Props {
  className?: string;
  color?: string;
  direction?: 'left' | 'right';
}

const ParkingCar = ({ className = '', color = '#06b6d4', direction = 'right' }: Props) => (
  <svg
    viewBox="0 0 60 30"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: direction === 'left' ? 'scaleX(-1)' : undefined }}
  >
    <rect x="5" y="8" width="50" height="16" rx="5" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
    <rect x="10" y="5" width="25" height="10" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1" />
    <rect x="8" y="18" width="12" height="4" rx="2" fill={color} opacity="0.2" />
    <rect x="40" y="18" width="12" height="4" rx="2" fill={color} opacity="0.2" />
    <circle cx="15" cy="28" r="4" stroke={color} strokeWidth="1.5" fill="#0a0a0f" />
    <circle cx="45" cy="28" r="4" stroke={color} strokeWidth="1.5" fill="#0a0a0f" />
    <rect x="3" y="13" width="5" height="3" rx="1" fill="#fbbf24" opacity="0.8" />
    <rect x="52" y="13" width="5" height="3" rx="1" fill="#ef4444" opacity="0.8" />
  </svg>
);

export default ParkingCar;
