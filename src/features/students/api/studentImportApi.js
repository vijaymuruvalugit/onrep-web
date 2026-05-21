import http from '../../../api/http'

const ACCEPT = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'

export const studentImportApi = {
  async downloadTemplate() {
    const response = await http.get('/student-import/template', {
      responseType: 'blob',
    })
    return response.data
  },

  async previewImport(file) {
    const form = new FormData()
    form.append('file', file, file.name || 'students.xlsx')
    const { data } = await http.post('/student-import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data || {}
  },

  async executeImport(importToken) {
    const { data } = await http.post('/student-import/execute', {
      import_token: importToken,
    })
    return data || {}
  },
}

export { ACCEPT as STUDENT_IMPORT_ACCEPT }

export default studentImportApi
