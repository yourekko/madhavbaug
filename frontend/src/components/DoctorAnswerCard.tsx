import { useState } from 'react';
import { FiCheck, FiExternalLink } from 'react-icons/fi';
import AnswerHtml from './AnswerHtml';
import { formatShortAgo } from '../lib/formatShortAgo';
import defaultDoctorAvatarUrl from '../assets/doctor-avatar-default.svg?url';
import { resolveMediaUrl } from '../lib/resolveMediaUrl';

export type DoctorAnswerCardDoctor = {
  name: string;
  titles: string;
  experienceYears: number | null;
  photoUrl: string | null;
  bio: string | null;
  branchName: string | null;
  profileLink: string | null;
};

type Props = {
  answerId: string;
  createdAt: string;
  answerHtml: string;
  questionCategory?: string | null;
  doctor: DoctorAnswerCardDoctor;
  /** CSS class for the outer article (forum vs my-discussions). */
  className?: string;
  answerHtmlClassName?: string;
};

function AboutTheAuthorSection({ doctor, answerId }: { doctor: DoctorAnswerCardDoctor; answerId: string }) {
  const bio = doctor.bio?.trim();
  const branch = doctor.branchName?.trim();
  const link = doctor.profileLink?.trim();
  const titles = doctor.titles?.trim();
  const years = doctor.experienceYears;
  const hasCredentialLine = Boolean(titles && titles !== 'Medical reviewer');

  const fallbackSummary =
    !bio && (hasCredentialLine || years != null)
      ? [
          `${doctor.name} is a verified clinician on this platform.`,
          hasCredentialLine ? `Credentials: ${titles}.` : null,
          years != null ? `Clinical experience: ${years} years.` : null,
        ]
          .filter(Boolean)
          .join(' ')
      : null;

  const headingId = `forum-author-${answerId}`;
  return (
    <section className="forum-author-card" aria-labelledby={headingId}>
      <h3 id={headingId} className="forum-author-heading">
        About the author
      </h3>
      {branch ? (
        <p className="forum-author-line">
          <span className="forum-author-label">Practice</span> {branch}
        </p>
      ) : null}
      {bio ? <p className="forum-author-bio">{bio}</p> : fallbackSummary ? <p className="forum-author-bio">{fallbackSummary}</p> : null}
      {!bio && !fallbackSummary && !branch && !link ? (
        <p className="forum-author-bio">
          Verified doctor profile. A short biography and practice details will appear here when the clinician adds them to
          their profile.
        </p>
      ) : null}
      {link ? (
        <p className="forum-author-line">
          <a href={link} className="forum-author-link" target="_blank" rel="noopener noreferrer">
            Professional profile <FiExternalLink aria-hidden className="forum-author-link-icon" />
          </a>
        </p>
      ) : null}
    </section>
  );
}

export default function DoctorAnswerCard({
  answerId,
  createdAt,
  answerHtml,
  questionCategory,
  doctor,
  className = 'forum-doctor-card',
  answerHtmlClassName = 'forum-doctor-body-html',
}: Props) {
  const photoSrc = resolveMediaUrl(doctor.photoUrl);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoSrc) && !photoFailed;
  const isDiabetesAnswer = questionCategory?.trim().toLowerCase() === 'diabetes';

  return (
    <article className={className}>
      <div className="forum-reviewed-badge">
        <FiCheck aria-hidden /> Medically reviewed
      </div>
      <div className="forum-doctor-label">Doctor’s answer</div>
      <div className="forum-doctor-profile">
        <div className="forum-doctor-photo-wrap">
          {showPhoto ? (
            <img
              src={photoSrc!}
              alt=""
              className="forum-doctor-photo-img"
              width={72}
              height={72}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <img
              src={defaultDoctorAvatarUrl}
              alt=""
              className="forum-doctor-photo-img forum-doctor-photo-img--default"
              width={72}
              height={72}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        <div>
          <div className="forum-doctor-name">{doctor.name}</div>
          <div className="forum-doctor-titles">{doctor.titles}</div>
          <div className="forum-doctor-verify">
            <span>
              <FiCheck className="forum-check" aria-hidden /> Verified expert
            </span>
            {doctor.experienceYears != null ? (
              <span className="forum-doctor-exp">Clinical experience: {doctor.experienceYears} years</span>
            ) : null}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>Answered {formatShortAgo(createdAt)}</div>
        </div>
      </div>
      <div className={`forum-doctor-body ${answerHtmlClassName}`.trim()}>
        <AnswerHtml html={answerHtml} />
      </div>
      {isDiabetesAnswer ? (
        <section className="forum-medical-disclaimer" aria-label="Medical disclaimer">
          <h4 className="forum-medical-disclaimer-title">Medical Disclaimer</h4>
          <p className="forum-medical-disclaimer-text">
            This response is for informational purposes only and is not a substitute for professional medical advice.
            Answers are based only on the details shared by the patient and do not include physical examination, reports,
            or full medical history. Actual diagnosis and treatment may vary. Please consult a qualified doctor in person
            for proper evaluation and care.
          </p>
        </section>
      ) : null}
      <AboutTheAuthorSection doctor={doctor} answerId={answerId} />
    </article>
  );
}
