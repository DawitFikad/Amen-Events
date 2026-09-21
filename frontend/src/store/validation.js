// Lightweight form validation helpers used across all create/registration forms.
// Each rule factory returns a validator fn: (value, form) => error string | ''.
// `validate(schema, form)` runs all rules and returns { ok, errors, first }.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Letters (incl. accented), spaces, and name punctuation only.
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ'’ .\u2019\-]+$/
const trim = (v) => (v === undefined || v === null ? '' : String(v).trim())
const digs = (v) => String(v === undefined || v === null ? '' : v).replace(/\D/g, '')

export const required =
  (label) =>
  (v) =>
    trim(v) === '' ? `${label} is required` : ''

export const nameOnly =
  (label, { min = 2, max = 80 } = {}) =>
  (v) => {
    const s = trim(v)
    if (s === '') return `${label} is required`
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s)) return `${label} must contain letters`
    if (!NAME_RE.test(s)) return `${label} may only contain letters, spaces, hyphens and apostrophes`
    if (s.length < min) return `${label} must be at least ${min} characters`
    if (s.length > max) return `${label} must be at most ${max} characters`
    return ''
  }

export const emailValid =
  (label) =>
  (v) => {
    const s = trim(v)
    if (s === '') return `${label} is required`
    if (!EMAIL_RE.test(s)) return `Enter a valid ${label.toLowerCase()} address`
    if (s.length > 120) return `${label} is too long`
    return ''
  }

export const phoneValid =
  (label) =>
  (v) => {
    const s = trim(v)
    if (s === '') return `${label} is required`
    const d = digs(s)
    if (d.length < 10) return `${label} must contain at least 10 digits`
    if (d.length > 15) return `${label} must contain at most 15 digits`
    if (!/^\+?[\d ()-]+$/.test(s)) return `${label} contains invalid characters`
    return ''
  }

export const numberPositive =
  (label, { integer = false, min = 1, max = null } = {}) =>
  (v) => {
    if (v === undefined || v === null || trim(v) === '') return `${label} is required`
    const n = Number(v)
    if (!Number.isFinite(n)) return `${label} must be a valid number`
    if (integer && !Number.isInteger(n)) return `${label} must be a whole number`
    if (n < min) return `${label} must be at least ${min}`
    if (max !== null && n > max) return `${label} must be at most ${max}`
    return ''
  }

export const textRequired =
  (label, { min = 1, max = 200 } = {}) =>
  (v) => {
    const s = trim(v)
    if (s === '') return `${label} is required`
    if (s.length < min) return `${label} must be at least ${min} characters`
    if (s.length > max) return `${label} must be at most ${max} characters`
    return ''
  }

export const dateRequired =
  (label) =>
  (v) => {
    const s = trim(v)
    if (s === '') return `${label} is required`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${label} is not a valid date`
    return ''
  }

// Validates that `endField` (when provided) is >= `startField` (when provided).
export const dateRange =
  (startField, endField, endLabel) =>
  (_v, form) => {
    const s = trim(form[startField])
    const e = trim(form[endField])
    if (s && e && e < s) return `${endLabel} must be on or after the start date`
    return ''
  }

// Skips a rule when the value is empty (for optional fields that are still
// validated for format when the user provides a value).
export const optional =
  (rule) =>
  (v, form) => {
    const s = trim(v)
    if (s === '') return ''
    return typeof rule === 'function' ? rule(v, form) : ''
  }

// Runs a schema of { field: [rules...] } against a form value object.
export function validate(form, schema) {
  const errors = {}
  const formVal = form || {}
  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const msg = typeof rule === 'function' ? rule(formVal[field], formVal) : ''
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  const keys = Object.keys(errors)
  return { ok: keys.length === 0, errors, first: keys.length ? errors[keys[0]] : '' }
}

// Convenience: clear a single field's error on change.
export function clearError(errors, field) {
  if (!errors || !errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}