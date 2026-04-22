import { useState, useEffect } from 'react'
import { getStudents } from '../api/supabase-students'
import { supabase } from '../lib/supabase'
import { 
  Shield, AlertTriangle, Plus, X, Search, Calendar, 
  User, FileText, Clock, CheckCircle, XCircle, Edit2, Trash2
} from 'lucide-react'

export default function DisciplinaryManager() {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const [newViolation, setNewViolation] = useState({
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'Minor',
    action_taken: '',
    duration: '',
    status: 'Active'
  })

  const violationTypes = [
    'Late Submission',
    'Dress Code Violation',
    'Classroom Disruption',
    'Absence Without Leave',
    'Academic Dishonesty',
    'Cheating',
    'Plagiarism',
    'Disrespect to Faculty',
    'Fighting',
    'Bullying',
    'Vandalism',
    'Theft',
    'Substance Abuse',
    'Parking Violation',
    'Library Fine',
    'Unauthorized Absence',
    'Other'
  ]

  const severityLevels = ['Minor', 'Moderate', 'Major', 'Severe']
  const statusOptions = ['Active', 'Resolved', 'Under Review', 'Appealed']

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = students.filter(s => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
        const id = (s.student_id || '').toLowerCase()
        return fullName.includes(query) || id.includes(query)
      })
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchQuery, students])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const { data } = await getStudents()
      setStudents(data || [])
      setFilteredStudents(data || [])
    } catch (error) {
      showToast('Failed to load students', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddViolation = async () => {
    if (!selectedStudent || !newViolation.type || !newViolation.description) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      // Get current violations
      const currentViolations = selectedStudent.violations || []
      
      // Create violation record with metadata including duration
      const violationRecord = `[${newViolation.date}] ${newViolation.type} (${newViolation.severity}) - ${newViolation.description}${newViolation.action_taken ? ' | Action: ' + newViolation.action_taken : ''}${newViolation.duration ? ' | Duration: ' + newViolation.duration : ''} | Status: ${newViolation.status}`
      
      // Update student record
      const { error } = await supabase
        .from('students')
        .update({
          violations: [...currentViolations, violationRecord],
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id)

      if (error) throw error

      showToast('Disciplinary record added successfully')
      setShowAddModal(false)
      setNewViolation({
        type: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        severity: 'Minor',
        action_taken: '',
        duration: '',
        status: 'Active'
      })
      loadStudents()
    } catch (error) {
      console.error('Error adding violation:', error)
      showToast('Failed to add disciplinary record', 'error')
    }
  }

  const handleRemoveViolation = async (student, violationIndex) => {
    if (!confirm('Remove this disciplinary record?')) return

    try {
      const updatedViolations = student.violations.filter((_, idx) => idx !== violationIndex)
      
      const { error } = await supabase
        .from('students')
        .update({
          violations: updatedViolations,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id)

      if (error) throw error

      showToast('Disciplinary record removed')
      loadStudents()
    } catch (error) {
      console.error('Error removing violation:', error)
      showToast('Failed to remove record', 'error')
    }
  }

  const handleUpdateStatus = async (student, violationIndex, newStatus) => {
    try {
      const violation = student.violations[violationIndex]
      const parsed = parseViolation(violation)
      
      // Reconstruct the violation string with new status
      const updatedViolation = `[${parsed.date}] ${parsed.type} (${parsed.severity}) - ${parsed.description}${parsed.action !== 'None' ? ' | Action: ' + parsed.action : ''}${parsed.duration !== 'None' ? ' | Duration: ' + parsed.duration : ''} | Status: ${newStatus}`
      
      const updatedViolations = [...student.violations]
      updatedViolations[violationIndex] = updatedViolation
      
      const { error } = await supabase
        .from('students')
        .update({
          violations: updatedViolations,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id)

      if (error) throw error

      showToast(`Status updated to ${newStatus}`)
      loadStudents()
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update status', 'error')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor': return '#10b981'
      case 'Moderate': return '#f59e0b'
      case 'Major': return '#ef4444'
      case 'Severe': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const parseViolation = (violationString) => {
    // Parse format: [date] type (severity) - description | Action: action | Duration: duration | Status: status
    const dateMatch = violationString.match(/\[(.*?)\]/)
    const severityMatch = violationString.match(/\((.*?)\)/)
    const actionMatch = violationString.match(/Action: (.*?)(?:\s*\||$)/)
    const durationMatch = violationString.match(/Duration: (.*?)(?:\s*\||$)/)
    const statusMatch = violationString.match(/Status: (.*)$/)
    
    const parts = violationString.split(' - ')
    const typePart = parts[0]?.split('] ')[1]?.split(' (')[0] || ''
    const descPart = parts[1]?.split(' | ')[0] || violationString

    // Get date or use current date as fallback
    let dateValue = 'Not specified'
    if (dateMatch && dateMatch[1]) {
      dateValue = dateMatch[1]
    }

    return {
      date: dateValue,
      type: typePart || 'Violation',
      severity: severityMatch ? severityMatch[1] : 'Minor',
      description: descPart,
      action: actionMatch ? actionMatch[1].trim() : 'None',
      duration: durationMatch ? durationMatch[1].trim() : 'None',
      status: statusMatch ? statusMatch[1].trim() : 'Active'
    }
  }

  const studentsWithViolations = filteredStudents.filter(s => s.violations && s.violations.length > 0)

  return (
    <div className="disciplinary-page">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="page-header-banner">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: '#fee2e2' }}>
            <Shield size={22} color="#dc2626" />
          </div>
          <div>
            <h1 className="page-header-title">Disciplinary Action Manager</h1>
            <p className="page-header-sub">Track and manage student disciplinary records and violations</p>
          </div>
        </div>
        <div className="si-header-actions">
          <button 
            className="btn-add-student"
            onClick={() => setShowAddModal(true)}
            style={{ background: '#dc2626' }}
          >
            <Plus size={15} strokeWidth={2} /> Add Record
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="disc-stats">
        <div className="disc-stat-card">
          <div className="disc-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="disc-stat-content">
            <div className="disc-stat-value">{studentsWithViolations.length}</div>
            <div className="disc-stat-label">Students with Records</div>
          </div>
        </div>
        <div className="disc-stat-card">
          <div className="disc-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <FileText size={20} />
          </div>
          <div className="disc-stat-content">
            <div className="disc-stat-value">
              {students.reduce((sum, s) => sum + (s.violations?.length || 0), 0)}
            </div>
            <div className="disc-stat-label">Total Violations</div>
          </div>
        </div>
        <div className="disc-stat-card">
          <div className="disc-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <User size={20} />
          </div>
          <div className="disc-stat-content">
            <div className="disc-stat-value">{students.length}</div>
            <div className="disc-stat-label">Total Students</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="disc-search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by student name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Students List */}
      {loading ? (
        <div className="si-loading">
          <span className="spinner" />
          Loading students...
        </div>
      ) : studentsWithViolations.length === 0 ? (
        <div className="si-empty">
          <div className="empty-icon">✓</div>
          <div>No disciplinary records found</div>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            {searchQuery ? 'Try a different search term' : 'All students have clean records'}
          </p>
        </div>
      ) : (
        <div className="disc-list">
          {studentsWithViolations.map(student => (
            <div key={student.id} className="disc-student-card">
              <div className="disc-student-header">
                <div className="disc-student-info">
                  <div className="row-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                  <div>
                    <div className="disc-student-name">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="disc-student-meta">
                      {student.student_id} • {student.course} • Year {student.year_level}
                    </div>
                  </div>
                </div>
                <div className="disc-violation-count">
                  <AlertTriangle size={16} />
                  {student.violations.length} {student.violations.length === 1 ? 'Record' : 'Records'}
                </div>
              </div>

              <div className="disc-violations-list">
                {student.violations.map((violation, idx) => {
                  const parsed = parseViolation(violation)
                  return (
                    <div key={idx} className="disc-violation-item">
                      <div className="disc-violation-header">
                        <div className="disc-violation-type">
                          <span 
                            className="disc-severity-badge"
                            style={{ background: getSeverityColor(parsed.severity) + '20', color: getSeverityColor(parsed.severity) }}
                          >
                            {parsed.severity}
                          </span>
                          <strong>{parsed.type}</strong>
                        </div>
                        <div className="disc-violation-actions">
                          <span className="disc-violation-date">
                            <Calendar size={12} />
                            {parsed.date}
                          </span>
                          <button
                            className="disc-remove-btn"
                            onClick={() => handleRemoveViolation(student, idx)}
                            title="Remove record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="disc-violation-desc">{parsed.description}</div>
                      {parsed.action !== 'None' && (
                        <div className="disc-violation-action">
                          <strong>Action Taken:</strong> {parsed.action}
                        </div>
                      )}
                      {parsed.duration !== 'None' && (
                        <div className="disc-violation-action">
                          <strong>Duration:</strong> {parsed.duration}
                        </div>
                      )}
                      <div className="disc-violation-footer">
                        <div className="disc-violation-status">
                          <span className={`disc-status-badge ${parsed.status.toLowerCase().replace(' ', '-')}`}>
                            {parsed.status === 'Resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {parsed.status}
                          </span>
                        </div>
                        <div className="disc-status-actions">
                          <label style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px', marginBottom: '8px' }}>
                            Update Status:
                          </label>
                          <div className="disc-status-buttons">
                            {statusOptions.map(status => (
                              <button
                                key={status}
                                className={`disc-status-btn ${parsed.status === status ? 'active' : ''}`}
                                onClick={() => handleUpdateStatus(student, idx, status)}
                                title={`Change status to ${status}`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Violation Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Disciplinary Record</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Student Selection */}
              <div className="form-group">
                <label>Select Student *</label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value)
                    setSelectedStudent(student)
                  }}
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.student_id} - {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Violation Type */}
              <div className="form-group">
                <label>Violation Type *</label>
                <select
                  value={newViolation.type}
                  onChange={(e) => setNewViolation({ ...newViolation, type: e.target.value })}
                  required
                >
                  <option value="">Select type...</option>
                  {violationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Date and Severity */}
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newViolation.date}
                    onChange={(e) => setNewViolation({ ...newViolation, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Severity *</label>
                  <select
                    value={newViolation.severity}
                    onChange={(e) => setNewViolation({ ...newViolation, severity: e.target.value })}
                  >
                    {severityLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newViolation.description}
                  onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                  placeholder="Describe the violation..."
                  rows={3}
                  required
                />
              </div>

              {/* Action Taken */}
              <div className="form-group">
                <label>Action Taken</label>
                <textarea
                  value={newViolation.action_taken}
                  onChange={(e) => setNewViolation({ ...newViolation, action_taken: e.target.value })}
                  placeholder="Describe the disciplinary action taken..."
                  rows={2}
                />
              </div>

              {/* Duration */}
              <div className="form-group">
                <label>Duration / Period</label>
                <input
                  type="text"
                  value={newViolation.duration}
                  onChange={(e) => setNewViolation({ ...newViolation, duration: e.target.value })}
                  placeholder="e.g., 3 days suspension, 1 week, Until resolved..."
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={newViolation.status}
                  onChange={(e) => setNewViolation({ ...newViolation, status: e.target.value })}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-submit" 
                onClick={handleAddViolation}
                style={{ background: '#dc2626' }}
              >
                <Plus size={16} />
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .disciplinary-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .disc-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .disc-stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .disc-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .disc-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }

        .disc-stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        .disc-search-bar {
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .disc-search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
        }

        .clear-search {
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .disc-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .disc-student-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .disc-student-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .disc-student-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .disc-student-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .disc-student-meta {
          font-size: 13px;
          color: #6b7280;
        }

        .disc-violation-count {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fee2e2;
          color: #dc2626;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .disc-violations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disc-violation-item {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #dc2626;
        }

        .disc-violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .disc-violation-type {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }

        .disc-severity-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .disc-violation-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .disc-violation-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #6b7280;
        }

        .disc-remove-btn {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .disc-remove-btn:hover {
          background: #fecaca;
        }

        .disc-violation-desc {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .disc-violation-action {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .disc-violation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          flex-wrap: wrap;
          gap: 12px;
        }

        .disc-violation-status {
          display: flex;
          gap: 8px;
        }

        .disc-status-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 200px;
        }

        .disc-status-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .disc-status-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #374151;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .disc-status-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #3b82f6;
        }

        .disc-status-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .disc-status-select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #374151;
        }

        .disc-status-select:hover {
          border-color: #3b82f6;
        }

        .disc-status-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .disciplinary-page {
            padding: 12px;
          }

          .disc-stats {
            grid-template-columns: 1fr;
          }

          .disc-stat-card {
            padding: 16px;
          }

          .disc-stat-value {
            font-size: 24px;
          }

          .disc-student-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .disc-violation-count {
            align-self: flex-start;
          }

          .disc-violation-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .disc-violation-actions {
            width: 100%;
            justify-content: space-between;
          }

          .disc-violation-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .disc-status-actions {
            width: 100%;
          }

          .disc-status-buttons {
            width: 100%;
          }

          .disc-status-btn {
            flex: 1;
            min-width: 70px;
            text-align: center;
          }

          .modal-content {
            width: 95%;
            max-height: 95vh;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column;
          }

          .btn-cancel,
          .btn-submit {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .page-header-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .si-header-actions {
            width: 100%;
          }

          .btn-add-student {
            width: 100%;
            justify-content: center;
          }

          .disc-student-name {
            font-size: 14px;
          }

          .disc-student-meta {
            font-size: 12px;
          }

          .disc-violation-type {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .disc-status-buttons {
            flex-direction: column;
          }

          .disc-status-btn {
            width: 100%;
          }
        }

        .disc-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .disc-status-badge.active {
          background: #fee2e2;
          color: #dc2626;
        }

        .disc-status-badge.resolved {
          background: #d1fae5;
          color: #10b981;
        }

        .disc-status-badge.under-review {
          background: #fef3c7;
          color: #f59e0b;
        }

        .disc-status-badge.appealed {
          background: #dbeafe;
          color: #3b82f6;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-close {
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #f3f4f6;
        }

        .btn-cancel {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit {
          padding: 10px 20px;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  )
}
