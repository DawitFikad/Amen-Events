import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  required,
  nameOnly,
  emailValid,
  phoneValid,
  numberPositive,
  textRequired,
  dateRequired,
  dateRange,
  optional,
  validate,
  clearError,
} from '../frontend/src/store/validation.js'

describe('validation.js - Form Validation Suite', () => {
  describe('required rule', () => {
    const isRequired = required('Full Name')

    test('rejects empty string', () => {
      assert.equal(isRequired(''), 'Please fill out this field')
    })

    test('rejects null value', () => {
      assert.equal(isRequired(null), 'Please fill out this field')
    })

    test('rejects undefined value', () => {
      assert.equal(isRequired(undefined), 'Please fill out this field')
    })

    test('rejects whitespace-only string', () => {
      assert.equal(isRequired('   \t\n  '), 'Please fill out this field')
    })

    test('accepts valid string', () => {
      assert.equal(isRequired('Abebe'), '')
    })

    test('accepts numeric 0', () => {
      assert.equal(isRequired(0), '')
    })

    test('accepts boolean false', () => {
      assert.equal(isRequired(false), '')
    })

    test('accepts boolean true', () => {
      assert.equal(isRequired(true), '')
    })
  })

  describe('nameOnly rule', () => {
    const validateName = nameOnly('Contact Name', { min: 2, max: 50 })

    test('rejects empty or whitespace string', () => {
      assert.equal(validateName(''), 'Please fill out this field')
      assert.equal(validateName('   '), 'Please fill out this field')
    })

    test('rejects digits with no letters', () => {
      assert.equal(validateName('12345'), 'Contact Name must contain letters')
    })

    test('rejects symbols only with no letters', () => {
      assert.equal(validateName('!@#$%'), 'Contact Name must contain letters')
    })

    test('rejects names containing numbers', () => {
      assert.equal(
        validateName('Hana 2nd'),
        'Contact Name may only contain letters, spaces, hyphens and apostrophes'
      )
    })

    test('rejects names containing forbidden characters like @ or #', () => {
      assert.equal(
        validateName('Dawit@Amen'),
        'Contact Name may only contain letters, spaces, hyphens and apostrophes'
      )
    })

    test('rejects names shorter than min characters', () => {
      assert.equal(validateName('A'), 'Contact Name must be at least 2 characters')
    })

    test('rejects names longer than max characters', () => {
      const longName = 'A'.repeat(51)
      assert.equal(validateName(longName), 'Contact Name must be at most 50 characters')
    })

    test('accepts simple single name', () => {
      assert.equal(validateName('Hana'), '')
    })

    test('accepts multiple words with spaces', () => {
      assert.equal(validateName('Hana Tadesse Mengistu'), '')
    })

    test('accepts accented Latin characters (French, German, Nordic, etc.)', () => {
      assert.equal(validateName('Éloïse Müller'), '')
      assert.equal(validateName('René François'), '')
    })

    test('accepts hyphens in compound names', () => {
      assert.equal(validateName('Jean-Pierre Haile'), '')
    })

    test('accepts straight and curly apostrophes', () => {
      assert.equal(validateName("O'Connor"), '')
      assert.equal(validateName("D’Angelo"), '')
    })

    test('accepts dots for titles/abbreviations', () => {
      assert.equal(validateName('Dr. Meron Ayele'), '')
    })

    test('respects custom min and max defaults', () => {
      const defaultValidator = nameOnly('Default')
      assert.equal(defaultValidator('A'), 'Default must be at least 2 characters')
      assert.equal(defaultValidator('A'.repeat(81)), 'Default must be at most 80 characters')
      assert.equal(defaultValidator('A'.repeat(80)), '')
    })
  })

  describe('emailValid rule', () => {
    const validateEmail = emailValid('Work Email')

    test('rejects empty or whitespace', () => {
      assert.equal(validateEmail(''), 'Please fill out this field')
      assert.equal(validateEmail('   '), 'Please fill out this field')
    })

    test('rejects email without @ symbol', () => {
      assert.equal(validateEmail('notanemail.com'), 'Enter a valid work email address')
    })

    test('rejects email without domain', () => {
      assert.equal(validateEmail('user@'), 'Enter a valid work email address')
    })

    test('rejects email without TLD', () => {
      assert.equal(validateEmail('user@localhost'), 'Enter a valid work email address')
    })

    test('rejects email with single character TLD', () => {
      assert.equal(validateEmail('user@example.c'), 'Enter a valid work email address')
    })

    test('rejects email containing internal spaces', () => {
      assert.equal(validateEmail('user name@example.com'), 'Enter a valid work email address')
    })

    test('rejects emails exceeding 120 characters', () => {
      const longEmail = 'a'.repeat(110) + '@example.com'
      assert.equal(validateEmail(longEmail), 'Work Email is too long')
    })

    test('accepts standard corporate email', () => {
      assert.equal(validateEmail('hana@amen.et'), '')
    })

    test('accepts email with subdomains', () => {
      assert.equal(validateEmail('support@ops.amen-events.et'), '')
    })

    test('accepts email with plus addressing tags', () => {
      assert.equal(validateEmail('admin+testing@gmail.com'), '')
    })

    test('accepts email with dots and dashes in local part', () => {
      assert.equal(validateEmail('first.last-name@company.org'), '')
    })
  })

  describe('phoneValid rule', () => {
    const validatePhone = phoneValid('Phone Number')

    test('rejects empty or whitespace', () => {
      assert.equal(validatePhone(''), 'Please fill out this field')
      assert.equal(validatePhone('   '), 'Please fill out this field')
    })

    test('rejects numbers with fewer than 10 digits', () => {
      assert.equal(validatePhone('091122334'), 'Phone Number must contain at least 10 digits')
      assert.equal(validatePhone('+251911'), 'Phone Number must contain at least 10 digits')
    })

    test('rejects numbers with more than 15 digits', () => {
      assert.equal(
        validatePhone('+1234567890123456'),
        'Phone Number must contain at most 15 digits'
      )
    })

    test('rejects strings containing letters', () => {
      assert.equal(
        validatePhone('+251 911 220 445abc'),
        'Phone Number contains invalid characters'
      )
    })

    test('rejects strings with forbidden special characters', () => {
      assert.equal(
        validatePhone('+251#911220445!'),
        'Phone Number contains invalid characters'
      )
    })

    test('accepts local Ethiopian 10-digit phone', () => {
      assert.equal(validatePhone('0911220445'), '')
    })

    test('accepts international Ethiopian phone with spaces', () => {
      assert.equal(validatePhone('+251 911 220 445'), '')
    })

    test('accepts US format with parentheses and hyphens', () => {
      assert.equal(validatePhone('+1 (555) 123-4567'), '')
    })

    test('accepts UK hyphenated format', () => {
      assert.equal(validatePhone('+44-20-7946-0958'), '')
    })

    test('accepts max length 15-digit international number', () => {
      assert.equal(validatePhone('+123456789012345'), '')
    })
  })

  describe('numberPositive rule', () => {
    test('rejects empty, null, or undefined values', () => {
      const rule = numberPositive('Capacity')
      assert.equal(rule(''), 'Please fill out this field')
      assert.equal(rule(null), 'Please fill out this field')
      assert.equal(rule(undefined), 'Please fill out this field')
      assert.equal(rule('   '), 'Please fill out this field')
    })

    test('rejects non-numeric strings', () => {
      const rule = numberPositive('Price')
      assert.equal(rule('free'), 'Price must be a valid number')
      assert.equal(rule('N/A'), 'Price must be a valid number')
    })

    test('rejects NaN and non-finite values', () => {
      const rule = numberPositive('Amount')
      assert.equal(rule(NaN), 'Amount must be a valid number')
      assert.equal(rule(Infinity), 'Amount must be a valid number')
    })

    test('rejects numbers below minimum', () => {
      const rule = numberPositive('Quantity', { min: 5 })
      assert.equal(rule(4), 'Quantity must be at least 5')
      assert.equal(rule('0'), 'Quantity must be at least 5')
    })

    test('accepts numbers equal to or greater than minimum', () => {
      const rule = numberPositive('Quantity', { min: 5 })
      assert.equal(rule(5), '')
      assert.equal(rule(10), '')
      assert.equal(rule('5'), '')
    })

    test('enforces whole number when integer is true', () => {
      const rule = numberPositive('Tickets', { integer: true, min: 1 })
      assert.equal(rule(2.5), 'Tickets must be a whole number')
      assert.equal(rule('3.14'), 'Tickets must be a whole number')
      assert.equal(rule(3), '')
      assert.equal(rule('3'), '')
    })

    test('enforces maximum when max option is set', () => {
      const rule = numberPositive('Percentage', { min: 0, max: 100 })
      assert.equal(rule(101), 'Percentage must be at most 100')
      assert.equal(rule(100), '')
      assert.equal(rule(0), '')
      assert.equal(rule(-1), 'Percentage must be at least 0')
    })
  })

  describe('textRequired rule', () => {
    test('rejects empty or whitespace', () => {
      const rule = textRequired('Notes')
      assert.equal(rule(''), 'Please fill out this field')
      assert.equal(rule('   '), 'Please fill out this field')
    })

    test('enforces custom min length', () => {
      const rule = textRequired('Summary', { min: 10 })
      assert.equal(rule('Too short'), 'Summary must be at least 10 characters')
      assert.equal(rule('Exactly 10'), '')
    })

    test('enforces custom max length', () => {
      const rule = textRequired('Title', { max: 10 })
      assert.equal(rule('This title is way too long'), 'Title must be at most 10 characters')
      assert.equal(rule('Short one'), '')
    })
  })

  describe('dateRequired rule', () => {
    const validateDate = dateRequired('Event Date')

    test('rejects empty or whitespace string', () => {
      assert.equal(validateDate(''), 'Please fill out this field')
      assert.equal(validateDate('   '), 'Please fill out this field')
    })

    test('rejects slash separated date format', () => {
      assert.equal(validateDate('2026/05/12'), 'Event Date is not a valid date')
    })

    test('rejects inverted DD-MM-YYYY format', () => {
      assert.equal(validateDate('12-05-2026'), 'Event Date is not a valid date')
    })

    test('rejects single digit month or day format', () => {
      assert.equal(validateDate('2026-5-1'), 'Event Date is not a valid date')
    })

    test('rejects arbitrary text', () => {
      assert.equal(validateDate('today'), 'Event Date is not a valid date')
    })

    test('accepts valid YYYY-MM-DD date format', () => {
      assert.equal(validateDate('2026-05-12'), '')
      assert.equal(validateDate('2025-12-31'), '')
    })
  })

  describe('dateRange rule', () => {
    const rangeRule = dateRange('startDate', 'endDate', 'End date')

    test('returns error when end date is earlier than start date', () => {
      const form = { startDate: '2026-06-15', endDate: '2026-06-10' }
      assert.equal(rangeRule(form.endDate, form), 'End date must be on or after the start date')
    })

    test('accepts end date equal to start date', () => {
      const form = { startDate: '2026-06-15', endDate: '2026-06-15' }
      assert.equal(rangeRule(form.endDate, form), '')
    })

    test('accepts end date after start date', () => {
      const form = { startDate: '2026-06-15', endDate: '2026-06-20' }
      assert.equal(rangeRule(form.endDate, form), '')
    })

    test('passes when start date is not yet provided', () => {
      const form = { startDate: '', endDate: '2026-06-20' }
      assert.equal(rangeRule(form.endDate, form), '')
    })

    test('passes when end date is not yet provided', () => {
      const form = { startDate: '2026-06-15', endDate: '' }
      assert.equal(rangeRule(form.endDate, form), '')
    })

    test('passes when both dates are empty', () => {
      const form = { startDate: '', endDate: '' }
      assert.equal(rangeRule('', form), '')
    })
  })

  describe('optional wrapper rule', () => {
    const optionalPhone = optional(phoneValid('Mobile'))

    test('passes empty string without running wrapped rule', () => {
      assert.equal(optionalPhone(''), '')
    })

    test('passes null or undefined without running wrapped rule', () => {
      assert.equal(optionalPhone(null), '')
      assert.equal(optionalPhone(undefined), '')
    })

    test('passes whitespace-only string without running wrapped rule', () => {
      assert.equal(optionalPhone('   '), '')
    })

    test('validates value when non-empty and returns error if invalid', () => {
      assert.equal(optionalPhone('123'), 'Mobile must contain at least 10 digits')
    })

    test('passes when non-empty and valid', () => {
      assert.equal(optionalPhone('+251 911 220 445'), '')
    })

    test('handles non-function rule gracefully', () => {
      const invalidOptional = optional('not-a-function')
      assert.equal(invalidOptional('any value'), '')
    })
  })

  describe('validate runner', () => {
    const schema = {
      name: [nameOnly('Full Name', { min: 2 })],
      email: [emailValid('Email')],
      tickets: [numberPositive('Tickets', { integer: true, min: 1 })],
      startDate: [dateRequired('Start Date')],
      endDate: [dateRequired('End Date'), dateRange('startDate', 'endDate', 'End Date')],
    }

    test('returns ok: true and empty errors when form is completely valid', () => {
      const validForm = {
        name: 'Dawit Mengistu',
        email: 'dawit@amen.et',
        tickets: 2,
        startDate: '2026-07-01',
        endDate: '2026-07-03',
      }
      const res = validate(validForm, schema)
      assert.equal(res.ok, true)
      assert.deepEqual(res.errors, {})
      assert.equal(res.first, '')
    })

    test('returns ok: false and collects all failing field errors', () => {
      const invalidForm = {
        name: '1',
        email: 'bad-email',
        tickets: 0,
        startDate: 'invalid-date',
        endDate: '',
      }
      const res = validate(invalidForm, schema)
      assert.equal(res.ok, false)
      assert.ok(res.errors.name)
      assert.ok(res.errors.email)
      assert.ok(res.errors.tickets)
      assert.ok(res.errors.startDate)
      assert.ok(res.errors.endDate)
      assert.equal(res.first, res.errors.name)
    })

    test('stops evaluating rules at first failing rule for a single field', () => {
      const multiRuleSchema = {
        field: [
          required('Field'),
          nameOnly('Field'),
        ],
      }
      const res = validate({ field: '' }, multiRuleSchema)
      assert.equal(res.errors.field, 'Please fill out this field')
    })

    test('handles null or undefined form object gracefully', () => {
      const res = validate(null, schema)
      assert.equal(res.ok, false)
      assert.ok(res.errors.name)
    })
  })

  describe('clearError utility', () => {
    test('removes specific field from error map', () => {
      const errors = { name: 'Name error', email: 'Email error', phone: 'Phone error' }
      const updated = clearError(errors, 'email')
      assert.deepEqual(updated, { name: 'Name error', phone: 'Phone error' })
    })

    test('does not mutate the original errors object', () => {
      const errors = { name: 'Name error' }
      const updated = clearError(errors, 'name')
      assert.deepEqual(errors, { name: 'Name error' })
      assert.deepEqual(updated, {})
    })

    test('returns original when errors object is null or undefined', () => {
      assert.equal(clearError(null, 'name'), null)
      assert.equal(clearError(undefined, 'name'), undefined)
    })

    test('returns original when field does not exist in errors', () => {
      const errors = { name: 'Name error' }
      const result = clearError(errors, 'nonExistent')
      assert.equal(result, errors)
    })
  })
})
