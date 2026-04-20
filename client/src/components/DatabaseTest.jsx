import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DatabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [tableExists, setTableExists] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic connection
      console.log('Testing Supabase connection...')
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      // Test if we can connect to Supabase
      const { data: healthCheck, error: healthError } = await supabase
        .from('students')
        .select('count', { count: 'exact', head: true })
      
      if (healthError) {
        console.error('Connection error:', healthError)
        setError(healthError.message)
        setConnectionStatus('Failed')
        return
      }
      
      setConnectionStatus('Connected')
      setTableExists(true)
      setStudentCount(healthCheck || 0)
      
      // Try to get actual data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .limit(5)
      
      if (studentsError) {
        console.error('Data fetch error:', studentsError)
        setError(studentsError.message)
      } else {
        console.log('Sample students:', students)
        setStudentCount(students?.length || 0)
      }
      
    } catch (err) {
      console.error('Test failed:', err)
      setError(err.message)
      setConnectionStatus('Failed')
    }
  }

  const createTable = async () => {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS students (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id text NOT NULL UNIQUE,
            first_name text NOT NULL,
            last_name text NOT NULL,
            email text,
            phone text,
            address text,
            date_of_birth date,
            gender text,
            course text,
            year_level integer,
            gpa numeric(3,2),
            academic_awards text[],
            skills text[],
            non_academic_activities text[],
            violations text[],
            affiliations text[],
            academic_progress jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
          );
          
          ALTER TABLE students ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Allow all" ON students FOR ALL USING (true);
        `
      })
      
      if (error) {
        console.error('Table creation error:', error)
        setError(error.message)
      } else {
        console.log('Table created successfully')
        testConnection()
      }
    } catch (err) {
      console.error('Create table failed:', err)
      setError(err.message)
    }
  }

  const addSampleData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            student_id: '2021-00001',
            first_name: 'Juan',
            last_name: 'Dela Cruz',
            email: 'juan.delacruz@email.com',
            phone: '+63-912-345-6789',
            address: '123 Main St, Cabuyao, Laguna',
            date_of_birth: '2000-05-15',
            gender: 'Male',
            course: 'Bachelor of Science in Computer Science',
            year_level: 3,
            gpa: 3.25
          },
          {
            student_id: '2021-00002',
            first_name: 'Maria',
            last_name: 'Santos',
            email: 'maria.santos@email.com',
            phone: '+63-917-123-4567',
            address: '456 Oak Ave, Cabuyao, Laguna',
            date_of_birth: '2001-08-22',
            gender: 'Female',
            course: 'Bachelor of Science in Information Technology',
            year_level: 2,
            gpa: 3.75
          }
        ])
      
      if (error) {
        console.error('Sample data error:', error)
        setError(error.message)
      } else {
        console.log('Sample data added:', data)
        testConnection()
      }
    } catch (err) {
      console.error('Add sample data failed:', err)
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Database Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Status: {connectionStatus}</h3>
        <p>Table Exists: {tableExists ? 'Yes' : 'No'}</p>
        <p>Student Count: {studentCount}</p>
        {error && (
          <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '4px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testConnection} style={{ padding: '10px 20px' }}>
          Test Connection
        </button>
        <button onClick={createTable} style={{ padding: '10px 20px' }}>
          Create Table
        </button>
        <button onClick={addSampleData} style={{ padding: '10px 20px' }}>
          Add Sample Data
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        <h4>Environment Variables:</h4>
        <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
        <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  )
}

export default DatabaseTest