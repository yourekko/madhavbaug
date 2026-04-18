import { Link } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext';
import { FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import { FaRss, FaTwitter } from 'react-icons/fa6';
import { Reveal } from './Reveal';

export default function SiteFooter() {
  const { openAuth } = useAuthModal();
  const logoSrc = `${import.meta.env.BASE_URL}madhavbaug-logo.png`;

  return (
    <Reveal as="footer" className="footer footer-forest site-footer-v2">
      <div className="content-wrap footer-main">
        <div className="footer-grid footer-inner">
          <div className="footer-brand-col">
            <div className="footer-logo-card">
              <img
                className="footer-brand-logo"
                src={logoSrc}
                alt="Madhavbaug — Advanced Ayurveda Clinics and Hospitals"
                width={260}
                height={88}
                decoding="async"
              />
            </div>
            <p className="footer-desc">
              Pioneers in Ayurvedic cardiac care and lifestyle disease reversal with over 300+ clinics across India.
            </p>
            <div className="social footer-social footer-social-forest">
              <a href="#facebook" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="#twitter" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#linkedin" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="#rss" aria-label="Blog RSS">
                <FaRss />
              </a>
            </div>
          </div>
          <div>
            <h4>Forum Categories</h4>
            <ul className="footer-links">
              <li>
                <Link to="/forum/diabetes-management">Diabetes Reversal</Link>
              </li>
              <li>
                <a href="#heart">Heart Health</a>
              </li>
              <li>
                <a href="#weight">Weight Management</a>
              </li>
              <li>
                <a href="#hypertension">Hypertension</a>
              </li>
              <li>
                <a href="#ayurveda">Ayurveda Basics</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Patient Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="#stories">Success Stories</a>
              </li>
              <li>
                <a href="#calculators">Health Calculators</a>
              </li>
              <li>
                <a href="#diet">Diet Plans</a>
              </li>
              <li>
                <a href="#research">Clinical Research</a>
              </li>
              <li>
                <a href="#clinic">Find a Clinic</a>
              </li>
            </ul>
          </div>
          <div className="footer-emergency">
            <h4>Emergency Contact</h4>
            <p className="footer-emergency-desc">For medical emergencies, please call our 24/7 helpline immediately.</p>
            <p className="footer-phone">1800-266-6666</p>
            <button
              type="button"
              className="footer-book-btn"
              onClick={() => openAuth({ defaultTab: 'signup', variant: 'general' })}
            >
              Book Consultation
            </button>
          </div>
        </div>
        <div className="footer-bottom-bar footer-bottom-forest">
          <p>© 2026 Madhavbaug. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#medical">Medical Disclaimer</a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
