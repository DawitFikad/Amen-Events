import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import jwt from '../backend/node_modules/jsonwebtoken/index.js'

// Ensure test secrets exist prior to importing jwt module
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-access-token-key-12345678'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-secret-refresh-token-key-87654321'

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../backend/src/lib/jwt.js'

describe('backend/jwt.js - Authentication Token Service Suite', () => {
  const testUserId = 'user-uuid-987654321'

  test('signAccessToken generates a non-empty JWT string', () => {
    const token = signAccessToken(testUserId)
    assert.equal(typeof token, 'string')
    assert.ok(token.length > 20)
    assert.equal(token.split('.').length, 3)
  })

  test('verifyAccessToken decodes payload containing the correct userId', () => {
    const token = signAccessToken(testUserId)
    const payload = verifyAccessToken(token)
    assert.equal(payload.userId, testUserId)
    assert.ok(payload.iat)
    assert.ok(payload.exp)
    assert.ok(payload.exp > payload.iat)
  })

  test('signRefreshToken generates a non-empty refresh JWT string', () => {
    const refreshToken = signRefreshToken(testUserId)
    assert.equal(typeof refreshToken, 'string')
    assert.ok(refreshToken.length > 20)
    assert.equal(refreshToken.split('.').length, 3)
  })

  test('verifyRefreshToken decodes payload containing the correct userId', () => {
    const refreshToken = signRefreshToken(testUserId)
    const payload = verifyRefreshToken(refreshToken)
    assert.equal(payload.userId, testUserId)
    assert.ok(payload.iat)
    assert.ok(payload.exp)
  })

  test('verifyAccessToken throws error when token is signed with wrong secret', () => {
    const forgedToken = jwt.sign({ userId: testUserId }, 'completely-wrong-secret')
    assert.throws(() => {
      verifyAccessToken(forgedToken)
    }, /invalid signature/)
  })

  test('verifyAccessToken throws error when token string is malformed or corrupted', () => {
    assert.throws(() => {
      verifyAccessToken('not.a.valid.jwt')
    }, /jwt malformed/)
  })

  test('verifyRefreshToken rejects access tokens signed with access secret', () => {
    const accessToken = signAccessToken(testUserId)
    assert.throws(() => {
      verifyRefreshToken(accessToken)
    }, /invalid signature/)
  })

  test('verifyAccessToken rejects refresh tokens signed with refresh secret', () => {
    const refreshToken = signRefreshToken(testUserId)
    assert.throws(() => {
      verifyAccessToken(refreshToken)
    }, /invalid signature/)
  })

  test('handles numeric and alphanumeric user IDs accurately', () => {
    const numToken = signAccessToken(1048)
    const numPayload = verifyAccessToken(numToken)
    assert.equal(numPayload.userId, 1048)

    const strToken = signAccessToken('st1')
    const strPayload = verifyAccessToken(strToken)
    assert.equal(strPayload.userId, 'st1')
  })

  test('detects tampered token payload', () => {
    const token = signAccessToken(testUserId)
    const parts = token.split('.')
    // Tamper with payload part
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'hacked-user' })).toString('base64url')
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

    assert.throws(() => {
      verifyAccessToken(tamperedToken)
    }, /invalid signature/)
  })
})
