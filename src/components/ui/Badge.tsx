interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

export default function Badge({ color, children }: BadgeProps) {
  return <span className={`sm ${color}`}>{children}</span>;
}
