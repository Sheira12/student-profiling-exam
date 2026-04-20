import { supabase } from '../lib/supabase'

export const getStudents = async (params = {}) => {
  let query = supabase.from('students').select('*')
  
  // Add comprehensive search functionality
  if (params.search) {
    const searchTerm = params.search.trim()
    
    try {
      // First try with array field search using proper PostgreSQL array operators
      query = query.or(`
        first_name.ilike.%${searchTerm}%,
        last_name.ilike.%${searchTerm}%,
        student_id.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        course.ilike.%${searchTerm}%,
        phone.ilike.%${searchTerm}%,
        address.ilike.%${searchTerm}%
      `.replace(/\s+/g, ''))
      
      const { data: basicResults, error: basicError } = await query.order('created_at', { ascending: false })
      
      if (basicError) throw basicError
      
      // For array fields, we need to do client-side filtering since Supabase array search is tricky
      const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (allError) throw allError
      
      // Client-side array field search
      const arrayFieldResults = allStudents.filter(student => {
        const searchLower = searchTerm.toLowerCase()
        
        // Check array fields
        const skillsMatch = student.skills?.some(skill => 
          skill.toLowerCase().includes(searchLower)
        )
        const awardsMatch = student.academic_awards?.some(award => 
          award.toLowerCase().includes(searchLower)
        )
        const activitiesMatch = student.non_academic_activities?.some(activity => 
          activity.toLowerCase().includes(searchLower)
        )
        const violationsMatch = student.violations?.some(violation => 
          violation.toLowerCase().includes(searchLower)
        )
        const affiliationsMatch = student.affiliations?.some(affiliation => 
          affiliation.toLowerCase().includes(searchLower)
        )
        
        return skillsMatch || awardsMatch || activitiesMatch || violationsMatch || affiliationsMatch
      })
      
      // Combine results and remove duplicates
      const combinedResults = [...basicResults]
      arrayFieldResults.forEach(student => {
        if (!combinedResults.find(existing => existing.id === student.id)) {
          combinedResults.push(student)
        }
      })
      
      return { data: combinedResults }
      
    } catch (error) {
      console.error('Search error:', error)
      // Fallback to basic search only
      query = supabase.from('students').select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,course.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
      
      const { data: fallbackData, error: fallbackError } = await query
      if (fallbackError) throw fallbackError
      return { data: fallbackData }
    }
  }
  
  // Add filtering by specific fields if provided
  if (params.course) {
    query = query.ilike('course', `%${params.course}%`)
  }
  
  if (params.year_level) {
    query = query.eq('year_level', params.year_level)
  }
  
  if (params.gender) {
    query = query.ilike('gender', params.gender)
  }
  
  // Add ordering
  query = query.order('created_at', { ascending: false })
  
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