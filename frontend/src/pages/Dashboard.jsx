import React from 'react'
import { useData } from '../store/DataContext'
import AdminDashboard from './dashboards/AdminDashboard'
import ManagerDashboard from './dashboards/ManagerDashboard'
import FinanceDashboard from './dashboards/FinanceDashboard'
import MarketingDashboard from './dashboards/MarketingDashboard'
import OperationsDashboard from './dashboards/OperationsDashboard'

import { SkeletonDashboard } from '../components/ui'

export default function Dashboard() {
  const { rbac, loading } = useData()
  if (loading) return <SkeletonDashboard />
  const roleKey = rbac?.roleKey

  switch (roleKey) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'finance':
      return <FinanceDashboard />
    case 'marketing':
      return <MarketingDashboard />
    case 'operations':
      return <OperationsDashboard />
    default:
      return <ManagerDashboard />
  }
}