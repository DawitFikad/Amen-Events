// Permission classification — 5 roles × 17 modules × 9 permissions
// Roles: admin, manager, operations, finance, marketing

export const MODULES = [
  'dashboard', 'reports', 'crm', 'events', 'projects',
  'venues', 'resources', 'vendors', 'staff', 'finance',
  'ticketing', 'checkin', 'speakers', 'exhibition', 'sponsorship',
  'marketing', 'admin',
]

export const PERMISSIONS = [
  'view', 'create', 'edit', 'delete', 'approve', 'assign', 'export', 'print', 'manage',
]

const all = () => PERMISSIONS.reduce((a, p) => { a[p] = true; return a }, {})
const perms = (...list) => list.reduce((a, p) => { a[p] = true; return a }, {})
const none = () => ({})

export const ROLE_DEFINITIONS = {
  admin: {
    label: 'Administrator',
    description: 'Full system access including settings & security.',
    modules: MODULES.reduce((acc, m) => { acc[m] = all(); return acc }, {}),
  },

  // Event Manager — event execution only + own settings
  manager: {
    label: 'Event Manager',
    description: 'Plan, assign & run events, tasks, speakers & exhibition.',
    modules: {
      dashboard: perms('view'),
      reports: none(),
      crm: none(),
      events: perms('view', 'create', 'edit', 'delete', 'assign'),
      projects: perms('view', 'create', 'edit', 'delete', 'assign'),
      venues: none(),
      resources: none(),
      vendors: none(),
      staff: none(),
      finance: none(),
      ticketing: perms('view', 'create', 'edit', 'manage'),
      checkin: perms('view', 'create'),
      speakers: perms('view', 'create', 'edit', 'assign', 'manage'),
      exhibition: perms('view', 'create', 'edit', 'manage'),
      sponsorship: none(),
      marketing: none(),
      admin: none(),
    },
  },

  // Operations — logistics only: venues, resources, vendors
  operations: {
    label: 'Operations',
    description: 'Venues, resources, vendors & event logistics.',
    modules: {
      dashboard: perms('view'),
      reports: perms('view', 'export'),
      crm: none(),
      events: perms('view', 'edit', 'assign'),
      projects: perms('view', 'create', 'edit', 'assign'),
      venues: perms('view', 'create', 'edit', 'manage'),
      resources: perms('view', 'create', 'edit', 'delete', 'assign', 'manage'),
      vendors: perms('view', 'create', 'edit', 'assign'),
      staff: perms('view', 'assign'),
      finance: none(),
      ticketing: none(),
      checkin: none(),
      speakers: none(),
      exhibition: none(),
      sponsorship: none(),
      marketing: none(),
      admin: none(),
    },
  },

  // Finance — money only: finance module, reports, client info for invoicing
  finance: {
    label: 'Finance',
    description: 'Budgets, expenses, revenue, invoices & payments.',
    modules: {
      dashboard: perms('view'),
      reports: perms('view', 'export', 'print'),
      crm: perms('view'),
      events: perms('view'),
      projects: none(),
      venues: none(),
      resources: none(),
      vendors: perms('view', 'edit'),
      staff: none(),
      finance: perms('view', 'create', 'edit', 'approve', 'export', 'print', 'manage'),
      ticketing: none(),
      checkin: none(),
      speakers: none(),
      exhibition: none(),
      sponsorship: perms('view'),
      marketing: none(),
      admin: none(),
    },
  },

  // Marketing — promotions only: campaigns, sponsors, tickets
  marketing: {
    label: 'Marketing',
    description: 'Campaigns, sponsors, tickets & promotions.',
    modules: {
      dashboard: perms('view'),
      reports: perms('view', 'export'),
      crm: perms('view', 'edit'),
      events: perms('view'),
      projects: none(),
      venues: none(),
      resources: none(),
      vendors: none(),
      staff: none(),
      finance: none(),
      ticketing: perms('view', 'create', 'edit', 'delete', 'export', 'manage'),
      checkin: perms('view'),
      speakers: none(),
      exhibition: none(),
      sponsorship: perms('view', 'create', 'edit', 'delete', 'manage'),
      marketing: perms('view', 'create', 'edit', 'delete', 'export', 'manage'),
      admin: none(),
    },
  },
}

export const STAFF_ROLES = {
  st1: 'admin',
  st2: 'manager',
  st3: 'manager',
  st4: 'finance',
  st5: 'operations',
  st6: 'operations',
  st7: 'marketing',
  st8: 'operations',
}

export function getRoleKey(userId, staff) {
  const member = staff.find((s) => s.id === userId)
  if (!member) return null
  return STAFF_ROLES[member.id] || 'manager'
}

export function getRoleDef(userId, staff) {
  const key = getRoleKey(userId, staff)
  return key ? ROLE_DEFINITIONS[key] : null
}

export function can(userId, staff, module, permission = 'view') {
  const key = getRoleKey(userId, staff)
  if (!key) return false
  const def = ROLE_DEFINITIONS[key]
  if (!def) return false
  if (key === 'admin') return true
  const modPerms = def.modules[module]
  if (!modPerms) return false
  return !!modPerms[permission]
}

export function canAccess(userId, staff, module) {
  return can(userId, staff, module, 'view')
}
