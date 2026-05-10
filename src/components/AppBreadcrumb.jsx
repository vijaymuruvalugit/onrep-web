import React from 'react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { routes } from '../routes'
import { getRoleRedirectPath } from '../features/auth/utils/roleRedirect'
import { selectActiveActivity } from '../features/workspace/slices/workspaceSlice'
import { useCoachLikeRole } from '../features/workspace/hooks/useCoachLikeRole'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname
  const user = useSelector((state) => state.auth.user)
  const coachLike = useCoachLikeRole(user)
  const activeActivity = useSelector(selectActiveActivity)
  const selectedStudent = useSelector((state) => state.students?.selectedStudent)
  const selectedPlace = useSelector((state) => state.places?.selectedPlace)
  const homeTo = getRoleRedirectPath(user)

  const getRouteMeta = (pathname, routeList) => {
    const exactMatch = routeList.find((route) => route.path === pathname)
    if (exactMatch) return exactMatch

    return (
      routeList.find((route) =>
        matchPath(
          {
            path: route.path,
            end: true,
          },
          pathname,
        ),
      ) || null
    )
  }

  const getRouteName = (routeMeta, pathname) => {
    if (!routeMeta) return false
    if (routeMeta.path === '/coach/students/:studentId') {
      return selectedStudent?.full_name || routeMeta.name
    }
    if (routeMeta.path === '/coach/students/:studentId/edit') {
      return 'Edit'
    }
    if (routeMeta.path === '/coach/places/:placeId') {
      return selectedPlace?.name || routeMeta.name
    }
    if (routeMeta.path === '/coach/places/:placeId/edit') {
      return selectedPlace?.name ? `Edit: ${selectedPlace.name}` : routeMeta.name
    }
    return routeMeta.name
  }

  const getBreadcrumbs = (location) => {
    const hiddenRootPaths = new Set(['/coach', '/parent', '/student'])
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeMeta = getRouteMeta(currentPathname, routes)
      const routeName = getRouteName(routeMeta, currentPathname)
      routeName &&
        !hiddenRootPaths.has(currentPathname) &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem>
        <NavLink to={homeTo} end>
          Home
        </NavLink>
      </CBreadcrumbItem>
      {coachLike && activeActivity?.name ? (
        <CBreadcrumbItem {...(breadcrumbs.length === 0 ? { active: true } : {})}>
          {activeActivity.name}
        </CBreadcrumbItem>
      ) : null}
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem {...(breadcrumb.active ? { active: true } : {})} key={index}>
            {breadcrumb.active ? (
              breadcrumb.name
            ) : (
              <NavLink to={breadcrumb.pathname}>{breadcrumb.name}</NavLink>
            )}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
