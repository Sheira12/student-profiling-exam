import React from 'react'

const EnvCheck = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      background: '#f5f5f5', 
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h3>🔍 Environment Variables Check</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>VITE_SUPABASE_URL:</strong>
        <div style={{ 
          background: supabaseUrl ? '#d4edda' : '#f8d7da', 
          padding: '8px', 
          borderRadius: '4px',
          color: supabaseUrl ? '#155724' : '#721c24',
          marginTop: '5px'
        }}>
          {supabaseUrl ? `✅ ${supabaseUrl}` : '❌ NOT SET'}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>VITE_SUPABASE_ANON_KEY:</strong>
        <div style={{ 
          background: supabaseKey ? '#d4edda' : '#f8d7da', 
          padding: '8px', 
          borderRadius: '4px',
          color: supabaseKey ? '#155724' : '#721c24',
          marginTop: '5px'
        }}>
          {supabaseKey ? `✅ Set (${supabaseKey.length} characters)` : '❌ NOT SET'}
        </div>
      </div>

      <div style={{ 
        background: (supabaseUrl && supabaseKey) ? '#d1ecf1' : '#fff3cd',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid ' + ((supabaseUrl && supabaseKey) ? '#bee5eb' : '#ffeaa7')
      }}>
        <strong>Status:</strong> {
          (supabaseUrl && supabaseKey) 
            ? '✅ Environment variables are properly configured!' 
            : '⚠️ Missing environment variables - check Vercel settings'
        }
      </div>

      {(!supabaseUrl || !supabaseKey) && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: '#fff3cd', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Fix this by:</strong>
          <ol>
            <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
            <li>Add: <code>VITE_SUPABASE_URL</code> = <code>https://gwoavpapmbtxwoiizjbd.supabase.co</code></li>
            <li>Add: <code>VITE_SUPABASE_ANON_KEY</code> = <code>your-anon-key</code></li>
            <li>Redeploy your project</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default EnvCheck