import { useCallback, useEffect, useState } from 'react';
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

type AdminQuestion = {
  id: string;
  title: string;
  body?: string;
  status: string;
  category: string;
  patientUserId: string;
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
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    const [dash, q, d, s, dr, pr] = await Promise.all([
      apiRequest<AdminDashboard>('/admin/dashboard', {}, token),
      apiRequest<AdminQuestion[]>('/admin/questions?limit=100', {}, token),
      apiRequest<Doctor[]>('/admin/doctors', {}, token),
      apiRequest<SeoPage | null>('/admin/seo/pages/home', {}, token),
      apiRequest<DoctorAnalytics[]>('/admin/reports/doctors', {}, token),
      apiRequest<PatientAnalytics[]>('/admin/reports/patients', {}, token),
    ]);
    setDashboard(dash);
    setQuestions(q);
    setDoctors(d);
    setDoctorReports(dr);
    setPatientReports(pr);
    setSeoHome(s);
    setSeoTitle(s?.title ?? 'Home');
    setSeoDescription(s?.metaDescription ?? '');
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadAll().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load admin data.'));
  }, [token, loadAll]);

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
    if (!token || (user?.role !== 'superadmin' && user?.role !== 'admin')) return;
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

  async function saveSeo() {
    if (!token) return;
    await apiRequest('/admin/seo/pages/home', {
      method: 'PUT',
      body: JSON.stringify({ pageType: 'home', title: seoTitle, metaDescription: seoDescription, robots: 'index,follow' }),
    }, token);
    await loadAll();
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
        <Seo title="Admin console" description="Platform admin sign-in for Q&A and SEO tools." canonicalPath="/admin/panel" />
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
        <Seo title="Admin console" description="Platform admin access." canonicalPath="/admin/panel" />
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

  const patientReportRows = patientReports.map((patient) => ({
    patientName: patient.patientName,
    email: patient.email ?? '',
    phone: patient.phone ?? '',
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
    { key: 'patientName', label: 'Patient' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'totalQuestions', label: 'Total Questions' },
    { key: 'questionsLast30Days', label: 'Questions Last 30 Days' },
    { key: 'answeredQuestions', label: 'Answered Questions' },
    { key: 'followups', label: 'Follow-ups' },
    { key: 'topCategories', label: 'Top Categories' },
    { key: 'lastQuestionAt', label: 'Last Question' },
  ];

  return (
    <main className={`admin-console${sidebarOpen ? ' admin-console--sidebar-open' : ''}`}>
      <Seo title="Admin console" description="Platform dashboard, Q&A, and SEO." canonicalPath="/admin/panel" />
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
            <span className="admin-role-chip">{user?.role === 'superadmin' ? 'Superadmin' : 'Admin'}</span>
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
                      </tr>
                    </thead>
                    <tbody>
                      {doctorReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="admin-table-empty">
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
                            </td>
                            <td>{doctor.totalAnswers}</td>
                            <td>{doctor.answersLast30Days}</td>
                            <td>{doctor.assignedQuestions}</td>
                            <td className="admin-td-muted">{topCategoriesText(doctor.categoriesAnswered)}</td>
                            <td className="admin-td-muted">{formatCompactDate(doctor.lastAnswerAt)}</td>
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
                        <th>Total questions</th>
                        <th>Last 30 days</th>
                        <th>Answered</th>
                        <th>Follow-ups</th>
                        <th>Top categories</th>
                        <th>Last question</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientReports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="admin-table-empty">
                            No patient analytics found.
                          </td>
                        </tr>
                      ) : (
                        patientReports.map((patient) => (
                          <tr key={patient.patientUserId}>
                            <td>
                              <div className="admin-td-strong">{patient.patientName}</div>
                              <div className="admin-td-muted">{patient.email ?? patient.phone ?? '—'}</div>
                            </td>
                            <td>{patient.totalQuestions}</td>
                            <td>{patient.questionsLast30Days}</td>
                            <td>{patient.answeredQuestions}</td>
                            <td>{patient.followups}</td>
                            <td className="admin-td-muted">{topCategoriesText(patient.categoriesAsked)}</td>
                            <td className="admin-td-muted">{formatCompactDate(patient.lastQuestionAt)}</td>
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
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--qa">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Assign</th>
                      {user?.role === 'superadmin' || user?.role === 'admin' ? <th>Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id}>
                        <td className="admin-td-strong admin-td-question">{q.body ?? q.title}</td>
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
                        {user?.role === 'superadmin' || user?.role === 'admin' ? (
                          <td>
                            <button
                              type="button"
                              className="admin-btn-danger"
                              onClick={() => deleteQuestion(q).catch(() => undefined)}
                            >
                              Delete
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeView === 'seo' && (
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
          )}
        </div>
      </div>
    </main>
  );
}
