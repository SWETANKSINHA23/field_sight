import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Response.css';
import { parseMarkdown } from '../utils/parseMarkdown';

function InfoBlock({ label, value }) {
  return (
    <div className="info-block">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  );
}

function TextBox({ label, content, icon }) {
  if (!content) return null;
  return (
    <div className="text-box">
      <div className="text-box-header">
        <span>{icon}</span>
        <h3 className="text-box-title">{label}</h3>
      </div>
      <p className="text-box-body">{content}</p>
    </div>
  );
}

function MarkdownBox({ label, content, icon }) {
  if (!content) return null;
  return (
    <div className="text-box">
      <div className="text-box-header">
        <span>{icon}</span>
        <h3 className="text-box-title">{label}</h3>
      </div>
      <div
        className="text-box-body markdown-body"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    </div>
  );
}

function TagList({ items, color = 'blue' }) {
  if (!items || items.length === 0) return <span className="empty-tag">None reported</span>;
  return (
    <div className="tag-list">
      {items.map((item, i) => (
        <span key={i} className={`badge badge-${color}`}>{item}</span>
      ))}
    </div>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <p className="empty-tag">None reported</p>;
  return (
    <ul className="bullet-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const SENTIMENT_COLOR = { positive: 'green', neutral: 'blue', negative: 'red' };
const PRIORITY_COLOR  = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' };

export default function Response() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.result) {
    navigate('/submit');
    return null;
  }

  const { result, form } = state;
  const { analytics }    = result;

  return (
    <div className="response-page">
      <main className="response-main">
        <div className="success-banner fade-in">
          <span className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28.8" height="28.8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </span>
          <div>
            <h1 className="success-title">Report Submitted Successfully</h1>
            <p className="success-sub">
              Finding ID: <code className="finding-id">{result.finding_id}</code>
            </p>
          </div>
        </div>

        {result.service_errors && Object.keys(result.service_errors).length > 0 && (
          <div className="card response-card slide-up" style={{
            border: '0.9px solid #f59e0b',
            background: 'rgba(245,158,11,0.08)',
          }}>
            <div className="section-header">
              <span className="section-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="10.8" y1="8.1" x2="10.8" y2="11.7"></line><line x1="10.8" y1="15.3" x2="10.8" y2="15.3"></line></svg>
              </span>
              <h2 className="section-title" style={{ color: '#f9ab00' }}>Partial Processing — Some AI Services Failed</h2>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '10.8px', fontSize: '0.787rem' }}>
              The report was saved with whatever data was collected. The services below encountered errors and their output is missing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7.2px' }}>
              {Object.entries(result.service_errors).map(([service, errMsg]) => (
                <div key={service} style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '0.9px solid rgba(245,158,11,0.3)',
                  borderRadius: '7.2px',
                  padding: '9px 12.6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7.2px', marginBottom: '3.6px' }}>
                    <span style={{
                      background: '#f59e0b',
                      color: '#000',
                      borderRadius: '3.6px',
                      padding: '0.9px 7.2px',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.045em',
                    }}>
                      {{
                        ocr: '📝 OCR (EasyOCR)',
                        audio: '🎤 Audio (Whisper)',
                        gemini_vision: '🏗️ Gemini Vision',
                        gemini_analytics: '🤖 Gemini Analytics',
                      }[service] || service}
                    </span>
                    <span style={{ color: '#fbbf24', fontSize: '0.675rem', fontWeight: 600 }}>FAILED</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: 0, wordBreak: 'break-word' }}>{errMsg}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card response-card slide-up">
          <div className="section-header">
            <span className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="14.4" y1="11.7" x2="7.2" y2="11.7"></line><line x1="14.4" y1="15.3" x2="7.2" y2="15.3"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </span>
            <h2 className="section-title">Visit Summary</h2>
          </div>
          <div className="info-grid">
            <InfoBlock label="Location"    value={form?.location} />
            <InfoBlock label="Date"        value={form?.date} />
            <InfoBlock label="Program Area" value={form?.program_area} />
            <InfoBlock label="Stakeholders" value={form?.stakeholders_met} />
          </div>
        </div>

        {analytics && (
          <>
            <div className="card response-card slide-up analytics-overview">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.7" y="9.9" width="16.2" height="9" rx="1.8"></rect><circle cx="10.8" cy="4.5" r="1.8"></circle><path d="M12 7v4"></path><line x1="7.2" y1="14.4" x2="7.2" y2="14.4"></line><line x1="14.4" y1="14.4" x2="14.4" y2="14.4"></line></svg>
                </span>
                <h2 className="section-title">AI Analytics</h2>
                <span className="section-badge">Gemini Generated</span>
              </div>
              <div className="overview-chips">
                <div className="chip-item">
                  <span className="chip-label">Sentiment</span>
                  <span className={`badge badge-${SENTIMENT_COLOR[analytics.sentiment] || 'blue'}`}>
                    {analytics.sentiment}
                  </span>
                </div>
                <div className="chip-item">
                  <span className="chip-label">Follow-up Priority</span>
                  <span className={`badge badge-${PRIORITY_COLOR[analytics.follow_up_priority] || 'blue'}`}>
                    {analytics.follow_up_priority}
                  </span>
                </div>
                <div className="chip-item">
                  <span className="chip-label">Issue Types</span>
                  <TagList items={analytics.issue_type} color="purple" />
                </div>
              </div>
            </div>

            <div className="card response-card slide-up">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="14.4" y1="11.7" x2="7.2" y2="11.7"></line><line x1="14.4" y1="15.3" x2="7.2" y2="15.3"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </span>
                <h2 className="section-title">Executive Summary</h2>
              </div>
              <p className="summary-text">{analytics.summary}</p>
            </div>

            <div className="two-col slide-up">
              <div className="card response-card">
                <div className="section-header">
                  <span className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9.9" cy="9.9" r="7.2"></circle><line x1="18.9" y1="18.9" x2="15" y2="15"></line></svg>
                  </span>
                  <h2 className="section-title">Key Findings</h2>
                </div>
                <BulletList items={analytics.key_findings} />
              </div>
              <div className="card response-card">
                <div className="section-header">
                  <span className="section-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="10.8" y1="8.1" x2="10.8" y2="11.7"></line><line x1="10.8" y1="15.3" x2="10.8" y2="15.3"></line></svg>
                  </span>
                  <h2 className="section-title">Blockers</h2>
                </div>
                <BulletList items={analytics.blockers} />
              </div>
            </div>

            <div className="card response-card slide-up">
              <div className="section-header">
                <span className="section-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="10.8" cy="9" r="2.7"></circle></svg>
                </span>
                <h2 className="section-title">Recommended Follow-up</h2>
              </div>
              <p className="summary-text">{analytics.follow_up}</p>
            </div>
          </>
        )}

        <div className="card response-card slide-up">
          <div className="section-header">
            <span className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="2.7"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </span>
            <h2 className="section-title">AI Processing Results</h2>
          </div>
          <div className="text-boxes">
            <TextBox
              label="OCR — Extracted Notes Text"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="9.9" cy="9.9" r="1.8"></circle></svg>}
              content={result.ocr_text}
            />
            <TextBox
              label="Whisper — Audio Transcript"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="10.8" y1="17.1" x2="10.8" y2="20.7"></line><line x1="7.2" y1="20.7" x2="14.4" y2="20.7"></line></svg>}
              content={result.audio_transcript}
            />
            <MarkdownBox
              label="Gemini Vision — Site Analysis"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.7" y="2.7" width="16.2" height="16.2" rx="1.8" ry="1.8"></rect><circle cx="7.7" cy="7.7" r="1.4"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>}
              content={result.site_image_analysis}
            />
          </div>
        </div>

        <div className="response-cta slide-up">
          <button className="btn btn-primary cta-btn" onClick={() => navigate('/submit')}>
            Submit Another Finding
          </button>
          <button className="btn btn-secondary cta-btn" onClick={() => {
            localStorage.clear(); navigate('/login');
          }}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
