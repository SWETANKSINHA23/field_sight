import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import './ReportDetail.css';
import { parseMarkdown } from '../utils/parseMarkdown';

const SENTIMENT_ICONS = { 
  positive: <svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="9"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="8.1" y1="8.1" x2="8.1" y2="8.1"></line><line x1="13.5" y1="8.1" x2="13.5" y2="8.1"></line></svg>, 
  neutral: <svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="9"></circle><line x1="7.2" y1="13.5" x2="14.4" y2="13.5"></line><line x1="8.1" y1="8.1" x2="8.1" y2="8.1"></line><line x1="13.5" y1="8.1" x2="13.5" y2="8.1"></line></svg>, 
  negative: <svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="9"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="8.1" y1="8.1" x2="8.1" y2="8.1"></line><line x1="13.5" y1="8.1" x2="13.5" y2="8.1"></line></svg> 
};
const PRIORITY_COLOR  = { critical:'#d93025', high:'#f9ab00', medium:'#1a73e8', low:'#1e8e3e' };

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.get(`/api/admin/reports/${id}`)
      .then(r => setReport(r.data))
      .catch(() => setError('Report not found or you lack permission.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-full detail-page">
      <div className="detail-loading"><span className="spinner" style={{width:32,height:32,borderWidth:3}} /> Loading report…</div>
    </div>
  );

  if (error || !report) return (
    <div className="page-full detail-page">
      <div className="detail-error">⚠️ {error || 'Report unavailable.'}</div>
    </div>
  );

  const sentimentColor = report.sentiment === 'positive' ? '#10b981' : report.sentiment === 'negative' ? '#ef4444' : '#f59e0b';

  return (
    <div className="detail-page">
      <main className="detail-main">

        <div className="detail-header card fade-in">
          <div className="detail-meta">
            <h1 className="detail-title">Field Visit Report</h1>
            <div className="detail-tags">
              <span className="d-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="12.6" height="12.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="10.8" cy="9" r="2.7"></circle></svg> 
                {report.location || '—'}
              </span>
              <span className="d-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="12.6" height="12.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.7" y="3.6" width="16.2" height="16.2" rx="1.8" ry="1.8"></rect><line x1="14.4" y1="1.8" x2="14.4" y2="5.4"></line><line x1="7.2" y1="1.8" x2="7.2" y2="5.4"></line><line x1="2.7" y1="9" x2="18.9" y2="9"></line></svg>
                {report.date || '—'}
              </span>
              <span className="d-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="12.6" height="12.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                {report.program_area || '—'}
              </span>
              <span className={`badge ${report.issue_status === 'open' ? 'badge-amber' : 'badge-green'}`}>
                {report.issue_status}
              </span>
            </div>
            {report.sentiment && (
              <div className="sentiment-pill" style={{ background: `${sentimentColor}18`, borderColor: `${sentimentColor}44`, color: sentimentColor }}>
                <span className="sentiment-icon">{SENTIMENT_ICONS[report.sentiment]}</span> 
                {report.sentiment?.charAt(0).toUpperCase() + report.sentiment?.slice(1)} Sentiment
              </div>
            )}
          </div>
          <div className="detail-id">ID: <code>{report.id}</code></div>
        </div>

        <div className="detail-body slide-up">

          <div className="detail-col">

            <div className="card d-section">
              <h2 className="d-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.1" cy="6.3" r="3.6"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Stakeholders Met
              </h2>
              <div className="chip-list">
                {(report.stakeholders_met || []).length === 0
                  ? <span className="no-data">None recorded</span>
                  : (report.stakeholders_met || []).map((s, i) => <span key={i} className="chip">{s}</span>)}
              </div>
            </div>

            <div className="card d-section">
              <h2 className="d-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="6.3" y1="6.3" x2="6.3" y2="6.3"></line></svg>
                Issue Types
              </h2>
              <div className="chip-list">
                {(report.issue_type || []).length === 0
                  ? <span className="no-data">None identified</span>
                  : (report.issue_type || []).map((t, i) => (
                      <span key={i} className="chip chip-blue">{t.replace(/_/g,' ')}</span>
                    ))}
              </div>
            </div>

            {report.follow_up_priority && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="10.8" cy="9" r="2.7"></circle></svg>
                  Follow-up
                </h2>
                <div className="followup-row">
                  <span className="priority-dot" style={{background: PRIORITY_COLOR[report.follow_up_priority]}} />
                  <span className="priority-label" style={{color: PRIORITY_COLOR[report.follow_up_priority]}}>
                    {report.follow_up_priority?.toUpperCase()} Priority
                  </span>
                </div>
                {report.follow_up && <p className="d-text">{report.follow_up}</p>}
              </div>
            )}

            {(report.key_findings || []).length > 0 && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><circle cx="9.9" cy="9.9" r="7.2"></circle><line x1="18.9" y1="18.9" x2="15" y2="15"></line></svg>
                  Key Findings
                </h2>
                <ul className="findings-list">
                  {report.key_findings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {(report.blockers || []).length > 0 && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="10.8" y1="8.1" x2="10.8" y2="11.7"></line><line x1="10.8" y1="15.3" x2="10.8" y2="15.3"></line></svg>
                  Blockers
                </h2>
                <ul className="findings-list blockers-list">
                  {report.blockers.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="detail-col">

            {report.summary && (
              <div className="card d-section ai-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><rect x="2.7" y="9.9" width="16.2" height="9" rx="1.8"></rect><circle cx="10.8" cy="4.5" r="1.8"></circle><path d="M12 7v4"></path><line x1="7.2" y1="14.4" x2="7.2" y2="14.4"></line><line x1="14.4" y1="14.4" x2="14.4" y2="14.4"></line></svg>
                  AI Summary
                </h2>
                <p className="d-text">{report.summary}</p>
              </div>
            )}

            {report.ocr_text && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="14.4" y1="11.7" x2="7.2" y2="11.7"></line><line x1="14.4" y1="15.3" x2="7.2" y2="15.3"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  OCR — Handwritten Notes
                </h2>
                <pre className="code-block">{report.ocr_text}</pre>
              </div>
            )}

            {report.audio_transcript && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="10.8" y1="17.1" x2="10.8" y2="20.7"></line><line x1="7.2" y1="20.7" x2="14.4" y2="20.7"></line></svg>
                  Audio Transcript
                </h2>
                <pre className="code-block">{report.audio_transcript}</pre>
              </div>
            )}

            {report.site_image_analysis && (
              <div className="card d-section">
                <h2 className="d-section-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8, verticalAlign: 'text-bottom'}}><rect x="2.7" y="2.7" width="16.2" height="16.2" rx="1.8" ry="1.8"></rect><circle cx="7.7" cy="7.7" r="1.4"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Site Image Analysis
                </h2>
                <div
                  className="d-text markdown-body"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(report.site_image_analysis) }}
                />
              </div>
            )}

          </div>
        </div>

        <div className="detail-timestamps card fade-in">
          <span>Created: {report.created_at ? new Date(report.created_at).toLocaleString() : '—'}</span>
          <span>Updated: {report.updated_at ? new Date(report.updated_at).toLocaleString() : '—'}</span>
        </div>
      </main>
    </div>
  );
}
