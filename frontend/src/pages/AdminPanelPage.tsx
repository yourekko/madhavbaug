import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FaArrowRight,
  FaBars,
  FaChartColumn,
  FaClipboardList,
  FaFileLines,
  FaHouse,
  FaRightFromBracket,
  FaShieldHalved,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import { AdminDashboardCharts } from '../components/admin/AdminDashboardCharts';
import { Seo } from '../components/Seo';
import { useAuthModal } from '../context/AuthModalContext';
import { useSession } from '../context/SessionContext';
import { apiRequest } from '../lib/api';
import { QUESTION_CATEGORY_ALL } from '../constants/questionCategories';
import './AdminPanel.css';

type AdminDashboard = {
  questionCounts: Record<string, number>;
  totalQuestions: number;
  userCounts: { doctors: number; patients: number; platformStaff: number };
  contentCounts?: { answers: number; publishedAnswers: number };
  questionCategoryCounts?: Record<string, number>;
  trends?: Array<{
    date: string;
    signIns: number;
    activeUsers: number;
    newQuestions: number;
  }>;
  sessionSummary?: {
    signInsLast7Days: number;
    distinctActiveUsersLast7Days: number;
    newQuestionsLast7Days: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    actorName: string | null;
  }>;
};

type AdminQuestionPatient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  signupLocation?: string | null;
  memberSince: string;
  accountUpdatedAt?: string;
  isActive?: boolean;
  signInMethod?: 'google' | 'phone_or_email';
};

type AdminQuestion = {
  id: string;
  title: string;
  body?: string;
  status: string;
  category: string;
  patientUserId: string;
  createdAt?: string;
  patientAgeGroup?: string | null;
  patientGender?: string | null;
  patientHistory?: string | null;
  patient?: AdminQuestionPatient | null;
};

type Doctor = {
  id: string;
  name: string;
  email: string | null;
};

type DoctorAnalytics = {
  doctorUserId: string;
  doctorName: string;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  branchName: string | null;
  profileLink: string | null;
  isActive: boolean;
  totalAnswers: number;
  answersLast30Days: number;
  assignedQuestions: number;
  lastAnswerAt: string | null;
  categoriesAnswered: Array<{ category: string; count: number }>;
};

type PatientAnalytics = {
  patientUserId: string;
  patientName: string;
  email: string | null;
  phone: string | null;
  signupLocation: string | null;
  isActive: boolean;
  memberSince: string;
  accountUpdatedAt: string;
  signInMethod: 'google' | 'phone_or_email';
  totalQuestions: number;
  questionsLast30Days: number;
  answeredQuestions: number;
  followups: number;
  lastQuestionAt: string | null;
  categoriesAsked: Array<{ category: string; count: number }>;
};

type DoctorAnalyticsDetail = {
  doctor: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    branchName: string | null;
    profileLink: string | null;
  };
  summary: {
    totalAnswered: number;
    answersLast30Days: number;
    averageResponseHours: number;
    medianResponseHours: number;
    totalResponseHours: number;
  };
  categoriesAnswered: Array<{ category: string; count: number }>;
  dailyActivity: Array<{ date: string; answered: number }>;
  activityBreakdown: Array<{ action: string; count: number }>;
  recentAnswers: Array<{
    answerId: string;
    questionId: string;
    questionTitle: string;
    category: string;
    answeredAt: string;
    turnaroundHours: number;
  }>;
};

type SeoPage = {
  slug: string;
  title: string;
  metaDescription: string | null;
  robots: string | null;
};

type QuestionSeoRow = {
  questionId: string;
  forumSlug: string | null;
  category: string;
  categorySlug: string | null;
  questionPreview: string;
  answerCount: number;
  doctorName: string | null;
  publicPath: string | null;
  publicUrl: string | null;
  inSitemap: boolean;
  autoTitle: string;
  autoDescription: string;
  seo: {
    title: string;
    metaDescription: string | null;
    robots: string;
    updatedAt: string | null;
    isCustom: boolean;
  };
};

type AdminView = 'overview' | 'qa' | 'seo';

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open') return 'admin-pill admin-pill--open';
  if (s === 'assigned') return 'admin-pill admin-pill--assigned';
  if (s === 'answered') return 'admin-pill admin-pill--answered';
  if (s === 'closed') return 'admin-pill admin-pill--closed';
  return 'admin-pill';
}

function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCompactDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function patientSignInLabel(method: AdminQuestionPatient['signInMethod'] | PatientAnalytics['signInMethod']): string {
  if (method === 'google') return 'Google';
  if (method === 'phone_or_email') return 'Phone / email + password';
  return '—';
}

function topCategoriesText(rows: Array<{ category: string; count: number }>, max = 3): string {
  if (!rows.length) return '—';
  return rows
    .slice(0, max)
    .map((row) => `${row.category} (${row.count})`)
    .join(', ');
}

type ExportColumn<Row> = { key: keyof Row; label: string };

function exportToCsv<Row extends Record<string, unknown>>(
  rows: Row[],
  columns: ExportColumn<Row>[],
  filename: string,
) {
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const header = columns.map((column) => escape(column.label)).join(',');
  const body = rows
    .map((row) => columns.map((column) => escape(row[column.key])).join(','))
    .join('\n');
  const content = `${header}\n${body}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel<Row extends Record<string, unknown>>(
  rows: Row[],
  columns: ExportColumn<Row>[],
  filename: string,
  sheetName: string,
) {
  const excelRows = rows.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, column) => {
      acc[column.label] = row[column.key];
      return acc;
    }, {}),
  );
  const ws = XLSX.utils.json_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function exportToPdf<Row extends Record<string, unknown>>(
  rows: Row[],
  columns: ExportColumn<Row>[],
  filename: string,
  title: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  autoTable(doc, {
    startY: 56,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [1, 101, 137] },
  });
  doc.save(filename);
}

export default function AdminPanelPage() {
  const { openAuth } = useAuthModal();
  const { token, user, isAuthenticated, logout } = useSession();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorReports, setDoctorReports] = useState<DoctorAnalytics[]>([]);
  const [patientReports, setPatientReports] = useState<PatientAnalytics[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctorDetail, setDoctorDetail] = useState<DoctorAnalyticsDetail | null>(null);
  const [doctorDetailLoading, setDoctorDetailLoading] = useState(false);
  const [seoHome, setSeoHome] = useState<SeoPage | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [questionSeoRows, setQuestionSeoRows] = useState<QuestionSeoRow[]>([]);
  const [editingSeoId, setEditingSeoId] = useState<string | null>(null);
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editSeoRobots, setEditSeoRobots] = useState('index,follow');
  const [seoSaving, setSeoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qaCategoryFilter, setQaCategoryFilter] = useState('');
  const [patientReportCategoryFilter, setPatientReportCategoryFilter] = useState('');

  const loadAll = useCallback(async () => {
    if (!token) return;
    const questionsParams = new URLSearchParams({ limit: '100' });
    if (qaCategoryFilter.trim()) questionsParams.set('category', qaCategoryFilter.trim());
    const [dash, q, d, s, dr, pr, qSeo] = await Promise.all([
      apiRequest<AdminDashboard>('/admin/dashboard', {}, token),
      apiRequest<AdminQuestion[]>(`/admin/questions?${questionsParams.toString()}`, {}, token),
      apiRequest<Doctor[]>('/admin/doctors', {}, token),
      apiRequest<SeoPage | null>('/admin/seo/pages/home', {}, token),
      apiRequest<DoctorAnalytics[]>('/admin/reports/doctors', {}, token),
      apiRequest<PatientAnalytics[]>('/admin/reports/patients', {}, token),
      apiRequest<QuestionSeoRow[]>('/admin/seo/questions', {}, token).catch(() => [] as QuestionSeoRow[]),
    ]);
    setDashboard(dash);
    setQuestions(q);
    setDoctors(d);
    setDoctorReports(dr);
    setPatientReports(pr);
    setQuestionSeoRows(qSeo);
    setSeoHome(s);
    setSeoTitle(s?.title ?? 'Home');
    setSeoDescription(s?.metaDescription ?? '');
  }, [token, qaCategoryFilter]);

  useEffect(() => {
    if (!token) return;
    loadAll().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load admin data.'));
  }, [token, loadAll]);

  const qaCategorySelectOptions = useMemo(() => {
    const set = new Set<string>(QUESTION_CATEGORY_ALL);
    for (const q of questions) set.add(q.category);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const patientCategorySelectOptions = useMemo(() => {
    const set = new Set<string>(QUESTION_CATEGORY_ALL);
    for (const p of patientReports) {
      for (const c of p.categoriesAsked) set.add(c.category);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [patientReports]);

  const filteredPatientReports = useMemo(() => {
    const cat = patientReportCategoryFilter.trim();
    if (!cat) return patientReports;
    return patientReports.filter((p) => p.categoriesAsked.some((c) => c.category === cat));
  }, [patientReports, patientReportCategoryFilter]);

  function navTo(view: AdminView) {
    setActiveView(view);
    setSidebarOpen(false);
  }

  async function assignDoctor(questionId: string, doctorUserId: string) {
    if (!token) return;
    await apiRequest(`/admin/questions/${questionId}/assign-doctor`, {
      method: 'POST',
      body: JSON.stringify({ doctorUserId }),
    }, token);
    await loadAll();
  }

  async function deleteQuestion(q: AdminQuestion) {
    if (!token) return;
    const previewSource = q.body?.trim() || q.title;
    const preview = previewSource.length > 160 ? `${previewSource.slice(0, 160)}…` : previewSource;
    if (!window.confirm(`Permanently delete this question from the database?\n\n${preview}`)) return;
    try {
      setError(null);
      await apiRequest<{ ok: boolean }>(`/admin/questions/${q.id}`, { method: 'DELETE' }, token);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete question.');
    }
  }

  async function setUserActive(userId: string, name: string, role: 'patient' | 'doctor', isActive: boolean) {
    if (!token) return;
    const action = isActive ? 'reactivate' : 'deactivate';
    const label = role === 'doctor' ? 'doctor' : 'patient';
    if (
      !window.confirm(
        `${isActive ? 'Reactivate' : 'Deactivate'} ${label} "${name}"?\n\n${
          isActive
            ? 'They will be able to sign in again.'
            : 'They will not be able to sign in. Their questions and answers stay in the system.'
        }`,
      )
    ) {
      return;
    }
    try {
      setError(null);
      await apiRequest<{ ok: boolean }>(
        `/admin/users/${userId}/active`,
        { method: 'PATCH', body: JSON.stringify({ isActive }) },
        token,
      );
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} user.`);
    }
  }

  async function saveSeo() {
    if (!token) return;
    await apiRequest('/admin/seo/pages/home', {
      method: 'PUT',
      body: JSON.stringify({ pageType: 'home', title: seoTitle, metaDescription: seoDescription, robots: 'index,follow' }),
    }, token);
    await loadAll();
  }

  function startEditQuestionSeo(row: QuestionSeoRow) {
    setEditingSeoId(row.questionId);
    setEditSeoTitle(row.seo.title);
    setEditSeoDescription(row.seo.metaDescription ?? '');
    setEditSeoRobots(row.seo.robots || 'index,follow');
  }

  async function saveQuestionSeo(questionId: string) {
    if (!token) return;
    setSeoSaving(true);
    try {
      setError(null);
      await apiRequest(`/admin/seo/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editSeoTitle.trim(),
          metaDescription: editSeoDescription.trim(),
          robots: editSeoRobots.trim() || 'index,follow',
        }),
      }, token);
      setEditingSeoId(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save Q&A SEO.');
    } finally {
      setSeoSaving(false);
    }
  }

  async function openDoctorDetail(doctorUserId: string) {
    if (!token) return;
    setSelectedDoctorId(doctorUserId);
    setDoctorDetailLoading(true);
    try {
      const detail = await apiRequest<DoctorAnalyticsDetail>(`/admin/reports/doctors/${doctorUserId}`, {}, token);
      setDoctorDetail(detail);
    } finally {
      setDoctorDetailLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="ap-gate-page">
        <Seo title="Admin console" description="Platform admin sign-in for Q&A and SEO tools." canonicalPath="/forum/admin/panel"
        noindex />
        <div className="content-wrap ap-gate-inner">
          <div className="ap-gate-card">
            <div className="ap-gate-accent" aria-hidden />
            <div className="ap-gate-icon-wrap">
              <FaShieldHalved className="ap-gate-icon" aria-hidden />
            </div>
            <h1 className="ap-gate-title">Admin console</h1>
            <p className="ap-gate-lead">
              This area is for <strong>platform operators</strong> only. Sign in with the admin <strong>email</strong> and
              password issued to your team—not the patient phone login.
            </p>
            <div className="ap-gate-steps">
              <h2>How to sign in</h2>
              <ol>
                <li>
                  Click <strong>Open admin sign-in</strong> below.
                </li>
                <li>
                  Enter your <strong>admin email</strong> and password.
                </li>
                <li>
                  After success, this page will load Q&amp;A monitoring and SEO tools.
                </li>
              </ol>
            </div>
            <p className="ap-gate-hint">
              <strong>Local / dev:</strong> If the backend seeded a default user on first start, check{' '}
              <code>backend/.env</code> for <code>DEFAULT_ADMIN_EMAIL</code> and{' '}
              <code>DEFAULT_ADMIN_PASSWORD</code> (see <code>backend/.env.example</code> for names). Production accounts
              should be created only by your team.
            </p>
            <div className="ap-gate-actions">
              <button
                type="button"
                className="ap-gate-btn ap-gate-btn--primary"
                onClick={() => openAuth({ defaultTab: 'signin', variant: 'admin' })}
              >
                Open admin sign-in
                <FaArrowRight aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <main className="ap-gate-page">
        <Seo title="Admin console" description="Platform admin access." canonicalPath="/forum/admin/panel"
        noindex />
        <div className="content-wrap ap-gate-inner">
          <div className="ap-gate-card ap-gate-card--notice">
            <div className="ap-gate-accent" aria-hidden />
            <div className="ap-gate-icon-wrap">
              <FaShieldHalved className="ap-gate-icon" aria-hidden />
            </div>
            <h1 className="ap-gate-title">Admin access required</h1>
            <p className="ap-gate-lead">
              You’re signed in as <strong>{user?.role ?? 'a user'}</strong>. This console is limited to{' '}
              <strong>admin</strong> or <strong>superadmin</strong> roles.
            </p>
            <div className="ap-gate-actions">
              <button type="button" className="ap-gate-btn ap-gate-btn--secondary" onClick={() => logout()}>
                Sign out
              </button>
              <button
                type="button"
                className="ap-gate-btn ap-gate-btn--primary"
                onClick={() => openAuth({ defaultTab: 'signin', variant: 'admin' })}
              >
                Admin sign-in
                <FaArrowRight aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const qc = dashboard?.questionCounts ?? {};
  const pipeline = (qc.open ?? 0) + (qc.assigned ?? 0);
  const trends = dashboard?.trends ?? [];
  const sessionSummary = dashboard?.sessionSummary;
  const contentCounts = dashboard?.contentCounts;
  const categoryCounts = dashboard?.questionCategoryCounts ?? {};

  const doctorReportRows = doctorReports.map((doctor) => ({
    doctorName: doctor.doctorName,
    email: doctor.email ?? '',
    phone: doctor.phone ?? '',
    whatsappNumber: doctor.whatsappNumber ?? '',
    branchName: doctor.branchName ?? '',
    profileLink: doctor.profileLink ?? '',
    totalAnswers: doctor.totalAnswers,
    answersLast30Days: doctor.answersLast30Days,
    assignedQuestions: doctor.assignedQuestions,
    topCategories: topCategoriesText(doctor.categoriesAnswered, 5),
    lastAnswerAt: formatCompactDate(doctor.lastAnswerAt),
  }));

  const patientReportRows = filteredPatientReports.map((patient) => ({
    patientUserId: patient.patientUserId,
    patientName: patient.patientName,
    email: patient.email ?? '',
    phone: patient.phone ?? '',
    signupLocation: patient.signupLocation?.trim() ?? '',
    accountStatus: patient.isActive === false ? 'Inactive' : 'Active',
    signInMethod: patientSignInLabel(patient.signInMethod),
    memberSince: formatCompactDate(patient.memberSince),
    accountUpdatedAt: formatCompactDate(patient.accountUpdatedAt),
    totalQuestions: patient.totalQuestions,
    questionsLast30Days: patient.questionsLast30Days,
    answeredQuestions: patient.answeredQuestions,
    followups: patient.followups,
    topCategories: topCategoriesText(patient.categoriesAsked, 5),
    lastQuestionAt: formatCompactDate(patient.lastQuestionAt),
  }));

  const doctorColumns: ExportColumn<(typeof doctorReportRows)[number]>[] = [
    { key: 'doctorName', label: 'Doctor' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'whatsappNumber', label: 'WhatsApp' },
    { key: 'branchName', label: 'Branch' },
    { key: 'profileLink', label: 'Profile Link' },
    { key: 'totalAnswers', label: 'Total Answers' },
    { key: 'answersLast30Days', label: 'Answers Last 30 Days' },
    { key: 'assignedQuestions', label: 'Assigned Questions' },
    { key: 'topCategories', label: 'Top Categories' },
    { key: 'lastAnswerAt', label: 'Last Active' },
  ];

  const patientColumns: ExportColumn<(typeof patientReportRows)[number]>[] = [
    { key: 'patientUserId', label: 'User ID' },
    { key: 'patientName', label: 'Patient' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'signupLocation', label: 'Location (signup)' },
    { key: 'accountStatus', label: 'Account' },
    { key: 'signInMethod', label: 'Sign-in method' },
    { key: 'memberSince', label: 'Member since' },
    { key: 'accountUpdatedAt', label: 'Profile updated' },
    { key: 'totalQuestions', label: 'Total Questions' },
    { key: 'questionsLast30Days', label: 'Questions Last 30 Days' },
    { key: 'answeredQuestions', label: 'Answered Questions' },
    { key: 'followups', label: 'Follow-ups' },
    { key: 'topCategories', label: 'Top Categories' },
    { key: 'lastQuestionAt', label: 'Last Question' },
  ];

  return (
    <main className={`admin-console${sidebarOpen ? ' admin-console--sidebar-open' : ''}`}>
      <Seo title="Admin console" description="Platform dashboard, Q&A, and SEO." canonicalPath="/forum/admin/panel"
        noindex />
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
      />
      <aside id="admin-sidebar" className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <FaShieldHalved aria-hidden className="admin-sidebar-brand-icon" />
          <div>
            <div className="admin-sidebar-brand-title">Console</div>
            <div className="admin-sidebar-brand-sub">Madhavbaug</div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item${activeView === 'overview' ? ' is-active' : ''}`}
            onClick={() => navTo('overview')}
          >
            <FaChartColumn aria-hidden />
            Dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-item${activeView === 'qa' ? ' is-active' : ''}`}
            onClick={() => navTo('qa')}
          >
            <FaClipboardList aria-hidden />
            Q&amp;A queue
          </button>
          <button
            type="button"
            className={`admin-nav-item${activeView === 'seo' ? ' is-active' : ''}`}
            onClick={() => navTo('seo')}
          >
            <FaFileLines aria-hidden />
            SEO &amp; meta
          </button>
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/forum" className="admin-sidebar-link" onClick={() => setSidebarOpen(false)}>
            <FaHouse aria-hidden />
            Main site
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? <FaXmark aria-hidden /> : <FaBars aria-hidden />}
          </button>
          <div className="admin-topbar-title">
            <h1>
              {activeView === 'overview' && 'Dashboard'}
              {activeView === 'qa' && 'Q&A monitoring'}
              {activeView === 'seo' && 'SEO controls'}
            </h1>
            <p className="admin-topbar-sub">Signed in as {user?.name ?? user?.email ?? 'Admin'}</p>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-role-chip">
              {user?.role === 'superadmin' ? 'Superadmin' : user?.role === 'admin' ? 'Admin' : user?.role ?? '—'}
            </span>
            <button type="button" className="admin-logout-btn" onClick={() => logout()}>
              <FaRightFromBracket aria-hidden />
              Log out
            </button>
          </div>
        </header>

        <div className="admin-body">
          {error ? <div className="admin-banner admin-banner--error">{error}</div> : null}

          {activeView === 'overview' && (
            <>
              <section className="admin-kpi-grid">
                <article className="admin-kpi">
                  <div className="admin-kpi-icon admin-kpi-icon--blue">
                    <FaClipboardList aria-hidden />
                  </div>
                  <div className="admin-kpi-body">
                    <div className="admin-kpi-value">{dashboard?.totalQuestions ?? '—'}</div>
                    <div className="admin-kpi-label">Total questions</div>
                  </div>
                </article>
                <article className="admin-kpi">
                  <div className="admin-kpi-icon admin-kpi-icon--amber">
                    <FaChartColumn aria-hidden />
                  </div>
                  <div className="admin-kpi-body">
                    <div className="admin-kpi-value">{dashboard ? pipeline : '—'}</div>
                    <div className="admin-kpi-label">Open pipeline</div>
                    <div className="admin-kpi-hint">Open + assigned</div>
                  </div>
                </article>
                <article className="admin-kpi">
                  <div className="admin-kpi-icon admin-kpi-icon--teal">
                    <FaUsers aria-hidden />
                  </div>
                  <div className="admin-kpi-body">
                    <div className="admin-kpi-value">{dashboard?.userCounts.doctors ?? '—'}</div>
                    <div className="admin-kpi-label">Doctors</div>
                  </div>
                </article>
                <article className="admin-kpi">
                  <div className="admin-kpi-icon admin-kpi-icon--slate">
                    <FaUsers aria-hidden />
                  </div>
                  <div className="admin-kpi-body">
                    <div className="admin-kpi-value">{dashboard?.userCounts.patients ?? '—'}</div>
                    <div className="admin-kpi-label">Patients</div>
                  </div>
                </article>
              </section>

              {(sessionSummary || contentCounts) && (
                <section className="admin-mini-stats" aria-label="Seven-day summary">
                  {sessionSummary ? (
                    <>
                      <article className="admin-mini-stat">
                        <div className="admin-mini-stat-label">Sign-ins (7 days)</div>
                        <div className="admin-mini-stat-value">{sessionSummary.signInsLast7Days}</div>
                        <div className="admin-mini-stat-hint">Successful logins</div>
                      </article>
                      <article className="admin-mini-stat">
                        <div className="admin-mini-stat-label">Active users (7 days)</div>
                        <div className="admin-mini-stat-value">{sessionSummary.distinctActiveUsersLast7Days}</div>
                        <div className="admin-mini-stat-hint">Distinct people with activity</div>
                      </article>
                      <article className="admin-mini-stat">
                        <div className="admin-mini-stat-label">New questions (7 days)</div>
                        <div className="admin-mini-stat-value">{sessionSummary.newQuestionsLast7Days}</div>
                        <div className="admin-mini-stat-hint">Threads created</div>
                      </article>
                    </>
                  ) : null}
                  {contentCounts ? (
                    <article className="admin-mini-stat">
                      <div className="admin-mini-stat-label">Published answers</div>
                      <div className="admin-mini-stat-value">{contentCounts.publishedAnswers}</div>
                      <div className="admin-mini-stat-hint">Of {contentCounts.answers} total answers</div>
                    </article>
                  ) : null}
                </section>
              )}

              <AdminDashboardCharts
                questionCounts={qc}
                totalQuestions={dashboard?.totalQuestions ?? 0}
                categoryCounts={categoryCounts}
                trends={trends}
              />

              <section className="admin-panel">
                <h2 className="admin-panel-title">Doctor-wise analysis</h2>
                <p className="admin-panel-lead">Category coverage, response activity, and profile-level performance.</p>
                <div className="admin-export-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToCsv(doctorReportRows, doctorColumns, `doctor-report-${new Date().toISOString().slice(0, 10)}.csv`)}>
                    Export CSV
                  </button>
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToExcel(doctorReportRows, doctorColumns, `doctor-report-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Doctors')}>
                    Export Excel
                  </button>
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToPdf(doctorReportRows, doctorColumns, `doctor-report-${new Date().toISOString().slice(0, 10)}.pdf`, 'Doctor-wise Analysis Report')}>
                    Export PDF
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--analytics">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Answers</th>
                        <th>Last 30 days</th>
                        <th>Assigned</th>
                        <th>Top categories</th>
                        <th>Last active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorReports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="admin-table-empty">
                            No doctor analytics found.
                          </td>
                        </tr>
                      ) : (
                        doctorReports.map((doctor) => (
                          <tr
                            key={doctor.doctorUserId}
                            className={`admin-clickable-row${selectedDoctorId === doctor.doctorUserId ? ' is-active' : ''}`}
                            onClick={() => openDoctorDetail(doctor.doctorUserId).catch(() => undefined)}
                          >
                            <td>
                              <div className="admin-td-strong">{doctor.doctorName}</div>
                              <div className="admin-td-muted">{doctor.email ?? doctor.whatsappNumber ?? '—'}</div>
                              <div className="admin-td-muted">{doctor.branchName ?? 'No branch set'}</div>
                              {doctor.isActive === false ? (
                                <span className="admin-qa-account-flag admin-qa-account-flag--inactive">Inactive</span>
                              ) : null}
                            </td>
                            <td>{doctor.totalAnswers}</td>
                            <td>{doctor.answersLast30Days}</td>
                            <td>{doctor.assignedQuestions}</td>
                            <td className="admin-td-muted">{topCategoriesText(doctor.categoriesAnswered)}</td>
                            <td className="admin-td-muted">{formatCompactDate(doctor.lastAnswerAt)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {doctor.isActive === false ? (
                                <button
                                  type="button"
                                  className="admin-btn-secondary"
                                  onClick={() =>
                                    setUserActive(doctor.doctorUserId, doctor.doctorName, 'doctor', true).catch(
                                      () => undefined,
                                    )
                                  }
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-btn-danger"
                                  onClick={() =>
                                    setUserActive(doctor.doctorUserId, doctor.doctorName, 'doctor', false).catch(
                                      () => undefined,
                                    )
                                  }
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="admin-panel-lead">Tip: click any doctor row to open detailed performance insights.</p>
                {doctorDetailLoading ? <div className="admin-banner">Loading doctor analysis…</div> : null}
                {doctorDetail ? (
                  <section className="admin-detail-card">
                    <div className="admin-detail-head">
                      <h3>{doctorDetail.doctor.name} — detailed report</h3>
                      <p>
                        {doctorDetail.doctor.email ?? doctorDetail.doctor.whatsappNumber ?? 'No contact'} ·{' '}
                        {doctorDetail.doctor.branchName ?? 'No branch'}
                      </p>
                    </div>
                    <div className="admin-detail-kpis">
                      <article>
                        <span>Total answered</span>
                        <strong>{doctorDetail.summary.totalAnswered}</strong>
                      </article>
                      <article>
                        <span>Answers (30 days)</span>
                        <strong>{doctorDetail.summary.answersLast30Days}</strong>
                      </article>
                      <article>
                        <span>Avg response time</span>
                        <strong>{doctorDetail.summary.averageResponseHours} hrs</strong>
                      </article>
                      <article>
                        <span>Median response time</span>
                        <strong>{doctorDetail.summary.medianResponseHours} hrs</strong>
                      </article>
                      <article>
                        <span>Total response hours</span>
                        <strong>{doctorDetail.summary.totalResponseHours} hrs</strong>
                      </article>
                    </div>
                    <div className="admin-detail-grid">
                      <div>
                        <h4>Category depth</h4>
                        <ul className="admin-detail-list">
                          {doctorDetail.categoriesAnswered.length === 0 ? (
                            <li>—</li>
                          ) : (
                            doctorDetail.categoriesAnswered.map((row) => (
                              <li key={row.category}>
                                <span>{row.category}</span>
                                <strong>{row.count}</strong>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4>Activity breakdown (last 30 days)</h4>
                        <ul className="admin-detail-list">
                          {doctorDetail.activityBreakdown.length === 0 ? (
                            <li>—</li>
                          ) : (
                            doctorDetail.activityBreakdown.map((row) => (
                              <li key={row.action}>
                                <span>{row.action}</span>
                                <strong>{row.count}</strong>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4>Recent answered queries</h4>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Question</th>
                              <th>Category</th>
                              <th>Answered on</th>
                              <th>Response time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doctorDetail.recentAnswers.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="admin-table-empty">
                                  No answered questions yet.
                                </td>
                              </tr>
                            ) : (
                              doctorDetail.recentAnswers.map((answer) => (
                                <tr key={answer.answerId}>
                                  <td className="admin-td-strong">{answer.questionTitle}</td>
                                  <td>{answer.category}</td>
                                  <td className="admin-td-muted">{formatCompactDate(answer.answeredAt)}</td>
                                  <td>{answer.turnaroundHours.toFixed(1)} hrs</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                ) : null}
              </section>

              <section className="admin-panel">
                <h2 className="admin-panel-title">Patient-wise analytics report</h2>
                <p className="admin-panel-lead">Question volume, follow-up behavior, and category demand by patient.</p>
                <div className="admin-toolbar-row">
                  <label className="admin-filter-field">
                    <span className="admin-filter-label">Filter by category</span>
                    <select
                      className="admin-select"
                      value={patientReportCategoryFilter}
                      onChange={(e) => setPatientReportCategoryFilter(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {patientCategorySelectOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-export-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToCsv(patientReportRows, patientColumns, `patient-report-${new Date().toISOString().slice(0, 10)}.csv`)}>
                    Export CSV
                  </button>
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToExcel(patientReportRows, patientColumns, `patient-report-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Patients')}>
                    Export Excel
                  </button>
                  <button type="button" className="admin-btn-secondary" onClick={() => exportToPdf(patientReportRows, patientColumns, `patient-report-${new Date().toISOString().slice(0, 10)}.pdf`, 'Patient-wise Analytics Report')}>
                    Export PDF
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--analytics">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Account</th>
                        <th>Sign-in</th>
                        <th>Member since</th>
                        <th>Updated</th>
                        <th>Total questions</th>
                        <th>Last 30 days</th>
                        <th>Answered</th>
                        <th>Follow-ups</th>
                        <th>Top categories</th>
                        <th>Last question</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientReports.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="admin-table-empty">
                            No patient analytics found.
                          </td>
                        </tr>
                      ) : filteredPatientReports.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="admin-table-empty">
                            No patients match this category filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPatientReports.map((patient) => (
                          <tr key={patient.patientUserId}>
                            <td>
                              <div className="admin-td-strong">{patient.patientName}</div>
                              <code className="admin-qa-user-id" title={patient.patientUserId}>
                                {patient.patientUserId.slice(0, 8)}…
                              </code>
                            </td>
                            <td className="admin-td-contact">
                              {patient.email ? (
                                <a className="admin-qa-mail" href={`mailto:${patient.email}`}>
                                  {patient.email}
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="admin-td-contact">
                              {patient.phone ? (
                                <a className="admin-qa-tel" href={`tel:${patient.phone.replace(/\s/g, '')}`}>
                                  {patient.phone}
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="admin-td-muted">{patient.signupLocation?.trim() || '—'}</td>
                            <td>{patient.isActive === false ? 'Inactive' : 'Active'}</td>
                            <td className="admin-td-muted">{patientSignInLabel(patient.signInMethod)}</td>
                            <td className="admin-td-muted">{formatCompactDate(patient.memberSince)}</td>
                            <td className="admin-td-muted">{formatCompactDate(patient.accountUpdatedAt)}</td>
                            <td>{patient.totalQuestions}</td>
                            <td>{patient.questionsLast30Days}</td>
                            <td>{patient.answeredQuestions}</td>
                            <td>{patient.followups}</td>
                            <td className="admin-td-muted">{topCategoriesText(patient.categoriesAsked)}</td>
                            <td className="admin-td-muted">{formatCompactDate(patient.lastQuestionAt)}</td>
                            <td>
                              {patient.isActive === false ? (
                                <button
                                  type="button"
                                  className="admin-btn-secondary"
                                  onClick={() =>
                                    setUserActive(patient.patientUserId, patient.patientName, 'patient', true).catch(
                                      () => undefined,
                                    )
                                  }
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-btn-danger"
                                  onClick={() =>
                                    setUserActive(patient.patientUserId, patient.patientName, 'patient', false).catch(
                                      () => undefined,
                                    )
                                  }
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel">
                <h2 className="admin-panel-title">Recent activity</h2>
                <p className="admin-panel-lead">Audit trail from the last platform actions</p>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard?.recentActivity ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="admin-table-empty">
                            No activity logged yet.
                          </td>
                        </tr>
                      ) : (
                        dashboard!.recentActivity.map((row) => (
                          <tr key={row.id}>
                            <td className="admin-td-muted">{formatActivityTime(row.createdAt)}</td>
                            <td>{row.actorName ?? '—'}</td>
                            <td>
                              <code className="admin-code">{row.action}</code>
                            </td>
                            <td className="admin-td-muted">
                              {row.entityType}
                              {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeView === 'qa' && (
            <section className="admin-panel">
              <h2 className="admin-panel-title">Question queue</h2>
              <p className="admin-panel-lead">
                Doctors usually claim threads by expertise. Use assignment only when routing a case to a specific
                clinician.
              </p>
              <div className="admin-toolbar-row">
                <label className="admin-filter-field">
                  <span className="admin-filter-label">Filter by category</span>
                  <select
                    className="admin-select"
                    value={qaCategoryFilter}
                    onChange={(e) => setQaCategoryFilter(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {qaCategorySelectOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--qa">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Patient</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Assign</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="admin-table-empty">
                          No questions in the queue.
                        </td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                      <Fragment key={q.id}>
                        <tr>
                          <td className="admin-td-strong admin-td-question">{q.body ?? q.title}</td>
                          <td className="admin-td-contact">
                            {q.patient ? (
                              <>
                                <div className="admin-qa-contact-name">{q.patient.name}</div>
                                {q.patient.isActive === false ? (
                                  <span className="admin-qa-account-flag admin-qa-account-flag--inactive">Inactive</span>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <div className="admin-td-muted">No profile loaded</div>
                                <code className="admin-qa-user-id" title={q.patientUserId}>
                                  {q.patientUserId.slice(0, 8)}…
                                </code>
                              </>
                            )}
                          </td>
                          <td className="admin-td-contact">
                            {q.patient?.phone ? (
                              <a className="admin-qa-tel" href={`tel:${q.patient.phone.replace(/\s/g, '')}`}>
                                {q.patient.phone}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="admin-td-contact">
                            {q.patient?.email ? (
                              <a className="admin-qa-mail" href={`mailto:${q.patient.email}`}>
                                {q.patient.email}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>{q.category}</td>
                          <td>
                            <span className={statusBadgeClass(q.status)}>{q.status}</span>
                          </td>
                          <td>
                            <select
                              className="admin-select"
                              defaultValue=""
                              aria-label={`Assign doctor for ${(q.body ?? q.title).slice(0, 120)}`}
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignDoctor(q.id, e.target.value).catch(() => undefined);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Optional…</option>
                              {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-btn-danger"
                              onClick={() => deleteQuestion(q).catch(() => undefined)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        <tr className="admin-qa-meta-row">
                          <td colSpan={8}>
                            <div className="admin-qa-patient-strip">
                              <div className="admin-qa-patient-block">
                                <span className="admin-qa-patient-title">Patient (signup)</span>
                                {q.patient ? (
                                  <dl className="admin-qa-dl">
                                    <div className="admin-qa-dl-wide">
                                      <dt>User ID</dt>
                                      <dd>
                                        <code className="admin-code">{q.patient.id}</code>
                                      </dd>
                                    </div>
                                    <div>
                                      <dt>Name</dt>
                                      <dd>{q.patient.name}</dd>
                                    </div>
                                    <div>
                                      <dt>Phone</dt>
                                      <dd>
                                        {q.patient.phone ? (
                                          <a href={`tel:${q.patient.phone.replace(/\s/g, '')}`}>{q.patient.phone}</a>
                                        ) : (
                                          '—'
                                        )}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt>Email</dt>
                                      <dd>
                                        {q.patient.email ? (
                                          <a href={`mailto:${q.patient.email}`}>{q.patient.email}</a>
                                        ) : (
                                          '—'
                                        )}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt>Account</dt>
                                      <dd>{q.patient.isActive === false ? 'Inactive' : 'Active'}</dd>
                                    </div>
                                    <div>
                                      <dt>Sign-in</dt>
                                      <dd>{patientSignInLabel(q.patient.signInMethod)}</dd>
                                    </div>
                                    <div>
                                      <dt>Location</dt>
                                      <dd>{q.patient.signupLocation?.trim() || '—'}</dd>
                                    </div>
                                    <div>
                                      <dt>Member since</dt>
                                      <dd>{formatCompactDate(q.patient.memberSince)}</dd>
                                    </div>
                                    <div>
                                      <dt>Profile updated</dt>
                                      <dd>
                                        {q.patient.accountUpdatedAt
                                          ? formatCompactDate(q.patient.accountUpdatedAt)
                                          : '—'}
                                      </dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="admin-qa-muted">
                                    No patient profile on this row. Question is tied to user ID{' '}
                                    <code className="admin-code">{q.patientUserId}</code>.
                                  </p>
                                )}
                              </div>
                              <div className="admin-qa-patient-block">
                                <span className="admin-qa-patient-title">With this question</span>
                                <dl className="admin-qa-dl">
                                  <div>
                                    <dt>Age group</dt>
                                    <dd>{q.patientAgeGroup?.trim() || '—'}</dd>
                                  </div>
                                  <div>
                                    <dt>Gender</dt>
                                    <dd>{q.patientGender?.trim() || '—'}</dd>
                                  </div>
                                  <div className="admin-qa-dl-wide">
                                    <dt>Relevant history</dt>
                                    <dd>{q.patientHistory?.trim() || '—'}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeView === 'seo' && (
            <>
              <section className="admin-panel admin-panel--seo">
                <h2 className="admin-panel-title">Homepage SEO</h2>
                <p className="admin-panel-lead">WordPress-style meta for the main landing page.</p>
                <label className="admin-field">
                  <span className="admin-field-label">Meta title</span>
                  <input
                    className="admin-input"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">Meta description</span>
                  <textarea
                    className="admin-textarea"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={5}
                  />
                </label>
                <div className="admin-seo-actions">
                  <button type="button" className="admin-btn-primary" onClick={() => saveSeo().catch(() => undefined)}>
                    Save changes
                  </button>
                  {seoHome ? (
                    <span className="admin-seo-meta">Slug: {seoHome.slug}</span>
                  ) : null}
                </div>
              </section>

              <section className="admin-panel">
                <h2 className="admin-panel-title">Q&amp;A / answer page SEO</h2>
                <p className="admin-panel-lead">
                  Every published doctor answer has an indexable question page. Edit title and meta description here —
                  leave blank fields as auto-generated from the answer content, or customize for search.
                </p>
                <p className="admin-panel-lead">
                  Live sitemap:{' '}
                  <a href="https://madhavbaug.onrender.com/public/forum/sitemap.xml" target="_blank" rel="noreferrer">
                    API sitemap.xml
                  </a>
                </p>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--analytics">
                    <thead>
                      <tr>
                        <th>Question / answer</th>
                        <th>Public URL</th>
                        <th>SEO title</th>
                        <th>Meta description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionSeoRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="admin-table-empty">
                            No published doctor answers yet. Once a doctor publishes an answer, the Q&amp;A page appears
                            here for SEO editing.
                          </td>
                        </tr>
                      ) : (
                        questionSeoRows.map((row) => {
                          const isEditing = editingSeoId === row.questionId;
                          return (
                            <tr key={row.questionId}>
                              <td>
                                <div className="admin-td-strong">{row.questionPreview}</div>
                                <div className="admin-td-muted">
                                  {row.category}
                                  {row.doctorName ? ` · ${row.doctorName}` : ''}
                                  {` · ${row.answerCount} answer${row.answerCount === 1 ? '' : 's'}`}
                                </div>
                              </td>
                              <td className="admin-td-muted">
                                {row.publicUrl ? (
                                  <a href={row.publicUrl} target="_blank" rel="noreferrer">
                                    Open page
                                  </a>
                                ) : (
                                  '—'
                                )}
                                <div>{row.inSitemap ? 'In sitemap' : 'Not in sitemap'}</div>
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    className="admin-input"
                                    value={editSeoTitle}
                                    onChange={(e) => setEditSeoTitle(e.target.value)}
                                    maxLength={180}
                                  />
                                ) : (
                                  <span className="admin-td-muted">{row.seo.title}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <textarea
                                    className="admin-textarea"
                                    value={editSeoDescription}
                                    onChange={(e) => setEditSeoDescription(e.target.value)}
                                    rows={3}
                                    maxLength={320}
                                  />
                                ) : (
                                  <span className="admin-td-muted">{row.seo.metaDescription ?? '—'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <select
                                    className="admin-select"
                                    value={editSeoRobots}
                                    onChange={(e) => setEditSeoRobots(e.target.value)}
                                  >
                                    <option value="index,follow">Index</option>
                                    <option value="noindex,follow">Noindex</option>
                                  </select>
                                ) : (
                                  <>
                                    <div>{row.seo.isCustom ? 'Custom' : 'Auto'}</div>
                                    <div className="admin-td-muted">{row.seo.robots}</div>
                                  </>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <div className="admin-export-actions">
                                    <button
                                      type="button"
                                      className="admin-btn-primary"
                                      disabled={seoSaving}
                                      onClick={() => saveQuestionSeo(row.questionId).catch(() => undefined)}
                                    >
                                      {seoSaving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-btn-secondary"
                                      disabled={seoSaving}
                                      onClick={() => setEditingSeoId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => startEditQuestionSeo(row)}
                                  >
                                    Edit SEO
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
