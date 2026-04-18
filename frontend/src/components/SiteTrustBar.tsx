import { FaLock, FaScaleBalanced, FaShieldHeart, FaStethoscope } from 'react-icons/fa6';
import { Reveal } from './Reveal';

export default function SiteTrustBar() {
  return (
    <Reveal as="section" className="trust-strip">
      <div className="content-wrap trust-inner">
        <span>
          <FaStethoscope /> Medical Review
        </span>
        <span>
          <FaShieldHeart /> Evidence Based
        </span>
        <span>
          <FaScaleBalanced /> Clinically Guided
        </span>
        <span>
          <FaLock /> Privacy Protected
        </span>
      </div>
    </Reveal>
  );
}
