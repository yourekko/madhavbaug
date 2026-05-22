import { absoluteUrl } from './seoConfig';
import { seoPublicPath } from './seoPaths';
import type { ForumCategorySlug } from '../data/forumData';
import { forumNavLabel } from '../data/forumData';
import type { ForumDetailResponse } from '../lib/forumPublicApi';
import { extractQuestionTitle, forumQuestionPath } from '../lib/questionSlug';

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

export function forumQuestionPageJsonLd(
  categorySlug: ForumCategorySlug,
  detail: ForumDetailResponse,
): Record<string, unknown>[] {
  const categoryLabel = forumNavLabel(categorySlug);
  const questionPath = forumQuestionPath(categorySlug, detail.slug);
  const questionName = extractQuestionTitle(detail.body, 110);

  const answers = detail.answers.map((a) => ({
    '@type': 'Answer' as const,
    text: stripHtml(a.answerHtml).slice(0, 5000),
    dateCreated: a.createdAt,
    author: {
      '@type': 'Person',
      name: a.doctor.name,
      jobTitle: a.doctor.titles,
    },
  }));

  const mainEntity: Record<string, unknown> = {
    '@type': 'Question',
    name: questionName,
    text: detail.body.slice(0, 5000),
    dateCreated: detail.createdAt,
    answerCount: detail.answers.length,
  };
  if (answers.length === 1) {
    mainEntity.acceptedAnswer = answers[0];
  } else if (answers.length > 1) {
    mainEntity.suggestedAnswer = answers;
  }

  const qaPage = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity,
    url: absoluteUrl(questionPath),
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
    description: detail.body.slice(0, 300),
    url: absoluteUrl(questionPath),
    about: { '@type': 'MedicalCondition', name: detail.category },
  };
  if (detail.answers[0]) {
    medicalPage.lastReviewed = detail.answers[0].createdAt;
    medicalPage.reviewedBy = {
      '@type': 'Person',
      name: detail.answers[0].doctor.name,
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
