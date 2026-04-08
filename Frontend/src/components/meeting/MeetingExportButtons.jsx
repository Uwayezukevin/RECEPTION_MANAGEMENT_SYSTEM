import React from 'react';
import API from '../../service/api';

const MeetingExportButtons = ({ meetingId, meetingTitle }) => {
  const exportTo = async (format) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`${API.api.defaults.baseURL}/meetings/${meetingId}/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let extension = format;
      if (format === 'excel') extension = 'xlsx';
      a.download = `${meetingTitle.replace(/\s/g, '_')}_${format}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export file');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => exportTo('pdf')}
        style={styles.exportBtn}
        title="Export as PDF with signatures"
      >
        📄 PDF
      </button>
      <button
        onClick={() => exportTo('excel')}
        style={styles.exportBtn}
        title="Export as Excel with signatures"
      >
        📊 Excel
      </button>
      <button
        onClick={() => exportTo('html')}
        style={styles.exportBtn}
        title="Export as HTML with signatures"
      >
        🌐 HTML
      </button>
    </div>
  );
};

const styles = {
  exportBtn: {
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default MeetingExportButtons;