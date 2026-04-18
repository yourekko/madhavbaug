import DOMPurify from 'dompurify';
import './AnswerHtml.css';

type Props = {
  html: string;
  className?: string;
};

/**
 * Renders stored doctor answers: HTML from TipTap, or plain text for legacy rows.
 */
export default function AnswerHtml({ html, className }: Props) {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const looksLikeMarkup =
    trimmed.startsWith('<') || /<\/[a-z]/i.test(trimmed) || /<br\s*\/?>/i.test(trimmed);

  if (!looksLikeMarkup) {
    return <p className={className}>{html}</p>;
  }

  const clean = DOMPurify.sanitize(html, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['src', 'alt', 'width', 'height', 'class', 'loading'],
  });

  return (
    <div
      className={className ? `answer-html ${className}` : 'answer-html'}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
