import { supabase } from '../lib/supabase'

export const getStudents = async (params = {}) => {
  let query = supabase.from('students').select('*')
  
  // Add search functionality if needed
  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,student_id.ilike.%${params.search}%`)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return { data }
}

export const getStudent = async (id) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return { data }
}

export const createStudent = async (studentData) => {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single()
  
  if (error) throw error
  return { data }
}

export const updateStudent = async (id, studentData) => {
  const { data, error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return { data }
}

export const deleteStudent = async (id) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return { success: true }
}