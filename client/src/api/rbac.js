import { supabase } from '../lib/supabase'

// ── Helpers ──────────────────────────────────────────────────
async function logActivity({ actor_type, actor_id, actor_name, action, entity_type, entity_id, details = {} }) {
  await supabase.from('activity_logs').insert([{ actor_type, actor_id, actor_name, action, entity_type, entity_id, details }])
}

async function pushNotification({ recipient_type, recipient_id, title, message, type = 'info' }) {
  await supabase.from('notifications').insert([{ recipient_type, recipient_id, title, message, type }])
}

// ══════════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════════
export const getEmployees = async () => {
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getEmployee = async (id) => {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).single()
  if (error) throw error
  return { data }
}

export const getEmployeeByCredentials = async (employee_id, password) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', employee_id.trim())
    .eq('password_hash', password)
    .maybeSingle()
  if (error) return { data: null, error }  // surface real DB errors
  return { data, error: null }
}

export const createEmployee = async (payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('employees').insert([payload]).select().single()
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Created employee', entity_type: 'employee', entity_id: data.id, details: { name: `${data.first_name} ${data.last_name}` } })
  return { data }
}

export const updateEmployee = async (id, payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('employees').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Updated employee', entity_type: 'employee', entity_id: id, details: payload })
  return { data }
}

export const deleteEmployee = async (id, actorName = 'Admin') => {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Deleted employee', entity_type: 'employee', entity_id: id })
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// SUBJECTS
// ══════════════════════════════════════════════════════════════
export const getSubjects = async () => {
  const { data, error } = await supabase.from('subjects').select('*').order('year_level').order('code')
  if (error) throw error
  return { data }
}

export const createSubject = async (payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('subjects').insert([payload]).select().single()
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Created subject', entity_type: 'subject', entity_id: data.id, details: { code: data.code, name: data.name } })
  return { data }
}

export const updateSubject = async (id, payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('subjects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Updated subject', entity_type: 'subject', entity_id: id, details: payload })
  return { data }
}

export const deleteSubject = async (id, actorName = 'Admin') => {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Deleted subject', entity_type: 'subject', entity_id: id })
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// ADVISER ASSIGNMENTS
// ══════════════════════════════════════════════════════════════
export const getAssignments = async () => {
  const { data, error } = await supabase
    .from('adviser_assignments')
    .select(`*, employees(id,employee_id,first_name,last_name,email,department), students(id,student_id,first_name,last_name,course,year_level)`)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getAssignmentsByEmployee = async (employeeId) => {
  const { data, error } = await supabase
    .from('adviser_assignments')
    .select(`*, students(*)`)
    .eq('employee_id', employeeId)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getAssignmentByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('adviser_assignments')
    .select(`*, employees(id,employee_id,first_name,last_name,email,phone,department,position)`)
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return { data }
}

export const assignAdviser = async ({ employee_id, student_id, notes = '' }, actorName = 'Admin') => {
  // First remove any existing assignment for this student (one adviser per student)
  await supabase.from('adviser_assignments').delete().eq('student_id', student_id)

  const { data, error } = await supabase
    .from('adviser_assignments')
    .insert([{ employee_id, student_id, notes, assigned_by: actorName, assigned_at: new Date().toISOString() }])
    .select(`*, employees(first_name,last_name), students(first_name,last_name,student_id)`)
    .single()
  if (error) throw error

  const emp = data.employees
  const stu = data.students
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Assigned adviser', entity_type: 'assignment', entity_id: data.id, details: { adviser: `${emp?.first_name} ${emp?.last_name}`, student: `${stu?.first_name} ${stu?.last_name}` } })
  await pushNotification({ recipient_type: 'student', recipient_id: student_id, title: 'Adviser Assigned', message: `${emp?.first_name} ${emp?.last_name} has been assigned as your adviser.`, type: 'success' })
  await pushNotification({ recipient_type: 'employee', recipient_id: employee_id, title: 'New Student Assigned', message: `${stu?.first_name} ${stu?.last_name} (${stu?.student_id}) has been assigned to you.`, type: 'info' })
  return { data }
}

export const removeAssignment = async (id, actorName = 'Admin') => {
  const { error } = await supabase.from('adviser_assignments').delete().eq('id', id)
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Removed adviser assignment', entity_type: 'assignment', entity_id: id })
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// SUBJECT DEPLOYMENTS
// ══════════════════════════════════════════════════════════════
export const getDeployments = async () => {
  const { data, error } = await supabase
    .from('subject_deployments')
    .select(`*, subjects(id,code,name,units,semester,year_level), students(id,student_id,first_name,last_name,course,year_level)`)
    .order('deployed_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getDeploymentsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('subject_deployments')
    .select(`*, subjects(*)`)
    .eq('student_id', studentId)
    .order('deployed_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const getDeploymentsByEmployee = async (employeeId) => {
  // Get all students assigned to this employee, then their deployments
  const { data: assignments } = await getAssignmentsByEmployee(employeeId)
  if (!assignments?.length) return { data: [] }
  const studentIds = assignments.map(a => a.student_id)
  const { data, error } = await supabase
    .from('subject_deployments')
    .select(`*, subjects(*), students(id,student_id,first_name,last_name,course,year_level)`)
    .in('student_id', studentIds)
    .order('deployed_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const deploySubject = async ({ subject_id, student_id, status = 'Pending', remarks = '' }, actorName = 'Admin') => {
  const { data, error } = await supabase
    .from('subject_deployments')
    .upsert([{ subject_id, student_id, status, remarks, deployed_by: actorName, deployed_at: new Date().toISOString(), updated_at: new Date().toISOString() }], { onConflict: 'subject_id,student_id' })
    .select(`*, subjects(code,name), students(first_name,last_name,student_id)`)
    .single()
  if (error) throw error

  const subj = data.subjects
  const stu = data.students
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Deployed subject', entity_type: 'deployment', entity_id: data.id, details: { subject: subj?.name, student: `${stu?.first_name} ${stu?.last_name}` } })
  await pushNotification({ recipient_type: 'student', recipient_id: student_id, title: 'Subject Deployed', message: `${subj?.name} (${subj?.code}) has been deployed to you.`, type: 'info' })
  return { data }
}

export const updateDeploymentStatus = async (id, { status, grade, remarks }, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('subject_deployments')
    .update({ status, grade, remarks, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, subjects(code,name), students(id,first_name,last_name,student_id)`)
    .single()
  if (error) throw error

  const subj = data.subjects
  const stu = data.students
  await logActivity({ actor_type: 'employee', actor_id: actorName, actor_name: actorName, action: `Updated subject status to ${status}`, entity_type: 'deployment', entity_id: id, details: { subject: subj?.name, student: `${stu?.first_name} ${stu?.last_name}`, status, grade } })
  await pushNotification({ recipient_type: 'student', recipient_id: stu?.id, title: 'Subject Status Updated', message: `${subj?.name} status changed to ${status}${grade ? ` — Grade: ${grade}` : ''}.`, type: status === 'Completed' ? 'success' : 'info' })
  return { data }
}

export const deleteDeployment = async (id, actorName = 'Admin') => {
  const { error } = await supabase.from('subject_deployments').delete().eq('id', id)
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Removed subject deployment', entity_type: 'deployment', entity_id: id })
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
export const getNotifications = async (recipient_type, recipient_id) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_type', recipient_type)
    .eq('recipient_id', recipient_id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return { data }
}

export const markNotificationRead = async (id) => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
  return { success: true }
}

export const markAllNotificationsRead = async (recipient_type, recipient_id) => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_type', recipient_type).eq('recipient_id', recipient_id)
  if (error) throw error
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════════════════════════════
export const getMessages = async (myType, myId, otherType, otherId) => {
  // Fetch both directions separately and merge — avoids complex OR nesting
  const [sent, received] = await Promise.all([
    supabase.from('messages').select('*')
      .eq('sender_type', myType).eq('sender_id', myId)
      .eq('receiver_type', otherType).eq('receiver_id', otherId),
    supabase.from('messages').select('*')
      .eq('sender_type', otherType).eq('sender_id', otherId)
      .eq('receiver_type', myType).eq('receiver_id', myId),
  ])
  if (sent.error) throw sent.error
  if (received.error) throw received.error
  const merged = [...(sent.data || []), ...(received.data || [])]
  merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return { data: merged }
}

export const sendMessage = async ({ sender_type, sender_id, receiver_type, receiver_id, content }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_type, sender_id, receiver_type, receiver_id, content }])
    .select().single()
  if (error) throw error
  return { data }
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ══════════════════════════════════════════════════════════════
export const getActivityLogs = async (limit = 100) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return { data }
}

export { logActivity, pushNotification }

// ══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════
export const getAnnouncements = async (target = 'all') => {
  let query = supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false })
  if (target !== 'all') {
    query = query.or(`target.eq.all,target.eq.${target}`)
  }
  const { data, error } = await query
  if (error) throw error
  return { data }
}

export const getAllAnnouncements = async () => {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return { data }
}

export const createAnnouncement = async (payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('announcements').insert([{ ...payload, author_name: actorName }]).select().single()
  if (error) throw error
  await logActivity({ actor_type: payload.author_type || 'admin', actor_id: payload.author_id || 'admin', actor_name: actorName, action: 'Created announcement', entity_type: 'announcement', entity_id: data.id, details: { title: data.title } })
  return { data }
}

export const updateAnnouncement = async (id, payload, actorName = 'Admin') => {
  const { data, error } = await supabase.from('announcements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return { data }
}

export const deleteAnnouncement = async (id, actorName = 'Admin') => {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: 'Deleted announcement', entity_type: 'announcement', entity_id: id })
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// CURRICULUM DEPLOYMENTS
// ══════════════════════════════════════════════════════════════
export const getCurriculumDeployments = async (studentId) => {
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .select('*, employees(id, employee_id, first_name, last_name, position)')
    .eq('student_id', studentId)
    .order('year_level').order('semester').order('subject_code')
  if (error) throw error
  return { data }
}
export const getCurriculumDeploymentsByEmployee = async (employeeId) => {
  // 'all' = admin view — fetch everything
  if (employeeId === 'all') {
    const { data, error } = await supabase
      .from('curriculum_deployments')
      .select('*, students(id,student_id,first_name,last_name,course,year_level)')
      .order('year_level').order('subject_code')
    if (error) throw error
    return { data }
  }
  const { data: assignments } = await getAssignmentsByEmployee(employeeId)
  if (!assignments?.length) return { data: [] }
  const studentIds = assignments.map(a => a.student_id)
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .select('*, students(id,student_id,first_name,last_name,course,year_level)')
    .in('student_id', studentIds)
    .order('year_level').order('subject_code')
  if (error) throw error
  return { data }
}

// Deploy all subjects from a semester to a student
export const deploySemesterSubjects = async (studentId, semesterSubjects, semesterLabel, yearLevel, actorName = 'Admin', adviserId = null) => {
  const rows = semesterSubjects.map(s => ({
    student_id: studentId,
    subject_code: s.code,
    subject_desc: s.desc,
    units: s.units,
    semester: semesterLabel,
    year_level: yearLevel,
    status: 'Enrolled',
    deployed_by: actorName,
    adviser_id: adviserId,
    deployed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('curriculum_deployments')
    .upsert(rows, { onConflict: 'student_id,subject_code' })
    .select()
  if (error) throw error

  // Sync academic_progress in students table
  const progressUpdate = {}
  semesterSubjects.forEach(s => { progressUpdate[s.code] = 'ENROLLED' })
  const { data: student } = await supabase.from('students').select('academic_progress').eq('id', studentId).single()
  const merged = { ...(student?.academic_progress || {}), ...progressUpdate }
  await supabase.from('students').update({ academic_progress: merged }).eq('id', studentId)

  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: `Deployed ${semesterSubjects.length} subjects (${semesterLabel})`, entity_type: 'curriculum_deployment', entity_id: studentId, details: { semester: semesterLabel, count: semesterSubjects.length } })
  await pushNotification({ recipient_type: 'student', recipient_id: studentId, title: 'Subjects Deployed', message: `${semesterSubjects.length} subjects for ${semesterLabel} have been deployed to you.`, type: 'info' })
  return { data }
}

// Deploy a single curriculum subject
export const deployCurriculumSubject = async ({ student_id, subject_code, subject_desc, units, semester, year_level, status = 'Enrolled', grade = '', remarks = '', adviser_id = null }, actorName = 'Admin') => {
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .upsert([{ student_id, subject_code, subject_desc, units, semester, year_level, status, grade, remarks, deployed_by: actorName, adviser_id, deployed_at: new Date().toISOString(), updated_at: new Date().toISOString() }], { onConflict: 'student_id,subject_code' })
    .select().single()
  if (error) throw error

  // Sync academic_progress
  const { data: student } = await supabase.from('students').select('academic_progress').eq('id', student_id).single()
  const ap = { ...(student?.academic_progress || {}), [subject_code]: status === 'Passed' ? 'PASSED' : status === 'Failed' ? 'FAILED' : status === 'INC' ? 'INC' : status === 'Dropped' ? 'DROPPED' : 'ENROLLED' }
  await supabase.from('students').update({ academic_progress: ap }).eq('id', student_id)

  return { data }
}

// Update curriculum deployment status (by adviser or admin)
export const updateCurriculumDeployment = async (id, { status, grade, remarks, prelim_grade, midterm_grade, finals_grade }, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .update({ status, grade, remarks, prelim_grade, midterm_grade, finals_grade, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, students(id,student_id,first_name,last_name,academic_progress)')
    .single()
  if (error) throw error

  // Sync academic_progress
  const stu = data.students
  if (stu) {
    const statusMap = { Passed: 'PASSED', Failed: 'FAILED', INC: 'INC', Dropped: 'DROPPED', Enrolled: 'ENROLLED', Ongoing: 'ENROLLED', Pending: '' }
    const ap = { ...(stu.academic_progress || {}), [data.subject_code]: grade || statusMap[status] || '' }
    await supabase.from('students').update({ academic_progress: ap }).eq('id', stu.id)
  }

  await logActivity({ actor_type: 'employee', actor_id: actorName, actor_name: actorName, action: `Updated ${data.subject_code} to ${status}`, entity_type: 'curriculum_deployment', entity_id: id, details: { subject: data.subject_code, status, grade } })
  if (stu) {
    await pushNotification({ recipient_type: 'student', recipient_id: stu.id, title: 'Subject Updated', message: `${data.subject_code} — ${data.subject_desc} status changed to ${status}${grade ? ` (Grade: ${grade})` : ''}.`, type: status === 'Passed' ? 'success' : 'info' })
  }
  return { data }
}

export const deleteCurriculumDeployment = async (id, actorName = 'Admin') => {
  const { data: dep } = await supabase.from('curriculum_deployments').select('student_id,subject_code').eq('id', id).single()
  const { error } = await supabase.from('curriculum_deployments').delete().eq('id', id)
  if (error) throw error
  // Remove from academic_progress
  if (dep) {
    const { data: student } = await supabase.from('students').select('academic_progress').eq('id', dep.student_id).single()
    if (student?.academic_progress) {
      const ap = { ...student.academic_progress }
      delete ap[dep.subject_code]
      await supabase.from('students').update({ academic_progress: ap }).eq('id', dep.student_id)
    }
  }
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// SCOPE VALIDATION HELPER
// ══════════════════════════════════════════════════════════════
export const isStudentAssignedToAdviser = async (adviserId, studentId) => {
  const { data } = await supabase
    .from('adviser_assignments')
    .select('id')
    .eq('employee_id', adviserId)
    .eq('student_id', studentId)
    .maybeSingle()
  return !!data
}

// ══════════════════════════════════════════════════════════════
// ACTIVITIES
// ══════════════════════════════════════════════════════════════
export const getActivitiesByAdviser = async (adviserId) => {
  const { data, error } = await supabase
    .from('activities')
    .select(`*, student_activities(id, status, student_id, score, submission_note, submission_file_url, students(id, student_id, first_name, last_name))`)
    .eq('adviser_id', adviserId)
    .eq('status', 'active')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return { data }
}

export const getActivityWithStudents = async (activityId) => {
  const { data, error } = await supabase
    .from('activities')
    .select(`*, student_activities(*, students(id,student_id,first_name,last_name))`)
    .eq('id', activityId)
    .single()
  if (error) throw error
  return { data }
}

export const createActivity = async (payload, studentIds, adviserId, actorName = 'Adviser') => {
  // Validate all students are assigned to this adviser
  for (const sid of studentIds) {
    const ok = await isStudentAssignedToAdviser(adviserId, sid)
    if (!ok) throw new Error(`Student ${sid} is not assigned to this adviser.`)
  }

  const { data: activity, error } = await supabase
    .from('activities')
    .insert([{
      ...payload,
      adviser_id: adviserId,
      file_url: payload.file_url || null,
      subject_code: payload.subject_code || null,
      max_score: payload.max_score || null,
    }])
    .select()
    .single()
  if (error) throw error

  if (studentIds.length > 0) {
    const rows = studentIds.map(sid => ({
      activity_id: activity.id,
      student_id: sid,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }))
    const { error: saErr } = await supabase.from('student_activities').insert(rows)
    if (saErr) throw saErr
  }

  await logActivity({ actor_type: 'employee', actor_id: adviserId, actor_name: actorName, action: `Created activity: ${activity.title}`, entity_type: 'activity', entity_id: activity.id, details: { type: activity.type, students: studentIds.length } })
  for (const sid of studentIds) {
    await pushNotification({ recipient_type: 'student', recipient_id: sid, title: 'New Activity Assigned', message: `${activity.title} (${activity.type}) has been assigned to you${activity.due_date ? ` — due ${new Date(activity.due_date).toLocaleDateString()}` : ''}.`, type: 'info' })
  }
  return { data: activity }
}

export const updateActivity = async (id, payload, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity({ actor_type: 'employee', actor_id: actorName, actor_name: actorName, action: `Updated activity`, entity_type: 'activity', entity_id: id, details: payload })
  return { data }
}

export const archiveActivity = async (id, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('activities')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity({ actor_type: 'employee', actor_id: actorName, actor_name: actorName, action: 'Archived activity', entity_type: 'activity', entity_id: id })
  return { data }
}

export const updateStudentActivityStatus = async (id, { status, submission_note, score }, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('student_activities')
    .update({ status, submission_note, score: score !== '' ? score : null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity({ actor_type: 'employee', actor_id: actorName, actor_name: actorName, action: `Updated student activity to ${status}`, entity_type: 'student_activity', entity_id: id })
  return { data }
}

export const getStudentActivities = async (studentId) => {
  const { data, error } = await supabase
    .from('student_activities')
    .select(`*, activities(id, title, description, type, due_date, status, file_url, subject_code, max_score)`)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return { data }
}

// ── Adviser-scoped announcements ──
export const getAdviserAnnouncements = async (adviserId) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .or(`author_id.eq.${adviserId},author_type.eq.admin`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return { data }
}

// ── Student-scoped announcements (admin + assigned adviser only) ──
export const getStudentAnnouncements = async (studentId, adviserId) => {
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .in('target', ['all', 'students'])
    .order('created_at', { ascending: false })

  if (adviserId) {
    query = query.or(`author_type.eq.admin,author_id.eq.${adviserId}`)
  } else {
    query = query.eq('author_type', 'admin')
  }

  const { data, error } = await query
  if (error) throw error
  return { data }
}

// ══════════════════════════════════════════════════════════════
// CLASS SCHEDULES
// ══════════════════════════════════════════════════════════════
export const getClassSchedules = async (adviserId) => {
  const { data, error } = await supabase
    .from('class_schedules')
    .select('*')
    .eq('adviser_id', adviserId)
    .order('day_of_week')
    .order('start_time')
  if (error) throw error
  return { data }
}

export const createClassSchedule = async (payload, actorName = 'Adviser') => {
  const { data, error } = await supabase
    .from('class_schedules')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  await logActivity({ actor_type: 'employee', actor_id: payload.adviser_id, actor_name: actorName, action: 'Created class schedule', entity_type: 'class_schedule', entity_id: data.id, details: { subject: data.subject_name, day: data.day_of_week } })
  return { data }
}

export const deleteClassSchedule = async (id, actorName = 'Adviser') => {
  const { error } = await supabase.from('class_schedules').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

// ── Student submits an activity ──
export const submitStudentActivity = async (id, submission_note = '', studentId, submission_file_url = null) => {
  const { data, error } = await supabase
    .from('student_activities')
    .update({ status: 'submitted', submission_note, submission_file_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('student_id', studentId)
    .select()
    .single()
  if (error) throw error
  return { data }
}

// ── Get subjects handled by an adviser (from curriculum_deployments) ──
export const getAdviserSubjects = async (employeeId) => {
  const { data: assignments } = await getAssignmentsByEmployee(employeeId)
  if (!assignments?.length) return { data: [] }
  const studentIds = assignments.map(a => a.student_id)
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .select('subject_code, subject_desc, units, semester, year_level')
    .in('student_id', studentIds)
    .order('year_level').order('subject_code')
  if (error) throw error
  // Deduplicate by subject_code
  const seen = new Set()
  const unique = (data || []).filter(d => { if (seen.has(d.subject_code)) return false; seen.add(d.subject_code); return true })
  return { data: unique }
}

// ── Assign adviser to a specific subject in curriculum_deployments ──
export const assignAdviserToSubject = async (studentId, subjectCode, adviserId, actorName = 'Admin') => {
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .update({ adviser_id: adviserId, updated_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('subject_code', subjectCode)
    .select()
  if (error) throw error
  await logActivity({ actor_type: 'admin', actor_id: 'admin', actor_name: actorName, action: `Assigned adviser to ${subjectCode}`, entity_type: 'curriculum_deployment', entity_id: studentId, details: { subject_code: subjectCode, adviser_id: adviserId } })
  return { data }
}

// ── Get curriculum deployments with adviser info for a student ──
export const getStudentDeploymentsWithAdvisers = async (studentId) => {
  const { data, error } = await supabase
    .from('curriculum_deployments')
    .select('*, employees(id,employee_id,first_name,last_name)')
    .eq('student_id', studentId)
    .order('year_level').order('semester').order('subject_code')
  if (error) throw error
  return { data }
}
