import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthModal, type AuthModalVariant } from '../components/AuthModal';

export type OpenAuthOptions = {
  /** Which tab to show when the modal opens */
  defaultTab?: 'signin' | 'signup';
  /** Hero “Ask question” copy vs generic header copy */
  variant?: AuthModalVariant;
  /** Called after successful sign-in / sign-up / Google (before modal closes) */
  onSuccess?: () => void;
};

type AuthModalContextValue = {
  openAuth: (options?: OpenAuthOptions) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'signin' | 'signup'>('signup');
  const [variant, setVariant] = useState<AuthModalVariant>('general');
  const onSuccessRef = useRef<(() => void) | null>(null);

  const openAuth = useCallback((opts?: OpenAuthOptions) => {
    setDefaultTab(opts?.defaultTab ?? 'signup');
    setVariant(opts?.variant ?? 'general');
    onSuccessRef.current = opts?.onSuccess ?? null;
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
    onSuccessRef.current = null;
  }, []);

  const handleAuthenticated = useCallback(() => {
    onSuccessRef.current?.();
    onSuccessRef.current = null;
  }, []);

  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={open}
        onClose={closeAuth}
        onAuthenticated={handleAuthenticated}
        defaultTab={defaultTab}
        variant={variant}
      />
    </AuthModalContext.Provider>
  );
}
