import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaBars, FaChevronDown, FaShieldHalved, FaStethoscope, FaXmark } from 'react-icons/fa6';
import { useAuthModal } from '../context/AuthModalContext';
import { useSession } from '../context/SessionContext';
import { DEFAULT_FORUM_SLUG, FORUM_NAV_ITEMS } from '../data/forumData';

export default function SiteHeader() {
  const { openAuth } = useAuthModal();
  const { isAuthenticated, logout, user } = useSession();
  const { pathname } = useLocation();
  const forumPathActive = pathname.startsWith('/forum');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add('nav-mobile-open');
    return () => document.body.classList.remove('nav-mobile-open');
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const headerModClass = isDoctor ? ' site-header--doctor' : isAdmin ? ' site-header--admin' : '';
  const innerModClass = isDoctor ? ' nav-inner--doctor' : isAdmin ? ' nav-inner--admin' : '';

  const brandSubline = isDoctor ? 'Doctor workspace' : isAdmin ? 'Admin console' : 'Community health forum';
  const logoSrc = `${import.meta.env.BASE_URL}madhavbaug-logo.png`;

  return (
    <header className={`navbar nav-entrance site-header ${menuOpen ? 'nav-open' : ''}${headerModClass}`}>
      <div className={`content-wrap nav-inner${innerModClass}`}>
        <NavLink to="/forum" className="brand brand-link" onClick={closeMenu}>
          <img
            className={`brand-logo${isDoctor ? ' brand-logo--doctor' : ''}${isAdmin ? ' brand-logo--admin' : ''}`}
            src={logoSrc}
            alt="Madhavbaug — Advanced Ayurveda Clinics and Hospitals"
            width={220}
            height={56}
            decoding="async"
          />
          <div className="brand-headline">
            <span className="brand-tagline">
              {brandSubline}
              {isDoctor ? (
                <span className="brand-role-pill" title="Signed in as a verified doctor">
                  Clinical
                </span>
              ) : null}
              {isAdmin ? (
                <span className="brand-role-pill brand-role-pill--admin" title="Full platform access">
                  Admin
                </span>
              ) : null}
            </span>
          </div>
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <FaXmark aria-hidden /> : <FaBars aria-hidden />}
        </button>
        <div className="nav-mobile-panel" id={menuId}>
          <nav
            className="site-nav-links"
            aria-label={isDoctor ? 'Doctor navigation' : isAdmin ? 'Admin navigation' : 'Main'}
          >
            <NavLink to="/forum" end className={({ isActive }) => (isActive ? 'nav-active' : '')} onClick={closeMenu}>
              Home
            </NavLink>
            <div className="nav-dropdown">
              <NavLink
                to={`/forum/${DEFAULT_FORUM_SLUG}`}
                className={({ isActive }) =>
                  isActive || forumPathActive ? 'nav-active nav-dropdown-trigger' : 'nav-dropdown-trigger'
                }
                onClick={closeMenu}
              >
                Forum
                <FaChevronDown className="nav-dropdown-chevron" aria-hidden />
              </NavLink>
              <div className="nav-dropdown-panel" role="menu" aria-label="Forum categories">
                <ul className="nav-dropdown-list">
                  {FORUM_NAV_ITEMS.map((item) => (
                    <li key={item.slug} role="none">
                      <NavLink
                        to={`/forum/${item.slug}`}
                        className={({ isActive }) => (isActive ? 'nav-dropdown-link is-active' : 'nav-dropdown-link')}
                        role="menuitem"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {isDoctor ? (
              <NavLink
                to="/forum/doctor/panel"
                className={({ isActive }) =>
                  isActive ? 'nav-active nav-link-doctor-hub' : 'nav-link-doctor-hub'
                }
                onClick={closeMenu}
              >
                <FaStethoscope aria-hidden className="nav-doctor-hub-icon" />
                Doctor panel
              </NavLink>
            ) : null}
            {isAdmin ? (
              <>
                <NavLink to="/forum/ask" className={({ isActive }) => (isActive ? 'nav-active' : '')} onClick={closeMenu}>
                  Ask Question
                </NavLink>
                <NavLink
                  to="/forum/my-discussions"
                  className={({ isActive }) => (isActive ? 'nav-active' : '')}
                  onClick={closeMenu}
                >
                  My Discussions
                </NavLink>
                <NavLink
                  to="/forum/admin/panel"
                  className={({ isActive }) =>
                    isActive ? 'nav-active nav-link-admin-hub' : 'nav-link-admin-hub'
                  }
                  onClick={closeMenu}
                >
                  <FaShieldHalved aria-hidden className="nav-admin-hub-icon" />
                  Admin panel
                </NavLink>
              </>
            ) : null}
            {!isDoctor && !isAdmin ? (
              <>
                <NavLink to="/forum/ask" className={({ isActive }) => (isActive ? 'nav-active' : '')} onClick={closeMenu}>
                  Ask Question
                </NavLink>
                {isAuthenticated ? (
                  <NavLink
                    to="/forum/my-discussions"
                    className={({ isActive }) => (isActive ? 'nav-active' : '')}
                    onClick={closeMenu}
                  >
                    My Discussions
                  </NavLink>
                ) : null}
              </>
            ) : null}
          </nav>
          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <span className="sign-in-link" aria-live="polite">
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <button
                  type="button"
                  className="btn-book"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="sign-in-link sign-in-btn"
                  onClick={() => {
                    openAuth({ defaultTab: 'signin', variant: 'general' });
                    closeMenu();
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="btn-book"
                  onClick={() => {
                    openAuth({ defaultTab: 'signup', variant: 'general' });
                    closeMenu();
                  }}
                >
                  Book Consultation
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
