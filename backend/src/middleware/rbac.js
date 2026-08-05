// RBAC middleware — checks if the authenticated user has the required permission
// Usage: router.get('/finance', requirePermission('finance', 'view'), handler)

export function requirePermission(module, permission = 'view') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })

    // Admin bypass — admin role has all permissions
    const isAdmin = req.user.userRoles?.some(
      (ur) => ur.role.key === 'admin'
    )
    if (isAdmin) return next()

    // Check if user's roles grant the required permission on the module
    const hasPermission = req.user.userRoles?.some((ur) =>
      ur.role.rolePerms?.some(
        (rp) => rp.module === module && rp.permission.key === permission
      )
    )

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You need '${permission}' permission on '${module}'`,
      })
    }
    next()
  }
}

// Helper to check permission without middleware (for use in routes)
export function userCan(user, module, permission = 'view') {
  if (!user) return false
  const isAdmin = user.userRoles?.some((ur) => ur.role.key === 'admin')
  if (isAdmin) return true
  return user.userRoles?.some((ur) =>
    ur.role.rolePerms?.some(
      (rp) => rp.module === module && rp.permission.key === permission
    )
  )
}

// Get all modules the user can access (for sidebar filtering)
export function userAccessibleModules(user) {
  if (!user) return []
  const isAdmin = user.userRoles?.some((ur) => ur.role.key === 'admin')
  if (isAdmin) return null // null = all modules
  const modules = new Set()
  user.userRoles?.forEach((ur) => {
    ur.role.rolePerms?.forEach((rp) => {
      if (rp.permission.key === 'view') modules.add(rp.module)
    })
  })
  return [...modules]
}
