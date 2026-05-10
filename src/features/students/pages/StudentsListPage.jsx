import React, { useEffect, useMemo } from 'react'
import { CAlert, CCard, CCardBody, CPagination, CPaginationItem } from '@coreui/react'
import { useStudents } from '../hooks/useStudents'
import StudentsFilters from '../components/StudentsFilters'
import StudentsTable from '../components/StudentsTable'

const CLIENT_FILTER_LIMIT = 200

const StudentsListPage = () => {
  const {
    items,
    filters,
    pagination,
    listLoading,
    listError,
    fetchStudents: loadStudents,
    setFilters,
    setPage,
  } = useStudents()

  useEffect(() => {
    loadStudents({
      search: filters.search || undefined,
      status: filters.status || undefined,
      activity: filters.activity || undefined,
      batch: filters.batch || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
  }, [loadStudents, filters, pagination.page, pagination.pageSize])

  const activityOptions = useMemo(() => {
    const values = new Set()
    items.forEach((student) => {
      if (student.group_name) values.add(student.group_name)
      if (student.activity_name) values.add(student.activity_name)
    })
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [items])

  const filteredItems = useMemo(() => {
    if (pagination.hasServerPagination) return items
    if (items.length > CLIENT_FILTER_LIMIT) return items
    const search = filters.search.trim().toLowerCase()
    return items.filter((student) => {
      const bySearch =
        !search ||
        String(student.full_name || '')
          .toLowerCase()
          .includes(search) ||
        String(student.parent_guardian_name || '')
          .toLowerCase()
          .includes(search)
      const byStatus =
        !filters.status || String(student.status || '').toLowerCase() === filters.status
      const byActivity =
        !filters.activity ||
        student.group_name === filters.activity ||
        student.activity_name === filters.activity
      return bySearch && byStatus && byActivity
    })
  }, [items, filters, pagination.hasServerPagination])

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters)
  }

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', activity: '', batch: '' })
  }

  const totalPages = Math.max(1, pagination.totalPages || 1)
  const page = Math.min(Math.max(1, pagination.page), totalPages)

  return (
    <>
      {items.length > CLIENT_FILTER_LIMIT && !pagination.hasServerPagination ? (
        <CAlert color="warning">
          Large dataset detected. Search and filter are delegated to backend parameters when
          available.
        </CAlert>
      ) : null}

      <StudentsFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        activityOptions={activityOptions}
        disabled={listLoading}
      />

      <StudentsTable
        students={filteredItems}
        loading={listLoading}
        error={listError}
        onRetry={() =>
          loadStudents({
            search: filters.search || undefined,
            status: filters.status || undefined,
            activity: filters.activity || undefined,
            batch: filters.batch || undefined,
            page,
            pageSize: pagination.pageSize,
          })
        }
        canRetry
      />

      <CCard className="mt-3">
        <CCardBody className="d-flex justify-content-between align-items-center">
          <div className="small text-body-secondary">
            Page {page} of {totalPages}
          </div>
          <CPagination className="mb-0" align="end">
            <CPaginationItem disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </CPaginationItem>
            <CPaginationItem active>{page}</CPaginationItem>
            <CPaginationItem disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </CPaginationItem>
          </CPagination>
        </CCardBody>
      </CCard>
    </>
  )
}

export default StudentsListPage
