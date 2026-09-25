import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULES,
  PERMISSIONS,
  ROLE_DEFINITIONS,
  STAFF_ROLES,
  getRoleKey,
  getRoleDef,
  can,
  canAccess,
} from '../frontend/src/store/permissions.js'
import { staffSeed } from '../frontend/src/store/data.js'

describe('permissions.js - RBAC Permission Matrix Suite', () => {
  describe('Constants and definitions', () => {
    test('MODULES includes all 18 enterprise system modules', () => {
      assert.equal(MODULES.length, 18)
      assert.ok(MODULES.includes('dashboard'))
      assert.ok(MODULES.includes('reports'))
      assert.ok(MODULES.includes('crm'))
      assert.ok(MODULES.includes('events'))
      assert.ok(MODULES.includes('projects'))
      assert.ok(MODULES.includes('venues'))
      assert.ok(MODULES.includes('resources'))
      assert.ok(MODULES.includes('vendors'))
      assert.ok(MODULES.includes('staff'))
      assert.ok(MODULES.includes('finance'))
      assert.ok(MODULES.includes('ticketing'))
      assert.ok(MODULES.includes('checkin'))
      assert.ok(MODULES.includes('speakers'))
      assert.ok(MODULES.includes('exhibition'))
      assert.ok(MODULES.includes('sponsorship'))
      assert.ok(MODULES.includes('marketing'))
      assert.ok(MODULES.includes('operations'))
      assert.ok(MODULES.includes('admin'))
    })

    test('PERMISSIONS defines all 9 granular action types', () => {
      assert.equal(PERMISSIONS.length, 9)
      const expected = ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'export', 'print', 'manage']
      for (const p of expected) {
        assert.ok(PERMISSIONS.includes(p))
      }
    })

    test('ROLE_DEFINITIONS defines all 5 roles with labels and descriptions', () => {
      const roles = ['admin', 'manager', 'operations', 'finance', 'marketing']
      for (const r of roles) {
        assert.ok(ROLE_DEFINITIONS[r])
        assert.ok(typeof ROLE_DEFINITIONS[r].label === 'string')
        assert.ok(typeof ROLE_DEFINITIONS[r].description === 'string')
        assert.ok(typeof ROLE_DEFINITIONS[r].modules === 'object')
      }
    })

    test('admin role definition has all permissions on all 18 modules', () => {
      const adminMods = ROLE_DEFINITIONS.admin.modules
      for (const mod of MODULES) {
        assert.ok(adminMods[mod], `admin has module ${mod}`)
        for (const p of PERMISSIONS) {
          assert.equal(adminMods[mod][p], true, `admin has ${p} on ${mod}`)
        }
      }
    })

    test('STAFF_ROLES maps seed staff IDs to their designated roles', () => {
      assert.equal(STAFF_ROLES.st1, 'admin')
      assert.equal(STAFF_ROLES.st2, 'manager')
      assert.equal(STAFF_ROLES.st3, 'manager')
      assert.equal(STAFF_ROLES.st4, 'finance')
      assert.equal(STAFF_ROLES.st5, 'operations')
      assert.equal(STAFF_ROLES.st6, 'operations')
      assert.equal(STAFF_ROLES.st7, 'marketing')
      assert.equal(STAFF_ROLES.st8, 'operations')
    })
  })

  describe('getRoleKey & getRoleDef', () => {
    test('returns correct role key for mapped staff members', () => {
      assert.equal(getRoleKey('st1', staffSeed), 'admin')
      assert.equal(getRoleKey('st2', staffSeed), 'manager')
      assert.equal(getRoleKey('st4', staffSeed), 'finance')
      assert.equal(getRoleKey('st5', staffSeed), 'operations')
      assert.equal(getRoleKey('st7', staffSeed), 'marketing')
    })

    test('defaults to manager for existing staff member with unmapped role key', () => {
      const customStaff = [...staffSeed, { id: 'st99', name: 'New Staff' }]
      assert.equal(getRoleKey('st99', customStaff), 'manager')
    })

    test('returns null when userId is not found in staff list', () => {
      assert.equal(getRoleKey('unknown-id', staffSeed), null)
      assert.equal(getRoleKey('st1', []), null)
    })

    test('getRoleDef returns matching role definition object', () => {
      const def = getRoleDef('st1', staffSeed)
      assert.equal(def.label, 'Administrator')

      const finDef = getRoleDef('st4', staffSeed)
      assert.equal(finDef.label, 'Finance')
    })

    test('getRoleDef returns null for invalid user id', () => {
      assert.equal(getRoleDef('nonexistent', staffSeed), null)
    })
  })

  describe('can() & canAccess() - Role-Based Access Control', () => {
    describe('Admin role (st1)', () => {
      test('admin has view, create, edit, delete, manage permissions on all core modules', () => {
        const modulesToTest = ['events', 'finance', 'admin', 'venues', 'staff', 'crm', 'ticketing']
        for (const mod of modulesToTest) {
          assert.equal(can('st1', staffSeed, mod, 'view'), true)
          assert.equal(can('st1', staffSeed, mod, 'create'), true)
          assert.equal(can('st1', staffSeed, mod, 'edit'), true)
          assert.equal(can('st1', staffSeed, mod, 'delete'), true)
          assert.equal(can('st1', staffSeed, mod, 'manage'), true)
          assert.equal(canAccess('st1', staffSeed, mod), true)
        }
      })
    })

    describe('Manager role (st2, st3)', () => {
      test('manager can view, create, edit, delete, and assign events', () => {
        assert.equal(can('st2', staffSeed, 'events', 'view'), true)
        assert.equal(can('st2', staffSeed, 'events', 'create'), true)
        assert.equal(can('st2', staffSeed, 'events', 'edit'), true)
        assert.equal(can('st2', staffSeed, 'events', 'delete'), true)
        assert.equal(can('st2', staffSeed, 'events', 'assign'), true)
      })

      test('manager can manage ticketing and check-in', () => {
        assert.equal(can('st2', staffSeed, 'ticketing', 'view'), true)
        assert.equal(can('st2', staffSeed, 'ticketing', 'manage'), true)
        assert.equal(can('st2', staffSeed, 'checkin', 'view'), true)
        assert.equal(can('st2', staffSeed, 'checkin', 'create'), true)
      })

      test('manager can manage speakers, exhibition, and sponsorship', () => {
        assert.equal(can('st2', staffSeed, 'speakers', 'manage'), true)
        assert.equal(can('st2', staffSeed, 'exhibition', 'manage'), true)
        assert.equal(can('st2', staffSeed, 'sponsorship', 'manage'), true)
      })

      test('manager CANNOT access finance or admin modules', () => {
        assert.equal(can('st2', staffSeed, 'finance', 'view'), false)
        assert.equal(can('st2', staffSeed, 'finance', 'create'), false)
        assert.equal(can('st2', staffSeed, 'admin', 'view'), false)
        assert.equal(canAccess('st2', staffSeed, 'finance'), false)
      })

      test('manager CANNOT view reports or marketing modules', () => {
        assert.equal(can('st2', staffSeed, 'reports', 'view'), false)
        assert.equal(can('st2', staffSeed, 'marketing', 'view'), false)
      })
    })

    describe('Operations role (st5, st6, st8)', () => {
      test('operations can view dashboard and view/manage operations module', () => {
        assert.equal(can('st5', staffSeed, 'dashboard', 'view'), true)
        assert.equal(can('st5', staffSeed, 'operations', 'view'), true)
        assert.equal(can('st5', staffSeed, 'operations', 'create'), true)
        assert.equal(can('st5', staffSeed, 'operations', 'edit'), true)
        assert.equal(can('st5', staffSeed, 'operations', 'manage'), true)
      })

      test('operations can view and export reports', () => {
        assert.equal(can('st5', staffSeed, 'reports', 'view'), true)
        assert.equal(can('st5', staffSeed, 'reports', 'export'), true)
      })

      test('operations CANNOT access events, projects, venues, or staff', () => {
        assert.equal(can('st5', staffSeed, 'events', 'view'), false)
        assert.equal(can('st5', staffSeed, 'projects', 'view'), false)
        assert.equal(can('st5', staffSeed, 'venues', 'view'), false)
        assert.equal(can('st5', staffSeed, 'staff', 'view'), false)
      })

      test('operations CANNOT access finance or admin modules', () => {
        assert.equal(can('st5', staffSeed, 'finance', 'view'), false)
        assert.equal(can('st5', staffSeed, 'admin', 'view'), false)
      })
    })

    describe('Finance role (st4)', () => {
      test('finance can view, create, edit, approve, export, print, and manage finance', () => {
        assert.equal(can('st4', staffSeed, 'finance', 'view'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'create'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'edit'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'approve'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'export'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'print'), true)
        assert.equal(can('st4', staffSeed, 'finance', 'manage'), true)
      })

      test('finance can view and edit vendors', () => {
        assert.equal(can('st4', staffSeed, 'vendors', 'view'), true)
        assert.equal(can('st4', staffSeed, 'vendors', 'edit'), true)
        assert.equal(can('st4', staffSeed, 'vendors', 'delete'), false)
      })

      test('finance can view, export, and print reports', () => {
        assert.equal(can('st4', staffSeed, 'reports', 'view'), true)
        assert.equal(can('st4', staffSeed, 'reports', 'export'), true)
        assert.equal(can('st4', staffSeed, 'reports', 'print'), true)
      })

      test('finance CANNOT access events, ticketing, checkin, or crm', () => {
        assert.equal(can('st4', staffSeed, 'events', 'view'), false)
        assert.equal(can('st4', staffSeed, 'ticketing', 'view'), false)
        assert.equal(can('st4', staffSeed, 'checkin', 'view'), false)
        assert.equal(can('st4', staffSeed, 'crm', 'view'), false)
      })
    })

    describe('Marketing role (st7)', () => {
      test('marketing can view and edit CRM', () => {
        assert.equal(can('st7', staffSeed, 'crm', 'view'), true)
        assert.equal(can('st7', staffSeed, 'crm', 'edit'), true)
        assert.equal(can('st7', staffSeed, 'crm', 'delete'), false)
      })

      test('marketing has full sponsorship and marketing management permissions', () => {
        assert.equal(can('st7', staffSeed, 'marketing', 'view'), true)
        assert.equal(can('st7', staffSeed, 'marketing', 'create'), true)
        assert.equal(can('st7', staffSeed, 'marketing', 'edit'), true)
        assert.equal(can('st7', staffSeed, 'marketing', 'delete'), true)
        assert.equal(can('st7', staffSeed, 'marketing', 'export'), true)
        assert.equal(can('st7', staffSeed, 'marketing', 'manage'), true)

        assert.equal(can('st7', staffSeed, 'sponsorship', 'manage'), true)
      })

      test('marketing CANNOT access finance, venues, resources, or admin', () => {
        assert.equal(can('st7', staffSeed, 'finance', 'view'), false)
        assert.equal(can('st7', staffSeed, 'venues', 'view'), false)
        assert.equal(can('st7', staffSeed, 'resources', 'view'), false)
        assert.equal(can('st7', staffSeed, 'admin', 'view'), false)
      })
    })

    describe('Edge cases and defaults', () => {
      test('returns false for unknown staff id', () => {
        assert.equal(can('ghost-user', staffSeed, 'dashboard', 'view'), false)
        assert.equal(canAccess('ghost-user', staffSeed, 'dashboard'), false)
      })

      test('returns false for invalid module name', () => {
        assert.equal(can('st2', staffSeed, 'unknown-module', 'view'), false)
      })

      test('defaults permission parameter to view', () => {
        assert.equal(can('st2', staffSeed, 'events'), true)
        assert.equal(can('st2', staffSeed, 'finance'), false)
      })
    })
  })
})
