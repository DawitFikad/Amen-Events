import jwt from 'jsonwebtoken'

export function signAttendeeToken(attendeeId) {
  return jwt.sign({ attendeeId, type: 'attendee' }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export function attendeeRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.type !== 'attendee') {
      return res.status(403).json({ error: 'Attendee access only' })
    }
    req.attendeeId = payload.attendeeId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
