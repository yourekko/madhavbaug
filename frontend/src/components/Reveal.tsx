import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealTag = 'section' | 'header' | 'footer' | 'div';

export function Reveal({
  as,
  className = '',
  children,
}: {
  as: RevealTag;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag ref={ref as never} className={`reveal ${visible ? 'is-revealed' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
