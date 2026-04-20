import axios from 'axios'

// Uses Render API in production, local proxy in development
const BASE_URL = import.meta.env.VITE_API_URL || ''
const BASE = `${BASE_URL}/api/students`

export const getStudents = (params = {}) => axios.get(BASE, { params })
export const getStudent = (id) => axios.get(`${BASE}/${id}`)
export const createStudent = (data) => axios.post(BASE, data)
export const updateStudent = (id, data) => axios.put(`${BASE}/${id}`, data)
export const deleteStudent = (id) => axios.delete(`${BASE}/${id}`)
