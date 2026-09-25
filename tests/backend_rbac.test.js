import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  requirePermission,
  userCan,
  userAccessibleModules,
} from '../backend/src/middleware/rbac.js'

describe('backend/rbac.js - Backend RBAC Middleware Suite', () => {
  const adminUser = {
    id: 'u-admin',
    userRoles: [
      {
        role: {
          key: 'admin',
          rolePerms: [],
        },
      },
    ],
  }

  const managerUser = {
    id: 'u-mgr',
    userRoles: [
      {
        role: {
          key: 'manager',
          rolePerms: [
            { module: 'events', permission: { key: 'view' } },
            { module: 'events', permission: { key: 'create' } },
            { module: 'events', permission: { key: 'edit' } },
            { module: 'ticketing', permission: { key: 'view' } },
          ],
        },
      },
    ],
  }

  const multiRoleUser = {
    id: 'u-multi',
    userRoles: [
      {
        role: {
          key: 'operations',
          rolePerms: [
            { module: 'operations', permission: { key: 'view' } },
            { module: 'reports', permission: { key: 'view' } },
          ],
        },
      },
      {
        role: {
          key: 'support',
          rolePerms: [
            { module: 'reports', permission: { key: 'view' } },
            { module: 'crm', permission: { key: 'view' } },
            { module: 'finance', permission: { key: 'export' } }, // no 'view'
          ],
        },
      },
    ],
  }

  describe('userCan()', () => {
    test('returns false when user is null or undefined', () => {
      assert.equal(userCan(null, 'events', 'view'), false)
      assert.equal(userCan(undefined, 'events', 'view'), false)
    })

    test('returns false when user has empty or undefined userRoles', () => {
      assert.equal(userCan({ id: 'u-empty', userRoles: [] }, 'events', 'view'), false)
      assert.equal(userCan({ id: 'u-noroles' }, 'events', 'view'), false)
    })

    test('returns true for admin user on ANY module and ANY permission', () => {
      assert.equal(userCan(adminUser, 'events', 'delete'), true)
      assert.equal(userCan(adminUser, 'finance', 'approve'), true)
      assert.equal(userCan(adminUser, 'admin', 'manage'), true)
    })

    test('returns true when user role contains matching module and permission', () => {
      assert.equal(userCan(managerUser, 'events', 'view'), true)
      assert.equal(userCan(managerUser, 'events', 'create'), true)
      assert.equal(userCan(managerUser, 'ticketing', 'view'), true)
    })

    test('returns false when user has module access but lacks the specific permission', () => {
      assert.equal(userCan(managerUser, 'events', 'delete'), false)
      assert.equal(userCan(managerUser, 'ticketing', 'manage'), false)
    })

    test('returns false when user has no access to the requested module', () => {
      assert.equal(userCan(managerUser, 'finance', 'view'), false)
      assert.equal(userCan(managerUser, 'admin', 'view'), false)
    })

    test('defaults permission to view when omitted', () => {
      assert.equal(userCan(managerUser, 'events'), true)
      assert.equal(userCan(managerUser, 'finance'), false)
    })
  })

  describe('userAccessibleModules()', () => {
    test('returns empty array [] for null or undefined user', () => {
      assert.deepEqual(userAccessibleModules(null), [])
      assert.deepEqual(userAccessibleModules(undefined), [])
    })

    test('returns null for admin user (signaling full system access)', () => {
      assert.equal(userAccessibleModules(adminUser), null)
    })

    test('returns distinct list of modules where user has "view" permission', () => {
      const modules = userAccessibleModules(managerUser)
      assert.deepEqual(modules.sort(), ['events', 'ticketing'].sort())
    })

    test('deduplicates modules across multiple roles and ignores non-view permissions', () => {
      const modules = userAccessibleModules(multiRoleUser)
      // 'reports' appears in both roles; 'finance' only has 'export', so shouldn't be in view list
      assert.deepEqual(modules.sort(), ['operations', 'reports', 'crm'].sort())
      assert.equal(modules.includes('finance'), false)
    })
  })

  describe('requirePermission() middleware', () => {
    function createMockRes() {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code
          return this
        },
        json(data) {
          this.body = data
          return this
        },
      }
      return res
    }

    test('returns 401 when req.user is missing', () => {
      const middleware = requirePermission('events', 'view')
      const req = {}
      const res = createMockRes()
      let nextCalled = false

      middleware(req, res, () => { nextCalled = true })

      assert.equal(nextCalled, false)
      assert.equal(res.statusCode, 401)
      assert.deepEqual(res.body, { error: 'Authentication required' })
    })

    test('calls next() without error for admin user', () => {
      const middleware = requirePermission('finance', 'manage')
      const req = { user: adminUser }
      const res = createMockRes()
      let nextCalled = false

      middleware(req, res, () => { nextCalled = true })

      assert.equal(nextCalled, true)
      assert.equal(res.statusCode, 200)
    })

    test('calls next() when non-admin user possesses required permission', () => {
      const middleware = requirePermission('events', 'create')
      const req = { user: managerUser }
      const res = createMockRes()
      let nextCalled = false

      middleware(req, res, () => { nextCalled = true })

      assert.equal(nextCalled, true)
    })

    test('returns 403 access denied when user lacks required permission', () => {
      const middleware = requirePermission('finance', 'view')
      const req = { user: managerUser }
      const res = createMockRes()
      let nextCalled = false

      middleware(req, res, () => { nextCalled = true })

      assert.equal(nextCalled, false)
      assert.equal(res.statusCode, 403)
      assert.equal(res.body.error, 'Access denied')
      assert.equal(res.body.message, "You need 'view' permission on 'finance'")
    })

    test('defaults required permission to "view" in middleware', () => {
      const middleware = requirePermission('ticketing')
      const req = { user: managerUser }
      const res = createMockRes()
      let nextCalled = false

      middleware(req, res, () => { nextCalled = true })

      assert.equal(nextCalled, true)
    })
  })
})
