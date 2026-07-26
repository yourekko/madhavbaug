import { absoluteUrl } from './seoConfig';
import { seoPublicPath } from './seoPaths';
import type { ForumCategorySlug } from '../data/forumData';
import { forumNavLabel } from '../data/forumData';
import type { ForumDetailResponse } from '../lib/forumPublicApi';
import { extractQuestionTitle, forumQuestionPath } from '../lib/questionSlug';
import { forumAnswerAnchorId } from './forumQuestionSeo';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function answerToJsonLd(
  a: ForumDetailResponse['answers'][number],
  questionPath: string,
): Record<string, unknown> {
  const plain = stripHtml(a.answerHtml).slice(0, 5000);
  const author: Record<string, unknown> = {
    '@type': 'Person',
    name: a.doctor.name,
  };
  if (a.doctor.titles?.trim()) author.jobTitle = a.doctor.titles.trim();
  if (a.doctor.experienceYears != null) {
    author.description = `${a.doctor.experienceYears}+ years clinical experience`;
  }
  if (a.doctor.profileLink?.trim()) author.url = a.doctor.profileLink.trim();

  return {
    '@type': 'Answer',
    url: `${absoluteUrl(questionPath)}#${forumAnswerAnchorId(a.id)}`,
    text: plain,
    dateCreated: a.createdAt,
    upvoteCount: 0,
    author,
  };
}

export function forumQuestionPageJsonLd(
  categorySlug: ForumCategorySlug,
  detail: ForumDetailResponse,
): Record<string, unknown>[] {
  const categoryLabel = forumNavLabel(categorySlug);
  const questionPath = forumQuestionPath(categorySlug, detail.slug);
  const questionName = extractQuestionTitle(detail.body, 110);
  const answers = detail.answers.map((a) => answerToJsonLd(a, questionPath));

  const mainEntity: Record<string, unknown> = {
    '@type': 'Question',
    name: questionName,
    text: detail.body.slice(0, 5000),
    dateCreated: detail.createdAt,
    answerCount: detail.answers.length,
  };

  // Google QAPage: primary published answer = acceptedAnswer; others = suggestedAnswer
  if (answers.length === 1) {
    mainEntity.acceptedAnswer = answers[0];
  } else if (answers.length > 1) {
    mainEntity.acceptedAnswer = answers[0];
    mainEntity.suggestedAnswer = answers.slice(1);
  }

  const primaryAnswerText =
    detail.answers[0] != null ? stripHtml(detail.answers[0].answerHtml).slice(0, 300) : detail.body.slice(0, 300);

  const qaPage = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity,
    url: absoluteUrl(questionPath),
    name: questionName,
    description: primaryAnswerText,
    datePublished: detail.createdAt,
    dateModified: detail.answers[detail.answers.length - 1]?.createdAt ?? detail.createdAt,
  };

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: seoPublicPath('/forum') },
    { name: categoryLabel, path: seoPublicPath(`/forum/${categorySlug}`) },
    { name: extractQuestionTitle(detail.body, 48), path: questionPath },
  ]);

  const medicalPage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: questionName,
    description: primaryAnswerText,
    url: absoluteUrl(questionPath),
    about: { '@type': 'MedicalCondition', name: detail.category },
    specialty: 'https://schema.org/Ayurvedic',
  };
  if (detail.answers[0]) {
    medicalPage.lastReviewed = detail.answers[0].createdAt;
    medicalPage.reviewedBy = {
      '@type': 'Person',
      name: detail.answers[0].doctor.name,
      ...(detail.answers[0].doctor.titles?.trim()
        ? { jobTitle: detail.answers[0].doctor.titles.trim() }
        : {}),
    };
  }

  return [breadcrumbs, qaPage, medicalPage];
}

export function forumCategoryJsonLd(
  categorySlug: ForumCategorySlug,
  pageTitle: string,
  description: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description,
    url: absoluteUrl(seoPublicPath(`/forum/${categorySlug}`)),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Madhavbaug Health Forum',
      url: absoluteUrl(seoPublicPath('/forum')),
    },
  };
}
