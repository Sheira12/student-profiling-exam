import React, { useState, useEffect } from 'react'
import { getStudents, getStudentCount } from '../api/supabase-students'
import { BarChart2, Users, Award, TrendingUp, AlertTriangle, PieChart, Activity, BookOpen } from 'lucide-react'

const QueryStudents = () => {
  const [students, setStudents] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const [response, count] = await Promise.all([getStudents(), getStudentCount()])
      setStudents(response.data || [])
      setTotalCount(count)
    } catch (err) {
      setError('Failed to load student data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate analytics
  const analytics = {
    total: totalCount,
    
    // Course distribution
    courseStats: students.reduce((acc, student) => {
      const course = student.course || 'Unknown'
      acc[course] = (acc[course] || 0) + 1
      return acc
    }, {}),
    
    // Year level distribution
    yearStats: students.reduce((acc, student) => {
      const year = student.year_level || 'Unknown'
      acc[year] = (acc[year] || 0) + 1
      return acc
    }, {}),
    
    // GPA statistics
    gpaStats: {
      high: students.filter(s => s.gpa >= 3.5).length,
      medium: students.filter(s => s.gpa >= 2.5 && s.gpa < 3.5).length,
      low: students.filter(s => s.gpa < 2.5).length,
      average: students.length > 0 ? (students.reduce((sum, s) => sum + (s.gpa || 0), 0) / students.length).toFixed(2) : 0
    },
    
    // Skills analysis
    skillsStats: {
      withSkills: students.filter(s => s.skills && s.skills.length > 0).length,
      programmingSkills: students.filter(s => 
        s.skills?.some(skill => 
          skill.toLowerCase().includes('programming') || 
          skill.toLowerCase().includes('javascript') || 
          skill.toLowerCase().includes('python')
        )
      ).length,
      leadershipSkills: students.filter(s => 
        s.skills?.some(skill => skill.toLowerCase().includes('leadership'))
      ).length
    },
    
    // Activities and achievements
    activitiesStats: {
      withActivities: students.filter(s => s.non_academic_activities && s.non_academic_activities.length > 0).length,
      withAwards: students.filter(s => s.academic_awards && s.academic_awards.length > 0).length,
      withViolations: students.filter(s => s.violations && s.violations.length > 0).length
    }
  }

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reports-error">
        <AlertTriangle className="icon" />
        <h3>Error Loading Reports</h3>
        <p>{error}</p>
        <button onClick={loadStudents} className="retry-btn">Try Again</button>
      </div>
    )
  }

  return (
    <div className="reports-dashboard">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <BarChart2 className="header-icon" />
              Student Analytics & Reports
            </h1>
            <p className="header-description">
              Comprehensive insights and statistical analysis of student data
            </p>
          </div>
          <div className="total-students-card">
            <div className="total-number">{analytics.total}</div>
            <div className="total-label">Total Students</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp className="icon" />
          </div>
          <div className="metric-content">
            <div className="metric-number">{analytics.gpaStats.average}</div>
            <div className="metric-label">Average GPA</div>
            <div className="metric-sublabel">Across all students</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Award className="icon" />
          </div>
          <div className="metric-content">
            <div className="metric-number">{analytics.gpaStats.high}</div>
            <div className="metric-label">High Performers</div>
            <div className="metric-sublabel">GPA 3.5 and above</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Activity className="icon" />
          </div>
          <div className="metric-content">
            <div className="metric-number">{analytics.activitiesStats.withActivities}</div>
            <div className="metric-label">Active Students</div>
            <div className="metric-sublabel">With extracurricular activities</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <BookOpen className="icon" />
          </div>
          <div className="metric-content">
            <div className="metric-number">{analytics.skillsStats.programmingSkills}</div>
            <div className="metric-label">Tech Skills</div>
            <div className="metric-sublabel">Programming abilities</div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="charts-grid">
        {/* Course Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <PieChart className="icon" />
              Course Distribution
            </h3>
            <p>Students enrolled by program</p>
          </div>
          <div className="chart-content">
            {Object.entries(analytics.courseStats).map(([course, count]) => (
              <div key={course} className="chart-bar">
                <div className="bar-label">{course}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(count / analytics.total) * 100}%` }}
                  ></div>
                  <span className="bar-value">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Year Level Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Users className="icon" />
              Year Level Distribution
            </h3>
            <p>Students by academic year</p>
          </div>
          <div className="chart-content">
            {Object.entries(analytics.yearStats)
              .sort(([a], [b]) => a - b)
              .map(([year, count]) => (
              <div key={year} className="chart-bar">
                <div className="bar-label">Year {year}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill year-bar" 
                    style={{ width: `${(count / analytics.total) * 100}%` }}
                  ></div>
                  <span className="bar-value">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GPA Performance */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <TrendingUp className="icon" />
              Academic Performance
            </h3>
            <p>GPA distribution analysis</p>
          </div>
          <div className="chart-content">
            <div className="chart-bar">
              <div className="bar-label">High (3.5+)</div>
              <div className="bar-container">
                <div 
                  className="bar-fill high-gpa" 
                  style={{ width: `${(analytics.gpaStats.high / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.gpaStats.high}</span>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">Medium (2.5-3.4)</div>
              <div className="bar-container">
                <div 
                  className="bar-fill medium-gpa" 
                  style={{ width: `${(analytics.gpaStats.medium / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.gpaStats.medium}</span>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">Low (Below 2.5)</div>
              <div className="bar-container">
                <div 
                  className="bar-fill low-gpa" 
                  style={{ width: `${(analytics.gpaStats.low / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.gpaStats.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Activities Summary */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Activity className="icon" />
              Skills & Activities
            </h3>
            <p>Student engagement metrics</p>
          </div>
          <div className="chart-content">
            <div className="chart-bar">
              <div className="bar-label">With Skills</div>
              <div className="bar-container">
                <div 
                  className="bar-fill skills-bar" 
                  style={{ width: `${(analytics.skillsStats.withSkills / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.skillsStats.withSkills}</span>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">With Activities</div>
              <div className="bar-container">
                <div 
                  className="bar-fill activities-bar" 
                  style={{ width: `${(analytics.activitiesStats.withActivities / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.activitiesStats.withActivities}</span>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">With Awards</div>
              <div className="bar-container">
                <div 
                  className="bar-fill awards-bar" 
                  style={{ width: `${(analytics.activitiesStats.withAwards / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.activitiesStats.withAwards}</span>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">With Violations</div>
              <div className="bar-container">
                <div 
                  className="bar-fill violations-bar" 
                  style={{ width: `${(analytics.activitiesStats.withViolations / analytics.total) * 100}%` }}
                ></div>
                <span className="bar-value">{analytics.activitiesStats.withViolations}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="insights-section">
        <h2>
          <BarChart2 className="icon" />
          Key Insights
        </h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Academic Excellence</h4>
            <p>
              {((analytics.gpaStats.high / analytics.total) * 100).toFixed(1)}% of students maintain a GPA of 3.5 or higher, 
              indicating strong academic performance across the student body.
            </p>
          </div>
          <div className="insight-card">
            <h4>Student Engagement</h4>
            <p>
              {((analytics.activitiesStats.withActivities / analytics.total) * 100).toFixed(1)}% of students participate in 
              extracurricular activities, showing good engagement beyond academics.
            </p>
          </div>
          <div className="insight-card">
            <h4>Technical Skills</h4>
            <p>
              {((analytics.skillsStats.programmingSkills / analytics.total) * 100).toFixed(1)}% of students have programming 
              skills, reflecting the technical focus of the programs.
            </p>
          </div>
          <div className="insight-card">
            <h4>Recognition & Awards</h4>
            <p>
              {((analytics.activitiesStats.withAwards / analytics.total) * 100).toFixed(1)}% of students have received 
              academic awards, highlighting achievement and recognition.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueryStudents
