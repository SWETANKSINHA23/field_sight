import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Submit.css';

function FileUpload({ id, label, accept, icon, onChange, file }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className={`file-upload-zone ${file ? 'has-file' : ''}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files[0] || null)}
        />
        <div className="file-upload-content">
          <span className="file-upload-icon">{icon}</span>
          {file ? (
            <div className="file-upload-name">
              <span className="file-check">✓</span> {file.name}
            </div>
          ) : (
            <div className="file-upload-hint">
              <span className="file-upload-cta">Click to upload</span>
              <span className="file-upload-sub">{accept}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Submit() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    location: '',
    date: '',
    program_area: '',
    stakeholders_met: '',
  });

  const [files, setFiles] = useState({
    notes_image: null,
    site_image: null,
    audio_file: null,
  });

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState('');

  const STEPS = [
    'Saving files…',
    'Running OCR on notes…',
    'Transcribing audio…',
    'Analysing site image…',
    'Generating analytics…',
    'Storing report…',
  ];

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFile = (key) => (file) =>
    setFiles((prev) => ({ ...prev, [key]: file }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let stepIdx = 0;
    setStep(STEPS[0]);
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % STEPS.length;
      setStep(STEPS[stepIdx]);
    }, 4000);

    try {
      const fd = new FormData();
      fd.append('location',         form.location);
      fd.append('date',             form.date);
      fd.append('program_area',     form.program_area);
      fd.append('stakeholders_met', form.stakeholders_met);
      if (files.notes_image) fd.append('notes_image', files.notes_image);
      if (files.site_image)  fd.append('site_image',  files.site_image);
      if (files.audio_file)  fd.append('audio_file',  files.audio_file);

      const { data } = await API.post('/api/post_findings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/response', { state: { result: data, form } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div className="submit-page">
      <main className="submit-main">
        <div className="submit-header fade-in">
          <h1 className="submit-title">Submit Field Finding</h1>
          <p className="submit-subtitle">
            Fill in your observations. AI will process your files and generate a full analytics report.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="submit-form slide-up">
          {error && <div className="error-msg">{error}</div>}

          <div className="card form-section">
            <div className="section-header">
              <span className="section-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="14.4" y1="11.7" x2="7.2" y2="11.7"></line><line x1="14.4" y1="15.3" x2="7.2" y2="15.3"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </span>
              <h2 className="section-title">Visit Details</h2>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="location">Location *</label>
                <input
                  id="location" name="location" type="text" required
                  className="form-input" placeholder="e.g. Rajpur Village, Bihar"
                  value={form.location} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="date">Visit Date *</label>
                <input
                  id="date" name="date" type="date" required
                  className="form-input"
                  value={form.date} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="program_area">Program Area *</label>
                <input
                  id="program_area" name="program_area" type="text" required
                  className="form-input" placeholder="e.g. Education, Healthcare"
                  value={form.program_area} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="stakeholders_met">Stakeholders Met *</label>
                <input
                  id="stakeholders_met" name="stakeholders_met" type="text" required
                  className="form-input" placeholder="Principal, District Officer (comma-separated)"
                  value={form.stakeholders_met} onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="card form-section">
            <div className="section-header">
              <span className="section-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
              </span>
              <h2 className="section-title">Media Uploads</h2>
              <span className="section-badge">AI-Processed</span>
            </div>
            <div className="form-grid-3">
              <FileUpload
                id="notes_image"
                label="Notes Image (OCR)"
                accept="image/*"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="9.9" cy="9.9" r="1.8"></circle></svg>}
                file={files.notes_image}
                onChange={handleFile('notes_image')}
              />
              <FileUpload
                id="site_image"
                label="Site Image (Gemini Vision)"
                accept="image/*"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.7" y="2.7" width="16.2" height="16.2" rx="1.8" ry="1.8"></rect><circle cx="7.7" cy="7.7" r="1.4"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>}
                file={files.site_image}
                onChange={handleFile('site_image')}
              />
              <FileUpload
                id="audio_file"
                label="Audio Recording (Whisper)"
                accept="audio/*"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="10.8" y1="17.1" x2="10.8" y2="20.7"></line><line x1="7.2" y1="20.7" x2="14.4" y2="20.7"></line></svg>}
                file={files.audio_file}
                onChange={handleFile('audio_file')}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
            {loading ? (
              <div className="loading-state">
                <span className="spinner" />
                <span className="step-label">{step}</span>
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19.8" y1="1.8" x2="9.9" y2="11.7"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> 
                Generate AI Report
              </>
            )}
          </button>

          {loading && (
            <div className="processing-note">
              ⏳ Processing can take 30–90 seconds — OCR, Whisper transcription, and Gemini analysis are running…
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
