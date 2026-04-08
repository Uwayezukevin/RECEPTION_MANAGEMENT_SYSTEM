import React, { useState, useEffect } from 'react';
import API from '../../service/api';
import MeetingSignIn from '../../components/meeting/MeetingSignIn';
import MeetingExportButtons from '../../components/meeting/MeetingExportButtons';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showParticipants, setShowParticipants] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', type: 'all' });

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/meetings', {
        params: { status: filter.status, meetingType: filter.type }
      });
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (meetingId) => {
    try {
      const response = await API.get(`/meetings/${meetingId}/participants`);
      setShowParticipants(response.data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await API.put(`/meetings/${meetingId}/status`, { status });
      fetchMeetings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { color: '#3b82f6', text: 'Scheduled' },
      ongoing: { color: '#eab308', text: 'Ongoing' },
      completed: { color: '#22c55e', text: 'Completed' },
      cancelled: { color: '#ef4444', text: 'Cancelled' }
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span style={{
        background: badge.color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Loading meetings...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Meeting Management</h1>
          <p style={styles.subtitle}>Manage weekly meetings and track attendance</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/meetings/create'}
          style={styles.createBtn}
        >
          + Create New Meeting
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="special">Special</option>
        </select>
      </div>

      {/* Meetings List */}
      <div style={styles.meetingsGrid}>
        {meetings.map((meeting) => (
          <div key={meeting._id} style={styles.meetingCard}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.meetingTitle}>{meeting.title}</h3>
                <p style={styles.meetingDate}>
                  {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {getStatusBadge(meeting.status)}
            </div>
            
            <div style={styles.meetingDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Time:</span>
                <span>{meeting.startTime} - {meeting.endTime}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Location:</span>
                <span>{meeting.location}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Leader:</span>
                <span>{meeting.meetingLeader.name} ({meeting.meetingLeader.position})</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Participants:</span>
                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {meeting.participantCount || 0}
                </span>
              </div>
            </div>
            
            <div style={styles.cardActions}>
              <button
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setShowSignIn(true);
                }}
                style={styles.signInBtn}
                disabled={meeting.status === 'completed' || meeting.status === 'cancelled'}
              >
                ✍️ Sign In
              </button>
              
              <button
                onClick={() => fetchParticipants(meeting._id)}
                style={styles.viewBtn}
              >
                👥 View Participants
              </button>
              
              <MeetingExportButtons meetingId={meeting._id} meetingTitle={meeting.title} />
              
              <select
                onChange={(e) => updateMeetingStatus(meeting._id, e.target.value)}
                value={meeting.status}
                style={styles.statusSelect}
              >
                <option value="scheduled">Set Scheduled</option>
                <option value="ongoing">Set Ongoing</option>
                <option value="completed">Set Completed</option>
                <option value="cancelled">Set Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Sign In Modal */}
      {showSignIn && selectedMeeting && (
        <MeetingSignIn
          meetingId={selectedMeeting._id}
          meetingTitle={selectedMeeting.title}
          onSuccess={() => {
            setShowSignIn(false);
            fetchMeetings();
            alert('Successfully signed in!');
          }}
          onClose={() => setShowSignIn(false)}
        />
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <div style={styles.overlay} onClick={() => setShowParticipants(null)}>
          <div style={styles.participantsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{showParticipants.meeting?.title} - Participants</h2>
              <button onClick={() => setShowParticipants(null)} style={styles.closeModalBtn}>×</button>
            </div>
            <div style={styles.participantsList}>
              {showParticipants.participants?.map((p, idx) => (
                <div key={idx} style={styles.participantItem}>
                  <div style={styles.participantInfo}>
                    <strong>{idx + 1}. {p.fullName}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {p.institution} - {p.position}
                    </div>
                    {p.email && <div style={{ fontSize: '11px', color: '#999' }}>{p.email}</div>}
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                      Signed: {new Date(p.signedAt).toLocaleString()}
                    </div>
                  </div>
                  {p.signature && (
                    <div style={styles.signaturePreview}>
                      <img src={p.signature} alt="Signature" style={styles.signatureImg} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    color: '#1e293b',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '8px'
  },
  createBtn: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px'
  },
  meetingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px'
  },
  meetingCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  meetingTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  meetingDate: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  meetingDetails: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px'
  },
  detailRow: {
    fontSize: '13px',
    marginBottom: '6px',
    display: 'flex',
    gap: '8px'
  },
  detailLabel: {
    fontWeight: '500',
    color: '#475569',
    minWidth: '70px'
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  signInBtn: {
    background: '#22c55e',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  viewBtn: {
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  statusSelect: {
    padding: '6px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '12px'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  participantsModal: {
    background: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0'
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer'
  },
  participantsList: {
    padding: '16px'
  },
  participantItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0'
  },
  participantInfo: {
    flex: 1
  },
  signaturePreview: {
    marginLeft: '12px'
  },
  signatureImg: {
    maxWidth: '100px',
    maxHeight: '40px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#64748b'
  }
};

export default Meetings;