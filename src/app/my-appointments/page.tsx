'use client';

import { useState } from 'react';

type Appointment = {
  id: string;
  referenceId: string;
  status: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  user: {
    name: string;
    email: string;
  };
};

export default function MyAppointments() {
  const [email, setEmail] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({ email });
      if (referenceId) params.append('referenceId', referenceId.toUpperCase());
      
      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch appointments');
      
      setAppointments(data);
      if (data.length === 0) {
        setError('No appointments found for this email/reference.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      
      showToast('Appointment cancelled successfully.', 'success');
      
      // Update local state
      setAppointments(prev => prev ? prev.map(app => app.id === id ? { ...app, status: 'CANCELLED' } : app) : null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Your Schedule.</h1>
        <p style={{ color: '#4a5568', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Enter your email to view or manage your upcoming appointments.
        </p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label className="form-label">Booking Reference (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder="e.g. A3F89B"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '46px', padding: '0 2.5rem' }} disabled={loading}>
            {loading ? 'Searching...' : 'Find'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '1.25rem', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '0.75rem', color: '#c53030', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠</span> {error}
        </div>
      )}

      {appointments && appointments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {appointments.map(app => {
            const isCancelled = app.status === 'CANCELLED';
            const startTime = new Date(app.slot.startTime);
            const isPast = startTime < new Date() && !isCancelled;
            
            return (
              <div key={app.id} className="glass-panel" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                opacity: isCancelled ? 0.6 : 1,
                padding: '1.5rem 2rem',
                borderLeft: isCancelled ? '4px solid #cbd5e0' : (isPast ? '4px solid #a0aec0' : '4px solid var(--primary)')
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>
                      {startTime.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                    </h3>
                    {isCancelled && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#edf2f7', color: '#718096', borderRadius: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancelled</span>}
                    {isPast && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#edf2f7', color: '#718096', borderRadius: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Past</span>}
                  </div>
                  <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                    Reference: <strong style={{ color: '#2d3748' }}>{app.referenceId}</strong> &nbsp;•&nbsp; Booked by {app.user.name}
                  </p>
                </div>
                {!isCancelled && !isPast && (
                  <button className="btn btn-danger" onClick={() => handleCancel(app.id)}>
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
