import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_ORDER = ['open', 'assigned', 'answered', 'closed'] as const;

const STATUS_COLORS: Record<string, string> = {
  open: '#016589',
  assigned: '#991731',
  answered: '#0f766e',
  closed: '#64748b',
};

const PIE_COLORS = ['#016589', '#991731', '#0f766e', '#cbd5e1'];

export type TrendPoint = {
  date: string;
  signIns: number;
  activeUsers: number;
  newQuestions: number;
};

type Props = {
  questionCounts: Record<string, number>;
  totalQuestions: number;
  categoryCounts: Record<string, number>;
  trends: TrendPoint[];
};

function formatDayTick(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function AdminDashboardCharts({ questionCounts, totalQuestions, categoryCounts, trends }: Props) {
  const statusData = STATUS_ORDER.map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    value: questionCounts[key] ?? 0,
  }));

  const openP = questionCounts.open ?? 0;
  const asg = questionCounts.assigned ?? 0;
  const ans = questionCounts.answered ?? 0;
  const rest = Math.max(totalQuestions - openP - asg - ans, 0);
  const pieData = [
    { name: 'Open', value: openP },
    { name: 'Assigned', value: asg },
    { name: 'Answered', value: ans },
    { name: 'Other', value: rest },
  ].filter((d) => d.value > 0);

  const catData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <div className="admin-panels-row admin-panels-row--charts">
        <section className="admin-panel admin-panel--rechart">
          <h2 className="admin-panel-title">Questions by status</h2>
          <p className="admin-panel-lead">Volume at each stage of the lifecycle</p>
          <div className="admin-rechart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} width={40} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [String(value ?? 0), 'Questions']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-panel admin-panel--rechart">
          <h2 className="admin-panel-title">Pipeline mix</h2>
          <p className="admin-panel-lead">Share of total questions by bucket</p>
          <div className="admin-rechart-box admin-rechart-box--pie">
            {pieData.length === 0 ? (
              <p className="admin-chart-empty">No questions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                    formatter={(value) => [String(value ?? 0), 'Questions']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="admin-panel admin-panel--rechart admin-panel--wide">
        <h2 className="admin-panel-title">Activity &amp; sign-ins (14 days)</h2>
        <p className="admin-panel-lead">
          <strong>Sign-ins</strong> count each successful login (recorded from this release onward).{' '}
          <strong>Active users</strong> is distinct people with any audited action that day.{' '}
          <strong>New questions</strong> are threads created per day (UTC).
        </p>
        <div className="admin-rechart-box">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayTick}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(label) => formatDayTick(String(label))}
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="newQuestions"
                name="New questions"
                fill="#0f766e"
                fillOpacity={0.12}
                stroke="#0f766e"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="signIns"
                name="Sign-ins"
                stroke="#016589"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active users (distinct)"
                stroke="#991731"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {catData.length > 0 ? (
        <section className="admin-panel admin-panel--rechart admin-panel--wide">
          <h2 className="admin-panel-title">Questions by category</h2>
          <p className="admin-panel-lead">Where patient demand clusters</p>
          <div className="admin-rechart-box">
            <ResponsiveContainer width="100%" height={Math.min(420, 48 + catData.length * 36)}>
              <BarChart
                data={catData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [String(value ?? 0), 'Questions']}
                />
                <Bar dataKey="value" fill="#016589" radius={[0, 6, 6, 0]} name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </>
  );
}
