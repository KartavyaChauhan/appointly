'use client';

import { useState, useEffect } from 'react';

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [successData, setSuccessData] = useState<{ referenceId: string; time: string } | null>(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/slots');
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      showToast('Failed to load available slots.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, slotId: selectedSlot.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book slot');
      }

      setSuccessData({
        referenceId: data.appointment.referenceId,
        time: new Date(selectedSlot.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      });
      setSelectedSlot(null);
      setName('');
      setEmail('');
      
      // Refresh slots
      fetchSlots();
    } catch (error: any) {
      showToast(error.message, 'error');
      if (error.message.includes('taken')) {
        // Refresh if someone took it
        fetchSlots();
        setSelectedSlot(null);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Group slots by Date
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ marginBottom: '1rem', color: '#1a202c' }}>Find your perfect time.</h1>
        <p style={{ color: '#4a5568', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Take a moment to schedule your visit. Select an available time below that fits your day naturally.
        </p>
      </div>

      {successData ? (
        <div className="glass-panel text-center fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Booking Confirmed</h2>
          <p style={{ marginBottom: '0.5rem', color: '#4a5568', fontSize: '1.1rem' }}>You are booked for <strong style={{ color: '#2d3748' }}>{successData.time}</strong></p>
          <div style={{ margin: '2.5rem 0', padding: '1.5rem', background: 'rgba(74, 124, 89, 0.05)', borderRadius: '1rem', border: '1px dashed rgba(74, 124, 89, 0.3)' }}>
            <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Booking Reference</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '4px', color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>{successData.referenceId}</p>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '2.5rem', lineHeight: 1.5 }}>
            Please save this reference. You will need it along with your email to view or cancel this appointment later.
          </p>
          <button className="btn btn-primary" onClick={() => setSuccessData(null)}>Book Another</button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '5rem 0' }}>
          <div className="spinner"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="glass-panel text-center" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>No slots available</h3>
          <p style={{ color: '#718096' }}>Our schedule is currently full. Please check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {Object.entries(groupedSlots).map(([date, daySlots]) => (
            <div key={date} className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', fontSize: '1.25rem', color: '#2d3748' }}>
                {date}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {daySlots.map(slot => (
                  <button
                    key={slot.id}
                    disabled={slot.isBooked}
                    className="btn"
                    style={{
                      background: slot.isBooked ? 'rgba(0,0,0,0.02)' : '#fff',
                      border: `1px solid ${slot.isBooked ? 'var(--card-border)' : 'rgba(74, 124, 89, 0.2)'}`,
                      color: slot.isBooked ? '#a0aec0' : 'var(--primary)',
                      textDecoration: slot.isBooked ? 'line-through' : 'none',
                      cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                      boxShadow: slot.isBooked ? 'none' : '0 2px 4px rgba(74, 124, 89, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if(!slot.isBooked) {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if(!slot.isBooked) {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = 'var(--primary)';
                      }
                    }}
                    onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                  >
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(253, 252, 248, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '450px', margin: '1rem', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#1a202c' }}>Reserve this time</h3>
            <p style={{ color: 'var(--primary)', marginBottom: '2rem', fontSize: '1rem', fontWeight: 500 }}>
              {new Date(selectedSlot.startTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            
            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedSlot(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bookingLoading}>
                  {bookingLoading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
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
