import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts';
import API from '../api';
import './Dashboard.css';

const COLORS = ['#1a73e8','#e52592','#1e8e3e','#f9ab00','#d93025','#12b5cb','#e8710a','#9334e6'];
const SENTIMENT_COLORS = { positive:'#1e8e3e', neutral:'#f9ab00', negative:'#d93025' };
const PRIORITY_COLORS  = { critical:'#d93025', high:'#f9ab00', medium:'#1a73e8', low:'#1e8e3e' };

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ '--kc': color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, badge, children }) {
  return (
    <div className="chart-card card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {badge && <span className="section-badge">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ msg = 'No data for selected filters.' }) {
  return (
    <div className="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', margin: '0 auto 7.2px', color: '#bdc1c6'}}>
        <rect x="2.7" y="2.7" width="16.2" height="16.2" rx="1.8" ry="1.8"></rect>
        <line x1="2.7" y1="8.1" x2="18.9" y2="8.1"></line>
        <line x1="8.1" y1="18.9" x2="8.1" y2="8.1"></line>
      </svg>
      {msg}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [users, setUsers]             = useState([]);
  const [userSearch, setUserSearch]   = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [allLocations, setAllLocations] = useState([]);
  const [selLocations, setSelLocations] = useState([]);
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  const [kpis, setKpis]               = useState(null);
  const [issueTypes, setIssueTypes]   = useState([]);
  const [sentiment, setSentiment]     = useState([]);
  const [trends, setTrends]           = useState([]);
  const [granularity, setGranularity] = useState('daily');
  const [stakeholders, setStakeholders] = useState([]);
  const [followUp, setFollowUp]       = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    API.get('/api/admin/users').then(r => setUsers(r.data)).catch(() => {});
    API.get('/api/admin/analytics/locations').then(r => setAllLocations(r.data)).catch(() => {});
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const params = new URLSearchParams();
    selLocations.forEach(l => params.append('locations', l));
    if (startDate) params.append('start_date', startDate);
    if (endDate)   params.append('end_date', endDate);
    params.append('granularity', granularity);
    const qs = params.toString();

    try {
      const [k, it, s, tr, sh, fp] = await Promise.all([
        API.get(`/api/admin/analytics/kpis?${qs}`),
        API.get(`/api/admin/analytics/issue-types?${qs}`),
        API.get(`/api/admin/analytics/sentiment?${qs}`),
        API.get(`/api/admin/analytics/trends?${qs}`),
        API.get(`/api/admin/analytics/stakeholders?${qs}`),
        API.get(`/api/admin/analytics/follow-up-priority?${qs}`),
      ]);
      setKpis(k.data);
      setIssueTypes(it.data);
      setSentiment(s.data);
      setTrends(tr.data);
      setStakeholders(sh.data);
      setFollowUp(fp.data);
    } catch {}
    setAnalyticsLoading(false);
  }, [selLocations, startDate, endDate, granularity]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const loadUserReports = async (user) => {
    setSelectedUser(user);
    setReportsLoading(true);
    try {
      const { data } = await API.get(`/api/admin/users/${user.id}/reports`);
      setUserReports(data);
    } catch { setUserReports([]); }
    setReportsLoading(false);
  };

  const toggleLocation = (loc) => {
    setSelLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const sentimentData = sentiment.map(s => ({ name: s.sentiment, value: s.count }));
  const stakeholderData = stakeholders.map(s => ({ name: s.stakeholder, value: s.count }));
  const followUpData = followUp.map(f => ({ name: f.priority, value: f.count }));
  const issueBarData = issueTypes.map(i => ({ name: i.issue_type.replace(/_/g,' '), count: i.count }));
  const issuePieData = issueTypes.map(i => ({ name: i.issue_type.replace(/_/g,' '), value: i.count }));

  return (
    <div className="dash-page">
      <main className="dash-main">

        <section className="dash-section fade-in">
          <div className="section-heading">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '7.2px', verticalAlign: 'text-bottom'}}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.1" cy="6.3" r="3.6"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              User Report Explorer
            </h2>
            <p>Select a field user to browse their submitted reports.</p>
          </div>

          <div className="explorer-grid">
            <div className="card explorer-card">
              <div className="explorer-search-wrap">
                <input
                  className="form-input"
                  placeholder="Search users by name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <div className="user-list">
                {filteredUsers.length === 0 && <div className="empty-state">No users found.</div>}
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className={`user-item ${selectedUser?.id === u.id ? 'user-active' : ''}`}
                    onClick={() => loadUserReports(u)}
                  >
                    <div className="user-avatar">{u.username?.[0]?.toUpperCase()}</div>
                    <div className="user-info">
                      <span className="user-name">{u.username}</span>
                      <span className="user-email">{u.email}</span>
                    </div>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card explorer-card">
              {!selectedUser ? (
                <div className="empty-state">← Select a user to see their reports</div>
              ) : reportsLoading ? (
                <div className="empty-state"><span className="spinner" style={{margin:'0 auto'}} /></div>
              ) : userReports.length === 0 ? (
                <div className="empty-state">No reports found for this user.</div>
              ) : (
                <>
                  <div className="reports-header">
                    <span className="chart-title">Reports by {selectedUser.username}</span>
                    <span className="badge badge-blue">{userReports.length} reports</span>
                  </div>
                  <div className="reports-table-wrap">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Location</th>
                          <th>Program Area</th>
                          <th>Status</th>
                          <th>Sentiment</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {userReports.map(r => (
                          <tr key={r.id} onClick={() => navigate(`/dashboard/report/${r.id}`)} className="report-row">
                            <td>{r.date || '—'}</td>
                            <td>{r.location || '—'}</td>
                            <td>{r.program_area || '—'}</td>
                            <td>
                              <span className={`badge ${r.issue_status === 'open' ? 'badge-amber' : 'badge-green'}`}>
                                {r.issue_status}
                              </span>
                            </td>
                            <td>
                              {r.sentiment ? (
                                <span className={`badge ${r.sentiment === 'positive' ? 'badge-green' : r.sentiment === 'negative' ? 'badge-red' : 'badge-blue'}`}>
                                  {r.sentiment}
                                </span>
                              ) : '—'}
                            </td>
                            <td><span className="view-btn">View →</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dash-section slide-up">
          <div className="section-heading">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '7.2px', verticalAlign: 'text-bottom'}}>
                <circle cx="9.9" cy="9.9" r="7.2"></circle>
                <line x1="18.9" y1="18.9" x2="15" y2="15"></line>
              </svg>
              Analytics Filters
            </h2>
            <p>Filter all KPIs and charts below.</p>
            {kpis && <span className="badge badge-blue">{kpis.total_visits} reports analysed</span>}
          </div>

          <div className="card filters-card">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="form-label">Locations</label>
                <div className="location-chips">
                  {allLocations.length === 0 && <span className="empty-tag">No locations yet</span>}
                  {allLocations.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      className={`loc-chip ${selLocations.includes(loc) ? 'loc-chip-active' : ''}`}
                      onClick={() => toggleLocation(loc)}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-date-group">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                {(selLocations.length > 0 || startDate || endDate) && (
                  <button className="btn btn-secondary" style={{alignSelf:'flex-end'}}
                    onClick={() => { setSelLocations([]); setStartDate(''); setEndDate(''); }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {analyticsLoading ? (
          <div className="loading-bar"><span className="spinner" /> Loading analytics…</div>
        ) : kpis && (
          <section className="dash-section slide-up">
            <div className="kpi-grid">
              <KpiCard icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="14.4" y1="11.7" x2="7.2" y2="11.7"></line><line x1="14.4" y1="15.3" x2="7.2" y2="15.3"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              } label="Total Visits"     value={kpis.total_visits}          color="#1a73e8" />
              <KpiCard icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="10.8" cy="9" r="2.7"></circle></svg>
              } label="Active Regions"   value={kpis.active_regions}         color="#9334e6" />
              <KpiCard icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              } label="Open Issues"      value={kpis.open_issues}            color="#f9ab00" />
              <KpiCard icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="10.8" y1="8.1" x2="10.8" y2="11.7"></line><line x1="10.8" y1="15.3" x2="10.8" y2="15.3"></line></svg>
              } label="Critical Issues"  value={kpis.critical_issues}        color="#d93025" />
              <KpiCard icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="9"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="8.1" y1="8.1" x2="8.1" y2="8.1"></line><line x1="13.5" y1="8.1" x2="13.5" y2="8.1"></line></svg>
              } label="Positive Sentiment" value={`${kpis.positive_sentiment_pct}%`} color="#1e8e3e"
                sub={`of ${kpis.total_visits} reports`} />
            </div>
          </section>
        )}

        <section className="dash-section charts-grid slide-up">

          <ChartCard title="Issue Types — Volume" badge="Bar Chart">
            {issueBarData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={issueBarData} margin={{top:8,right:8,left:-16,bottom:40}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="name" tick={{fill:'#5f6368',fontSize:12}} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{fill:'#5f6368',fontSize:12}} allowDecimals={false} />
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {issueBarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Issue Types — Distribution" badge="Pie Chart">
            {issuePieData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={issuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} labelLine={false} label={renderLabel}>
                    {issuePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Legend wrapperStyle={{fontSize:12,color:'#5f6368'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Issue Trend Over Time" badge="Area Chart">
            <div className="granularity-row">
              {['daily','weekly','monthly'].map(g => (
                <button key={g} type="button"
                  className={`gran-btn ${granularity === g ? 'gran-active' : ''}`}
                  onClick={() => setGranularity(g)}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            {trends.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends} margin={{top:8,right:8,left:-16,bottom:0}}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="0.9">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="date" tick={{fill:'#5f6368',fontSize:12}} />
                  <YAxis tick={{fill:'#5f6368',fontSize:12}} allowDecimals={false} />
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Area type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={2} fill="url(#trendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Sentiment Distribution" badge="Pie Chart">
            {sentimentData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} labelLine={false} label={renderLabel}>
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[entry.name] || COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Legend wrapperStyle={{fontSize:12,color:'#5f6368'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Stakeholder Involvement" badge="Pie Chart">
            {stakeholderData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stakeholderData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} labelLine={false} label={renderLabel}>
                    {stakeholderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Legend wrapperStyle={{fontSize:12,color:'#5f6368'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Follow-up Priority" badge="Pie Chart">
            {followUpData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={followUpData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} labelLine={false} label={renderLabel}>
                    {followUpData.map((entry, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[entry.name] || COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:'#ffffff',border:'0.9px solid #dadce0',borderRadius:8,color:'#202124'}} />
                  <Legend wrapperStyle={{fontSize:12,color:'#5f6368'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </section>
      </main>
    </div>
  );
}
