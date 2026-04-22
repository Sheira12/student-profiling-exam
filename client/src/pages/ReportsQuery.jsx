import React, { useState, useEffect } from 'react'
import { getStudents } from '../api/supabase-students'
import {
  Search, Filter, Users, Award, Activity, Building, AlertTriangle,
  Play, RotateCcw, TrendingUp, Eye, Download, Zap, BookOpen,
  ChevronRight, Star, Shield, GraduationCap
} from 'lucide-react'

const ReportsQuery = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [hasQueried, setHasQueried] = useState(false)

  const [customFilters, setCustomFilters] = useState({
    skill: '', activity: '', affiliation: '',
    suspension: '', course: '', yearLevel: '', gpa: ''
  })

  const presetQueries = [
    { id: 'high_gpa',        label: 'High GPA (3.5+)',          icon: Star,          color: '#f59e0b', bg: '#fef3c7', filter: s => s.gpa >= 3.5 },
    { id: 'programming',     label: 'Programming Skills',        icon: BookOpen,      color: '#3b82f6', bg: '#dbeafe', filter: s => s.skills?.some(sk => ['programming','javascript','python','java','coding'].some(k => sk.toLowerCase().includes(k))) },
    { id: 'leadership',      label: 'Leadership Experience',     icon: Users,         color: '#8b5cf6', bg: '#ede9fe', filter: s => s.skills?.some(sk => sk.toLowerCase().includes('leadership')) || s.non_academic_activities?.some(a => ['president','leader','captain'].some(k => a.toLowerCase().includes(k))) },
    { id: 'honors',          label: 'Academic Awards',           icon: Award,         color: '#10b981', bg: '#d1fae5', filter: s => s.academic_awards?.length > 0 },
    { id: 'basketball',      label: 'Basketball',                icon: Activity,      color: '#ef4444', bg: '#fee2e2', filter: s => s.skills?.some(sk => sk.toLowerCase().includes('basketball')) },
    { id: 'suspended',       label: 'Disciplinary Records',      icon: Shield,        color: '#6b7280', bg: '#f3f4f6', filter: s => s.violations?.length > 0 },
    { id: 'cs_students',     label: 'Computer Science',          icon: GraduationCap, color: '#0ea5e9', bg: '#e0f2fe', filter: s => s.course?.toLowerCase().includes('computer science') },
    { id: 'it_students',     label: 'Information Technology',               icon: GraduationCap, color: '#6366f1', bg: '#e0e7ff', filter: s => s.course?.toLowerCase().includes('information technology') || s.course?.toLowerCase() === 'it' },
    { id: 'is_students',     label: 'Information System',               icon: GraduationCap, color: '#14b8a6', bg: '#ccfbf1', filter: s => s.course?.toLowerCase().includes('information system') || s.course?.toLowerCase() === 'is' },
    { id: 'senior_students', label: '4th Year Students',         icon: TrendingUp,    color: '#f97316', bg: '#ffedd5', filter: s => s.year_level === 4 },
  ]

  useEffect(() => { loadAllStudents() }, [])

  const loadAllStudents = async () => {
    try {
      setLoading(true); setError(null)
      const response = await getStudents()
      const data = response.data || []
      setStudents(data); setFilteredStudents(data)
    } catch (err) {
      setError('Failed to load students: ' + err.message)
    } finally { setLoading(false) }
  }

  const handlePresetQuery = (preset) => {
    setActivePreset(preset.id)
    setCustomFilters({ skill: '', activity: '', affiliation: '', suspension: '', course: '', yearLevel: '', gpa: '' })
    setFilteredStudents(students.filter(preset.filter))
    setHasQueried(true)
  }

  const handleCustomFilterChange = (field, value) => {
    setCustomFilters(prev => ({ ...prev, [field]: value }))
  }

  const runCustomQuery = () => {
    setActivePreset(null)
    let filtered = [...students]
    if (customFilters.skill.trim()) filtered = filtered.filter(s => s.skills?.some(sk => sk.toLowerCase().includes(customFilters.skill.toLowerCase())))
    if (customFilters.activity.trim()) filtered = filtered.filter(s => s.non_academic_activities?.some(a => a.toLowerCase().includes(customFilters.activity.toLowerCase())))
    if (customFilters.affiliation.trim()) filtered = filtered.filter(s => s.affiliations?.some(a => a.toLowerCase().includes(customFilters.affiliation.toLowerCase())))
    if (customFilters.suspension.trim()) filtered = filtered.filter(s => s.violations?.some(v => v.toLowerCase().includes(customFilters.suspension.toLowerCase())))
    if (customFilters.course.trim()) filtered = filtered.filter(s => s.course?.toLowerCase().includes(customFilters.course.toLowerCase()))
    if (customFilters.yearLevel) filtered = filtered.filter(s => s.year_level === parseInt(customFilters.yearLevel))
    if (customFilters.gpa) filtered = filtered.filter(s => s.gpa >= parseFloat(customFilters.gpa))
    setFilteredStudents(filtered)
    setHasQueried(true)
  }

  const clearAllFilters = () => {
    setActivePreset(null)
    setCustomFilters({ skill: '', activity: '', affiliation: '', suspension: '', course: '', yearLevel: '', gpa: '' })
    setFilteredStudents(students)
    setHasQueried(false)
  }

  const exportResults = async () => {
    try {
      // Dynamically import pdfmake to avoid build issues
      const pdfMakeModule = await import('pdfmake/build/pdfmake')
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
      
      const pdfMake = pdfMakeModule.default
      pdfMake.vfs = pdfFontsModule.default

      // Build filter description
      const filterDescriptions = []
      
      // Check for active preset
      if (activePreset) {
        const preset = presetQueries.find(p => p.id === activePreset)
        if (preset) {
          filterDescriptions.push(`Quick Filter: ${preset.label}`)
        }
      }
      
      // Check for custom filters
      if (customFilters.skill.trim()) {
        filterDescriptions.push(`Skills: ${customFilters.skill}`)
      }
      if (customFilters.activity.trim()) {
        filterDescriptions.push(`Activities: ${customFilters.activity}`)
      }
      if (customFilters.affiliation.trim()) {
        filterDescriptions.push(`Affiliations: ${customFilters.affiliation}`)
      }
      if (customFilters.suspension.trim()) {
        filterDescriptions.push(`Disciplinary Records: ${customFilters.suspension}`)
      }
      if (customFilters.course.trim()) {
        filterDescriptions.push(`Course: ${customFilters.course}`)
      }
      if (customFilters.yearLevel) {
        filterDescriptions.push(`Year Level: ${customFilters.yearLevel}`)
      }
      if (customFilters.gpa) {
        filterDescriptions.push(`Minimum GPA: ${customFilters.gpa}`)
      }
      
      const filterText = filterDescriptions.length > 0 
        ? filterDescriptions.join(' • ') 
        : 'No filters applied (All students)'

      // Prepare table body
      const tableBody = [
        // Header row
        [
          { text: 'Student ID', style: 'tableHeader' },
          { text: 'Name', style: 'tableHeader' },
          { text: 'Course', style: 'tableHeader' },
          { text: 'Year', style: 'tableHeader' },
          { text: 'GPA', style: 'tableHeader' },
          { text: 'Skills', style: 'tableHeader' },
          { text: 'Activities', style: 'tableHeader' },
          { text: 'Awards', style: 'tableHeader' }
        ],
        // Data rows
        ...filteredStudents.map(s => [
          s.student_id || '',
          `${s.first_name} ${s.last_name}`,
          s.course || '',
          s.year_level?.toString() || '',
          s.gpa ? s.gpa.toFixed(2) : '',
          s.skills?.slice(0, 3).join(', ') || '',
          s.non_academic_activities?.slice(0, 2).join(', ') || '',
          s.academic_awards?.slice(0, 2).join(', ') || ''
        ])
      ]

      // PDF document definition
      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [40, 60, 40, 60],
        content: [
          {
            text: 'Student Query Results',
            style: 'header',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            style: 'subheader',
            margin: [0, 0, 0, 5]
          },
          {
            text: `Total Results: ${filteredStudents.length} students`,
            style: 'subheader',
            margin: [0, 0, 0, 5]
          },
          {
            text: `Filters Applied: ${filterText}`,
            style: 'filterInfo',
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', '*', '*', '*'],
              body: tableBody
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#3b82f6' : (rowIndex % 2 === 0 ? '#f3f4f6' : null)
              },
              hLineWidth: function () { return 0.5 },
              vLineWidth: function () { return 0.5 },
              hLineColor: function () { return '#e5e7eb' },
              vLineColor: function () { return '#e5e7eb' }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#1f2937'
          },
          subheader: {
            fontSize: 10,
            color: '#6b7280'
          },
          filterInfo: {
            fontSize: 9,
            color: '#3b82f6',
            bold: true,
            italics: true
          },
          tableHeader: {
            bold: true,
            fontSize: 9,
            color: 'white'
          }
        },
        defaultStyle: {
          fontSize: 8
        }
      }

      // Generate and download PDF
      pdfMake.createPdf(docDefinition).download(`query-results-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const hasActiveCustomFilters = Object.values(customFilters).some(v => v.trim() !== '')

  const filterFields = [
    { key: 'skill',       label: 'Skills & Abilities',         icon: Award,         placeholder: 'e.g., JavaScript, Leadership',    type: 'text',   color: '#f59e0b' },
    { key: 'activity',    label: 'Activities & Sports',         icon: Activity,      placeholder: 'e.g., Basketball, Drama Club',     type: 'text',   color: '#10b981' },
    { key: 'affiliation', label: 'Organizations & Affiliations',icon: Building,      placeholder: 'e.g., IEEE, ACM, Student Gov',     type: 'text',   color: '#3b82f6' },
    { key: 'suspension',  label: 'Disciplinary Records',        icon: AlertTriangle, placeholder: 'e.g., Suspension, Warning',        type: 'text',   color: '#ef4444' },
    { key: 'course',      label: 'Course Program',              icon: GraduationCap, placeholder: 'e.g., Computer Science, IT',       type: 'text',   color: '#8b5cf6' },
    { key: 'yearLevel',   label: 'Year Level',                  icon: TrendingUp,    placeholder: null,                               type: 'select', color: '#0ea5e9' },
    { key: 'gpa',         label: 'Minimum GPA',                 icon: Star,          placeholder: 'e.g., 3.5',                        type: 'number', color: '#f97316' },
  ]

  return (
    <div className="rq-page">

      {/* ── Header ── */}
      <div className="rq-header">
        <div className="rq-header-left">
          <div className="rq-header-icon-wrap">
            <Filter size={22} />
          </div>
          <div>
            <h1 className="rq-header-title">Student Query & Filtering</h1>
            <p className="rq-header-sub">Advanced search tools to find and analyze specific student records</p>
          </div>
        </div>
        <div className="rq-header-stats">
          {[
            { val: filteredStudents.length, lbl: 'Results' },
            { val: students.length,         lbl: 'Total' },
            { val: students.length > 0 ? ((filteredStudents.length / students.length) * 100).toFixed(0) + '%' : '0%', lbl: 'Match' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="rq-stat-pill">
              <span className="rq-stat-val">{val}</span>
              <span className="rq-stat-lbl">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Filters ── */}
      <div className="rq-section">
        <div className="rq-section-head">
          <Zap size={16} className="rq-section-icon" />
          <span>Quick Filters</span>
          <span className="rq-section-hint">Click to instantly filter students</span>
        </div>
        <div className="rq-preset-grid">
          {presetQueries.map(preset => {
            const Icon = preset.icon
            const count = students.filter(preset.filter).length
            const isActive = activePreset === preset.id
            return (
              <button
                key={preset.id}
                className={`rq-preset-btn ${isActive ? 'active' : ''}`}
                style={isActive ? { '--preset-color': preset.color, '--preset-bg': preset.bg } : { '--preset-color': preset.color, '--preset-bg': preset.bg }}
                onClick={() => handlePresetQuery(preset)}
              >
                <span className="rq-preset-icon-wrap" style={{ background: preset.bg, color: preset.color }}>
                  <Icon size={16} />
                </span>
                <span className="rq-preset-label">{preset.label}</span>
                <span className="rq-preset-count" style={{ background: isActive ? 'rgba(255,255,255,0.25)' : preset.bg, color: isActive ? 'white' : preset.color }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Advanced Filters ── */}
      <div className="rq-section">
        <div className="rq-section-head">
          <Filter size={16} className="rq-section-icon" />
          <span>Advanced Filters</span>
          <span className="rq-section-hint">Combine multiple criteria for precise searches</span>
        </div>

        <div className="rq-filters-card">
          <div className="rq-filters-grid">
            {filterFields.map(({ key, label, icon: Icon, placeholder, type, color }) => (
              <div key={key} className="rq-filter-field">
                <label className="rq-filter-label">
                  <span className="rq-filter-label-icon" style={{ color }}>
                    <Icon size={14} />
                  </span>
                  {label}
                </label>
                {type === 'select' ? (
                  <select
                    className="rq-filter-input"
                    value={customFilters[key]}
                    onChange={e => handleCustomFilterChange(key, e.target.value)}
                    style={{ '--focus-color': color }}
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                ) : (
                  <input
                    className={`rq-filter-input ${customFilters[key] ? 'has-value' : ''}`}
                    type={type}
                    step={type === 'number' ? '0.1' : undefined}
                    min={type === 'number' ? '0' : undefined}
                    max={type === 'number' ? '4' : undefined}
                    placeholder={placeholder}
                    value={customFilters[key]}
                    onChange={e => handleCustomFilterChange(key, e.target.value)}
                    style={{ '--focus-color': color }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="rq-actions">
            <button className="rq-btn-run" onClick={runCustomQuery} disabled={!hasActiveCustomFilters}>
              <Play size={15} />
              Run Query
            </button>
            <button className="rq-btn-clear" onClick={clearAllFilters} disabled={!activePreset && !hasActiveCustomFilters}>
              <RotateCcw size={15} />
              Clear All
            </button>
            {filteredStudents.length > 0 && hasQueried && (
              <button className="rq-btn-export" onClick={exportResults}>
                <Download size={15} />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {hasQueried && (
        <div className="rq-section">
          <div className="rq-section-head">
            <Eye size={16} className="rq-section-icon" />
            <span>Results</span>
            <div className="rq-results-badges">
              <span className="rq-badge-count">{filteredStudents.length} of {students.length} students</span>
              {activePreset && (
                <span className="rq-badge-filter">
                  {presetQueries.find(p => p.id === activePreset)?.label}
                </span>
              )}
              {hasActiveCustomFilters && (
                <span className="rq-badge-filter custom">Custom Filters</span>
              )}
            </div>
          </div>

          {error && (
            <div className="rq-error">
              <AlertTriangle size={18} />
              <div><strong>Error</strong><p>{error}</p></div>
            </div>
          )}

          {!loading && !error && filteredStudents.length === 0 && (
            <div className="rq-empty">
              <div className="rq-empty-icon"><Search size={36} /></div>
              <h3>No matching students</h3>
              <p>Try adjusting your search criteria</p>
              <button className="rq-btn-clear" onClick={clearAllFilters}>
                <RotateCcw size={14} /> Show All Students
              </button>
            </div>
          )}

          {!loading && !error && filteredStudents.length > 0 && (
            <div className="rq-table-wrap">
              <table className="rq-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Program</th>
                    <th>Skills</th>
                    <th>Activities</th>
                    <th>Awards</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="rq-student-cell">
                          <div className="rq-avatar">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </div>
                          <div>
                            <div className="rq-student-name">{s.first_name} {s.last_name}</div>
                            <div className="rq-student-id">{s.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="rq-course">{s.course || '—'}</div>
                        <div className="rq-year-gpa">
                          {s.year_level && <span className="rq-pill year">Yr {s.year_level}</span>}
                          {s.gpa && <span className="rq-pill gpa">GPA {s.gpa?.toFixed(2)}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="rq-tags">
                          {s.skills?.slice(0, 2).map((sk, i) => <span key={i} className="rq-tag skill">{sk}</span>)}
                          {s.skills?.length > 2 && <span className="rq-tag more">+{s.skills.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="rq-tags">
                          {s.non_academic_activities?.slice(0, 2).map((a, i) => <span key={i} className="rq-tag activity">{a}</span>)}
                          {s.non_academic_activities?.length > 2 && <span className="rq-tag more">+{s.non_academic_activities.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="rq-tags">
                          {s.academic_awards?.slice(0, 1).map((aw, i) => <span key={i} className="rq-tag award">{aw}</span>)}
                          {s.academic_awards?.length > 1 && <span className="rq-tag more">+{s.academic_awards.length - 1}</span>}
                        </div>
                      </td>
                      <td>
                        <a href={`/admin/students/${s.id}`} className="rq-view-btn">
                          <ChevronRight size={16} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportsQuery
