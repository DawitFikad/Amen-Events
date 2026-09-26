import React, { useState, useEffect, useMemo } from 'react'
import {
  Package, Plus, Wrench, Truck, Boxes, AlertTriangle, CheckCircle2, Upload, Trash2,
  Image, Info, CircleDollarSign, Store, CalendarClock, FileText, ArrowRight,
  RotateCcw, Check, Download, Printer, User, Building, Phone, Mail, ShieldCheck,
  Clock, DollarSign, Calendar
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Modal, Field, SkeletonPage } from '../components/ui'
import { textRequired, required, numberPositive, optional, dateRequired, nameOnly, phoneValid, emailValid, validate } from '../store/validation'
import { exportTableToPDF } from '../store/exportUtils'
import {
  calculateRentalDuration,
  calculateRentalRevenue,
  calculateTotalPayable,
  calculateAvailableStock,
  aggregateRentalMetrics,
  calculateDepositSettlement,
  filterRentalRecords,
} from '../store/rentalUtils'
import { jsPDF } from 'jspdf'

const categories = [
  'LED Screens', 'Sound Systems', 'Lighting', 'Stages', 'Furniture', 'Decoration',
  'Vehicles', 'Generators', 'Branding', 'Tents & Marquees', 'Catering Equipment',
  'Laptops & Tablets', 'Cameras & Video', 'Printers & Plotting', 'Barricades & Fencing',
  'Photocopy Machines', 'WiFi Boosters', 'Projectors', 'Power Distribution',
]

const allocations = [
  { id: 'al1', resourceId: 'rc2', eventId: 'ev1', qty: 2, by: 'st5', date: '2026-08-10' },
  { id: 'al2', resourceId: 'rc5', eventId: 'ev1', qty: 260, by: 'st5', date: '2026-08-12' },
  { id: 'al3', resourceId: 'rc7', eventId: 'ev3', qty: 3, by: 'st5', date: '2026-08-01' },
]

const statuses = ['available', 'reserved', 'in-use', 'maintenance', 'retired']

export default function Resources() {
  const {
    state, addResource, updateResource, scheduleMaintenance, completeMaintenance,
    addRental, updateRental, returnRental, deleteRental,
    intent, clearIntent, loading,
  } = useData()

  if (loading) return <SkeletonPage />

  // Tab State: 'inventory' | 'rentals' | 'allocations' | 'maintenance'
  const [activeTab, setActiveTab] = useState('inventory')

  // Search & Filter State
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [rentableOnly, setRentableOnly] = useState(false)
  const [toast, setToast] = useState(null)

  // Asset Registration Wizard
  const [open, setOpen] = useState(false)
  const [assetStep, setAssetStep] = useState(1)
  const [form, setForm] = useState({})

  // Edit Asset Modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editId, setEditId] = useState(null)

  // Maintenance Modal
  const [mtOpen, setMtOpen] = useState(false)
  const [mtForm, setMtForm] = useState({})

  // Rental Modals
  const [rentOpen, setRentOpen] = useState(false)
  const [rentForm, setRentForm] = useState({})
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)
  const [returnForm, setReturnForm] = useState({})
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [paymentForm, setPaymentForm] = useState({})

  // Rental Filter
  const [rentQ, setRentQ] = useState('')
  const [rentFilter, setRentFilter] = useState('all') // 'all' | 'active' | 'returned' | 'overdue'

  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const openAssetWizard = () => { setOpen(true); setAssetStep(1); setForm({ rentalAvailable: true }); setErrors({}) }
  const closeAssetWizard = () => { setOpen(false); setAssetStep(1); setForm({}); setErrors({}) }

  // Quick Open Rent Modal for a specific item
  const openRentForItem = (resource) => {
    const start = todayStr
    const end = tomorrowStr
    setRentForm({
      resourceId: resource.id,
      resourceName: resource.name,
      qty: 1,
      renterType: 'external',
      clientId: '',
      renterName: '',
      renterPhone: '',
      renterEmail: '',
      renterCompany: '',
      startDate: start,
      endDate: end,
      durationDays: 1,
      dailyRate: resource.rentalRate || 0,
      totalAmount: (resource.rentalRate || 0) * 1 * 1,
      deposit: resource.rentalDeposit || 0,
      paymentStatus: 'paid',
      paymentMethod: 'Telebirr',
      conditionOnOut: 'Inspected and working before handover',
      notes: resource.rentalTerms || '',
    })
    setErrors({})
    setRentOpen(true)
  }

  const openNewRentalGeneric = () => {
    const firstRentable = state.resources.find((r) => r.rentalAvailable) || state.resources[0]
    if (firstRentable) {
      openRentForItem(firstRentable)
    } else {
      show('Please add an inventory asset first', 'warn')
    }
  }

  useEffect(() => {
    if (intent === 'new-resource') {
      if (state.demo?.autoplay) {
        const seed = {
          name: 'Par LED Lights (10)', category: 'Lighting', qty: '20', unitCost: '85000',
          location: 'Main Warehouse', supplier: 'Beam Lights Co', purchaseDate: '2026-08-01',
          rentalAvailable: true, rentalRate: 2000, rentalDeposit: 15000,
        }
        setOpen(true); setForm(seed); setErrors({})
        setTimeout(() => {
          const rec = addResource(seed)
          show(`Asset "${rec?.name || seed.name}" added automatically`); setOpen(false); setForm({})
        }, 1100)
      } else { openAssetWizard() }
      clearIntent()
    }
  }, [intent])

  // Calculation helpers
  const counts = useMemo(() => {
    const res = state.resources || []
    return {
      total: res.length,
      available: res.filter((r) => r.status === 'available').length,
      inUse: res.filter((r) => r.status === 'in-use').length,
      maintenance: res.filter((r) => r.status === 'maintenance').length,
      rentable: res.filter((r) => r.rentalAvailable).length,
    }
  }, [state.resources])

  const rentalStats = useMemo(() => {
    const rentals = state.rentals || []
    const active = rentals.filter((r) => r.status === 'active' || r.status === 'overdue')
    const totalEarned = rentals.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
    const depositsHeld = rentals.filter((r) => r.depositStatus === 'held').reduce((sum, r) => sum + (Number(r.deposit) || 0), 0)
    const overdue = rentals.filter((r) => r.status === 'active' && r.endDate < todayStr)
    const rentedUnits = active.reduce((sum, r) => sum + (Number(r.qty) || 1), 0)

    return {
      allCount: rentals.length,
      activeCount: active.length,
      totalEarned,
      depositsHeld,
      overdueCount: overdue.length,
      rentedUnits,
    }
  }, [state.rentals, todayStr])

  // Active Allocations list
  const activeAllocations = useMemo(() => {
    const list = []
    ;(state.events || []).forEach((e) => {
      ;(e.allocations || []).forEach((a, idx) => {
        list.push({
          id: `${e.id}-${a.resourceId}-${idx}`,
          resourceId: a.resourceId,
          eventId: e.id,
          qty: a.qty || 1,
          by: e.pmId || 'st1',
          date: e.date || 'Upcoming',
        })
      })
    })
    return list.length ? list : allocations.filter((al) => (state.resources || []).some((r) => r.id === al.resourceId))
  }, [state.events, state.resources])

  // Filtered Inventory List
  const filtered = useMemo(() => {
    return (state.resources || []).filter((r) => {
      const matchQ = (r.name + ' ' + r.category + ' ' + (r.code || '')).toLowerCase().includes(q.toLowerCase())
      const matchCat = cat === 'All' || r.category === cat
      const matchRentable = !rentableOnly || r.rentalAvailable
      return matchQ && matchCat && matchRentable
    })
  }, [state.resources, q, cat, rentableOnly])

  // Filtered Rentals List
  const filteredRentals = useMemo(() => {
    return (state.rentals || []).filter((r) => {
      const text = `${r.rentalCode || ''} ${r.resourceName || ''} ${r.renterName || ''} ${r.renterCompany || ''} ${r.renterPhone || ''}`.toLowerCase()
      const matchQ = text.includes(rentQ.toLowerCase())
      const isOverdue = (r.status === 'active' || r.status === 'overdue') && r.endDate < todayStr

      let matchFilter = true
      if (rentFilter === 'active') matchFilter = r.status === 'active'
      else if (rentFilter === 'returned') matchFilter = r.status === 'returned'
      else if (rentFilter === 'overdue') matchFilter = isOverdue

      return matchQ && matchFilter
    })
  }, [state.rentals, rentQ, rentFilter, todayStr])

  // Handle Rent Form change and automatic price calculation
  const handleRentChange = (field, val) => {
    setRentForm((prev) => {
      const next = { ...prev, [field]: val }

      // When resource changes, update dailyRate & deposit
      if (field === 'resourceId') {
        const found = state.resources.find((r) => r.id === val)
        if (found) {
          next.resourceName = found.name
          next.dailyRate = found.rentalRate || 0
          next.deposit = found.rentalDeposit || 0
        }
      }

      // When existing client is chosen, populate client fields
      if (field === 'clientId') {
        const cl = state.clients.find((c) => c.id === val)
        if (cl) {
          next.renterName = cl.contactPerson || cl.company
          next.renterCompany = cl.company
          next.renterPhone = cl.phone || ''
          next.renterEmail = cl.email || ''
        }
      }

      // Recalculate duration & total amount
      const start = next.startDate || todayStr
      const end = next.endDate || start
      const d1 = new Date(start)
      const d2 = new Date(end)
      const diffMs = Math.max(0, d2 - d1)
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
      next.durationDays = days

      const qty = Number(next.qty) || 1
      const rate = Number(next.dailyRate) || 0
      next.totalAmount = qty * rate * days

      return next
    })
  }

  // Submit New Rental
  const submitRental = () => {
    const schema = {
      resourceId: [required('Asset to rent')],
      qty: [numberPositive('Quantity', { integer: true })],
      renterName: [textRequired('Renter Name', { min: 2, max: 100 })],
      startDate: [dateRequired('Rental Start Date')],
      endDate: [dateRequired('Rental Return Date')],
      dailyRate: [numberPositive('Daily Rate', { min: 0 })],
    }
    const res = validate(rentForm, schema)
    if (!res.ok) {
      setErrors(res.errors)
      show(res.first, 'warn')
      return
    }

    // Verify quantity doesn't exceed available stock
    const targetResource = state.resources.find((r) => r.id === rentForm.resourceId)
    if (targetResource) {
      const totalStock = Number(targetResource.qty) || 1
      const allocated = Number(targetResource.allocated) || 0
      const currentlyRented = Number(targetResource.rented) || 0
      const available = Math.max(0, totalStock - allocated - currentlyRented)
      if (Number(rentForm.qty) > available) {
        show(`Only ${available} unit(s) available in stock to rent`, 'warn')
        return
      }
    }

    addRental(rentForm)
    show(`Rental created! ETB ${Number(rentForm.totalAmount).toLocaleString()} registered in revenue`)
    setRentOpen(false)
    setRentForm({})
    setErrors({})
    setActiveTab('rentals')
  }

  // Open Return Modal
  const openReturnModal = (rental) => {
    setReturnTarget(rental)
    setReturnForm({
      actualReturnDate: todayStr,
      conditionOnReturn: 'Good condition, checked in by warehouse lead',
      depositStatus: 'refunded',
      notes: '',
    })
    setReturnOpen(true)
  }

  // Submit Return
  const submitReturn = () => {
    if (!returnTarget) return
    returnRental(returnTarget.id, returnForm)
    show(`Equipment returned! Stock restored to inventory and deposit settled.`)
    setReturnOpen(false)
    setReturnTarget(null)
    setReturnForm({})
  }

  // Quick Payment Update
  const openPaymentModal = (rental) => {
    setPaymentTarget(rental)
    setPaymentForm({
      paymentStatus: 'paid',
      paymentMethod: rental.paymentMethod || 'Telebirr',
    })
    setPaymentOpen(true)
  }

  const submitPayment = () => {
    if (!paymentTarget) return
    updateRental(paymentTarget.id, {
      paymentStatus: paymentForm.paymentStatus,
      paymentMethod: paymentForm.paymentMethod,
    })
    show(`Payment recorded! Rental ${paymentTarget.rentalCode} marked as ${paymentForm.paymentStatus}`)
    setPaymentOpen(false)
    setPaymentTarget(null)
  }

  // Export Rental Agreement / Receipt as branded PDF
  const downloadRentalAgreement = (rental) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 40

    // Gold top bar
    doc.setFillColor(212, 175, 55)
    doc.rect(0, 0, pageW, 5, 'F')

    // Brand header
    doc.setFillColor(10, 47, 20)
    doc.rect(0, 5, pageW, 50, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 175, 55)
    doc.text('AMEN EVENT ORGANIZER', margin, 28)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 210, 180)
    doc.text('ENTERPRISE EQUIPMENT RENTAL AGREEMENT & INVOICE RECEIPT', margin, 42)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 175, 55)
    doc.text(rental.rentalCode || 'RNT-2026', pageW - margin - 90, 36)

    let y = 80

    // Metadata Box
    doc.setFillColor(245, 248, 245)
    doc.setDrawColor(200, 220, 200)
    doc.rect(margin, y, pageW - margin * 2, 70, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('RENTER / CLIENT DETAILS', margin + 15, y + 20)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 70, 60)
    doc.text(`Renter Name: ${rental.renterName || '-'}`, margin + 15, y + 36)
    doc.text(`Company / Org: ${rental.renterCompany || 'Independent'}`, margin + 15, y + 50)
    doc.text(`Phone: ${rental.renterPhone || '-'}`, margin + 15, y + 64)

    doc.setFont('helvetica', 'bold')
    doc.text('RENTAL SCHEDULE', pageW / 2 + 10, y + 20)
    doc.setFont('helvetica', 'normal')
    doc.text(`Start Date: ${rental.startDate || '-'}`, pageW / 2 + 10, y + 36)
    doc.text(`Return Date: ${rental.endDate || '-'}`, pageW / 2 + 10, y + 50)
    doc.text(`Duration: ${rental.durationDays || 1} Day(s)`, pageW / 2 + 10, y + 64)

    y += 90

    // Equipment Details Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('EQUIPMENT DISPATCH SPECIFICATIONS', margin, y)

    y += 10
    doc.setFillColor(235, 245, 235)
    doc.rect(margin, y, pageW - margin * 2, 22, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('ITEM DESCRIPTION', margin + 10, y + 14)
    doc.text('QTY', margin + 240, y + 14)
    doc.text('DAILY RATE', margin + 300, y + 14)
    doc.text('TOTAL RENTAL FEE', pageW - margin - 110, y + 14)

    y += 22
    doc.setFillColor(255, 255, 255)
    doc.rect(margin, y, pageW - margin * 2, 26, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 40, 30)
    doc.text(rental.resourceName || 'Equipment Item', margin + 10, y + 16)
    doc.text(`${rental.qty || 1} Units`, margin + 240, y + 16)
    doc.text(`ETB ${Number(rental.dailyRate || 0).toLocaleString()} / day`, margin + 300, y + 16)
    doc.setFont('helvetica', 'bold')
    doc.text(`ETB ${Number(rental.totalAmount || 0).toLocaleString()}`, pageW - margin - 110, y + 16)

    y += 45

    // Financial Summary
    doc.setFillColor(248, 250, 248)
    doc.rect(pageW - margin - 220, y, 220, 95, 'FD')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 90, 80)
    doc.text('Equipment Hire Fee:', pageW - margin - 210, y + 20)
    doc.text(`ETB ${Number(rental.totalAmount || 0).toLocaleString()}`, pageW - margin - 70, y + 20)

    doc.text('Security Deposit (Held):', pageW - margin - 210, y + 38)
    doc.text(`ETB ${Number(rental.deposit || 0).toLocaleString()}`, pageW - margin - 70, y + 38)

    doc.text('Payment Method:', pageW - margin - 210, y + 56)
    doc.text(rental.paymentMethod || 'Telebirr', pageW - margin - 70, y + 56)

    doc.setDrawColor(200, 220, 200)
    doc.line(pageW - margin - 210, y + 66, pageW - margin - 10, y + 66)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('TOTAL REVENUE RECEIVED:', pageW - margin - 210, y + 82)
    doc.text(`ETB ${Number(rental.totalAmount || 0).toLocaleString()}`, pageW - margin - 70, y + 82)

    // Terms & Conditions
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('TERMS OF RENTAL & LIABILITY:', margin, y + 15)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 100, 90)
    const terms = [
      '1. The equipment is rented in inspected and certified operational condition.',
      '2. Renter assumes complete financial liability for loss, theft, or component damage.',
      '3. Security deposit is refundable upon complete physical inspection by Amen Logistics.',
      '4. Return delays past scheduled return date incur a standard 1.5x daily fee penalty.',
    ]
    terms.forEach((t, i) => {
      doc.text(t, margin, y + 32 + i * 14)
    })

    y += 135

    // Signatures
    doc.setDrawColor(180, 190, 180)
    doc.line(margin, y + 40, margin + 180, y + 40)
    doc.line(pageW - margin - 180, y + 40, pageW - margin, y + 40)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 47, 20)
    doc.text('Authorized Amen Logistics Lead', margin, y + 55)
    doc.text('Renter Signature & Acceptance', pageW - margin - 180, y + 55)

    doc.save(`${rental.rentalCode || 'rental'}-agreement.pdf`)
    show('Rental agreement & receipt downloaded')
  }

  // Export full rentals table to PDF
  const exportRentalsReport = () => {
    exportTableToPDF(
      'equipment-rentals-report',
      'Amen Events - Equipment Rentals & Revenue Report',
      ['Rental Ref', 'Equipment', 'Qty', 'Renter / Client', 'Period', 'Days', 'Daily Rate', 'Total Revenue', 'Deposit', 'Payment', 'Status'],
      (state.rentals || []).map((r) => [
        r.rentalCode || '-',
        r.resourceName || '-',
        r.qty || 1,
        `${r.renterName}${r.renterCompany ? ' (' + r.renterCompany + ')' : ''}`,
        `${r.startDate} to ${r.endDate}`,
        r.durationDays || 1,
        `ETB ${(r.dailyRate || 0).toLocaleString()}`,
        `ETB ${(r.totalAmount || 0).toLocaleString()}`,
        `ETB ${(r.deposit || 0).toLocaleString()}`,
        r.paymentStatus || 'paid',
        r.status || 'active',
      ]),
      {
        rightAlignCols: [6, 7, 8],
        subtitle: `Total Revenue Generated: ETB ${rentalStats.totalEarned.toLocaleString()}  ·  Active Field Hires: ${rentalStats.activeCount}  ·  Security Deposits Held: ETB ${rentalStats.depositsHeld.toLocaleString()}`,
      }
    )
  }

  // Asset validation & submit
  const resourceSchema = {
    name: [textRequired('Asset name', { min: 2, max: 100 })],
    qty: [numberPositive('Quantity', { integer: true })],
    unitCost: [optional(numberPositive('Unit cost'))],
    rentalRate: [optional(numberPositive('Rental rate per day', { min: 0 }))],
    rentalDeposit: [optional(numberPositive('Security deposit', { min: 0 }))],
    purchaseDate: [optional(dateRequired('Purchase date'))],
    supplier: [optional(nameOnly('Supplier'))],
  }

  const submit = () => {
    const res = validate(form, resourceSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addResource({
      ...form,
      category: form.category || 'Branding',
      code: form.code || 'A-AS-' + String(Math.floor(Math.random() * 99)).padStart(2, '0'),
      unitCost: Number(form.unitCost) || 0,
      rentalAvailable: form.rentalAvailable !== undefined ? Boolean(form.rentalAvailable) : true,
      rentalRate: Number(form.rentalRate) || 0,
      rentalDeposit: Number(form.rentalDeposit) || 0,
      rentalTerms: form.rentalTerms || '',
    })
    show(`Asset "${form.name}" added to inventory`)
    setOpen(false)
    setAssetStep(1)
    setForm({})
    setErrors({})
  }

  const handleAssetNext = () => {
    if (assetStep === 1) {
      const res = validate(form, { name: [textRequired('Asset name', { min: 2, max: 100 })] })
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    } else if (assetStep === 2) {
      const res = validate(form, { qty: [numberPositive('Quantity', { integer: true })] })
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    }
    setErrors({})
    setAssetStep((s) => Math.min(s + 1, 4))
  }

  const handleAssetBack = () => setAssetStep((s) => Math.max(s - 1, 1))

  const openEdit = (r) => {
    setEditId(r.id)
    setEditForm({ ...r })
    setErrors({})
    setEditOpen(true)
  }

  const editSave = () => {
    const res = validate(editForm, resourceSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    updateResource(editId, editForm)
    show(`Asset "${editForm.name}" updated`)
    setEditOpen(false)
    setEditForm({})
    setEditId(null)
    setErrors({})
  }

  const onPhoto = (e, setFn) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setFn((f) => ({ ...f, image: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const mtSchema = { resourceId: [required('Asset')], task: [optional(textRequired('Task', { min: 3, max: 100 }))], date: [optional(dateRequired('Date'))] }

  const submitMaintenance = () => {
    const res = validate(mtForm, mtSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    scheduleMaintenance(mtForm.resourceId, mtForm.date || todayStr, mtForm.task || 'Routine maintenance')
    show('Maintenance scheduled - asset moved to maintenance')
    setMtOpen(false)
    setMtForm({})
    setErrors({})
  }

  const AssetThumb = ({ r, className = 'h-9 w-9' }) => r?.image
    ? <img src={r.image} alt={r?.name || 'Asset'} className={`${className} rounded-lg object-cover ring-1 ring-brand-100`} />
    : <span className={`${className} flex items-center justify-center rounded-lg bg-brand-50 text-brand-700`}><Boxes size={16} /></span>

  const renderFields = (f, setFn) => (
    <>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
          {f?.image
            ? <img src={f.image} alt="Asset" className="h-full w-full object-cover" />
            : <Upload size={24} className="text-brand-400" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-950">Asset Photo</p>
          <p className="text-xs text-ink/50">Show the item on inventory and allocation views (JPG, PNG - max 5MB).</p>
          <div className="mt-2 flex gap-2">
            <label className="btn-outline !py-1.5 cursor-pointer text-xs">
              <Upload size={14} /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e, setFn)} />
            </label>
            {f?.image && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setFn((x) => ({ ...x, image: '' }))}><Trash2 size={13} /> Remove</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Asset Name *" className="col-span-2"><input className="input" value={f.name || ''} onChange={(e) => setFn({ ...f, name: e.target.value })} placeholder="e.g. Par LED Lights (10)" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
        <Field label="Category"><select className="input" value={f.category || 'Branding'} onChange={(e) => setFn({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}<option>Other</option></select></Field>
        <Field label="Asset Code"><input className="input font-mono" value={f.code || ''} onChange={(e) => setFn({ ...f, code: e.target.value })} placeholder="A-LE-01" /></Field>
        <Field label="Total Quantity *"><input type="number" className="input" value={f.qty || ''} onChange={(e) => setFn({ ...f, qty: e.target.value })} placeholder="e.g. 10" />{errors.qty && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.qty}</p>}</Field>
        <Field label="Unit Replacement Cost (ETB)"><div className="relative"><CircleDollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input type="number" className="input pl-9" value={f.unitCost || ''} onChange={(e) => setFn({ ...f, unitCost: e.target.value })} placeholder="e.g. 120000" /></div>{errors.unitCost && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.unitCost}</p>}</Field>

        {/* Rental Monetization Fields */}
        <div className="col-span-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white"><CircleDollarSign size={15} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Rental Monetization</p>
                <p className="text-[11px] text-ink/55">Rent this item to external organizers and clients to generate revenue.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-900">
              <input
                type="checkbox"
                checked={f.rentalAvailable !== false}
                onChange={(e) => setFn({ ...f, rentalAvailable: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
              Available for Rent
            </label>
          </div>

          {f.rentalAvailable !== false && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-100">
              <Field label="Rental Price per Day (ETB)">
                <div className="relative">
                  <CircleDollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    type="number"
                    className="input pl-9 text-brand-950 font-bold"
                    value={f.rentalRate || ''}
                    onChange={(e) => setFn({ ...f, rentalRate: e.target.value })}
                    placeholder="e.g. 25000"
                  />
                </div>
              </Field>
              <Field label="Security Deposit (ETB)">
                <input
                  type="number"
                  className="input"
                  value={f.rentalDeposit || ''}
                  onChange={(e) => setFn({ ...f, rentalDeposit: e.target.value })}
                  placeholder="e.g. 50000"
                />
              </Field>
              <Field label="Rental Terms / Rigging Notes" className="col-span-2">
                <input
                  className="input text-xs"
                  value={f.rentalTerms || ''}
                  onChange={(e) => setFn({ ...f, rentalTerms: e.target.value })}
                  placeholder="e.g. Includes certified technician; client covers transportation."
                />
              </Field>
            </div>
          )}
        </div>

        <Field label="Location"><input className="input" value={f.location || 'Main Warehouse'} onChange={(e) => setFn({ ...f, location: e.target.value })} placeholder="e.g. Main Warehouse / Stage B" /></Field>
        <Field label="Status"><select className="input" value={f.status || 'available'} onChange={(e) => setFn({ ...f, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}<option value="Other">Other</option></select></Field>
        <Field label="Supplier / Vendor"><div className="relative"><Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={f.supplier || ''} onChange={(e) => setFn({ ...f, supplier: e.target.value })} placeholder="e.g. Addis AV Traders" /></div></Field>
        <Field label="Purchase Date"><div className="relative"><CalendarClock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input type="date" className="input pl-9" value={f.purchaseDate || ''} onChange={(e) => setFn({ ...f, purchaseDate: e.target.value })} /></div></Field>
        <Field label="Notes / Description" className="col-span-2"><textarea className="input min-h-[60px] resize-y" value={f.notes || ''} onChange={(e) => setFn({ ...f, notes: e.target.value })} placeholder="Condition, specifications, serial numbers, warranty…" /></Field>
      </div>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Resource & Asset Inventory"
        subtitle="Manage equipment, external equipment rentals to generate revenue, event allocations and maintenance."
        icon={Package}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-outline"
              onClick={() => {
                if (activeTab === 'rentals') {
                  exportRentalsReport()
                } else {
                  exportTableToPDF(
                    'asset-inventory',
                    'Asset & Resource Inventory Report',
                    ['Asset Name', 'Category', 'Code', 'Total Stock', 'Event Use', 'Rented Out', 'Daily Rate', 'Status', 'Location'],
                    state.resources.map((r) => [
                      r.name,
                      r.category,
                      r.code,
                      r.qty,
                      r.allocated || 0,
                      r.rented || 0,
                      r.rentalAvailable ? `ETB ${(r.rentalRate || 0).toLocaleString()}` : 'Internal Only',
                      r.status,
                      r.location,
                    ]),
                    { rightAlignCols: [3, 4, 5, 6], subtitle: `Total Assets: ${state.resources.length}  ·  Available: ${counts.available}  ·  Rented Out: ${rentalStats.rentedUnits}` }
                  )
                }
              }}
            >
              <FileText size={15} /> Export PDF
            </button>
            <button className="btn-primary !bg-gold-500 hover:!bg-gold-600 !text-brand-950 font-bold shadow-sm" onClick={openNewRentalGeneric}>
              <CircleDollarSign size={16} /> Rent Equipment Out
            </button>
            <button className="btn-primary" onClick={openAssetWizard}>
              <Plus size={15} /> Add Asset
            </button>
          </div>
        }
      />

      {/* Top Level KPI Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card flex items-center justify-between p-4 border-l-4 border-l-brand-800">
          <div>
            <p className="text-[12px] font-semibold text-ink/55">Total Assets</p>
            <p className="mt-1 text-2xl font-black text-brand-950">{counts.total}</p>
            <p className="text-[11px] text-ink/45 mt-0.5">{counts.rentable} configured for hire</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white"><Boxes size={18} /></span>
        </div>

        <div className="card flex items-center justify-between p-4 border-l-4 border-l-brand-500">
          <div>
            <p className="text-[12px] font-semibold text-ink/55">Available Stock</p>
            <p className="mt-1 text-2xl font-black text-brand-700">{counts.available}</p>
            <p className="text-[11px] text-brand-600 mt-0.5">Ready for deployment</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><CheckCircle2 size={18} /></span>
        </div>

        <div className="card flex items-center justify-between p-4 border-l-4 border-l-blue-600">
          <div>
            <p className="text-[12px] font-semibold text-ink/55">In Event Use</p>
            <p className="mt-1 text-2xl font-black text-blue-900">{counts.inUse}</p>
            <p className="text-[11px] text-ink/45 mt-0.5">{activeAllocations.length} active allocations</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800"><Truck size={18} /></span>
        </div>

        <div className="card flex items-center justify-between p-4 border-l-4 border-l-gold-500 bg-gold-50/20">
          <div>
            <p className="text-[12px] font-semibold text-gold-900">Rented Out (Income)</p>
            <p className="mt-1 text-2xl font-black text-gold-700">{rentalStats.rentedUnits}</p>
            <p className="text-[11px] font-medium text-gold-800 mt-0.5">{rentalStats.activeCount} active client rentals</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><CircleDollarSign size={18} /></span>
        </div>

        <div className="card flex items-center justify-between p-4 border-l-4 border-l-emerald-600 bg-emerald-50/30">
          <div>
            <p className="text-[12px] font-bold text-emerald-900">Rental Revenue</p>
            <p className="mt-1 text-xl font-black text-emerald-700">ETB {rentalStats.totalEarned.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-emerald-800 mt-0.5">+ETB {rentalStats.depositsHeld.toLocaleString()} deposits held</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"><DollarSign size={18} /></span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-brand-800 text-white shadow-sm' : 'bg-brand-50/60 text-brand-900 hover:bg-brand-100/60'}`}
          >
            <Package size={15} /> All Inventory Equipment ({state.resources.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'rentals' ? 'bg-gold-500 text-brand-950 shadow-sm' : 'bg-gold-50 text-gold-900 hover:bg-gold-100'}`}
          >
            <CircleDollarSign size={15} /> Equipment Rentals & Revenue ({rentalStats.activeCount} active)
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'allocations' ? 'bg-brand-800 text-white shadow-sm' : 'bg-brand-50/60 text-brand-900 hover:bg-brand-100/60'}`}
          >
            <Truck size={15} /> Event Allocations ({activeAllocations.length})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'maintenance' ? 'bg-brand-800 text-white shadow-sm' : 'bg-brand-50/60 text-brand-900 hover:bg-brand-100/60'}`}
          >
            <Wrench size={15} /> Maintenance ({counts.maintenance})
          </button>
        </div>

        {activeTab === 'inventory' && (
          <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-gold-50/70 border border-gold-200 px-3 py-1.5 text-xs font-semibold text-gold-950 hover:bg-gold-100/70">
            <input
              type="checkbox"
              checked={rentableOnly}
              onChange={(e) => setRentableOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-gold-600 focus:ring-gold-500"
            />
            Show Rentable Items Only
          </label>
        )}
      </div>

      {/* ──────────────── TAB 1: INVENTORY EQUIPMENT ──────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-5 animate-fade-in">
          {/* Categories & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-3xl">
              {['All', ...categories].map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`tab ${cat === c ? 'tab-active' : 'tab-idle'}`}>{c}</button>
              ))}
            </div>
            <SearchBox value={q} onChange={setQ} placeholder="Search assets, codes, categories…" className="w-full sm:w-64" />
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-brand-50/50">
                  <tr>
                    <Th>Asset / Model</Th>
                    <Th>Category</Th>
                    <Th>Total Stock</Th>
                    <Th>Utilization & Breakdown</Th>
                    <Th>Rental Price / Day</Th>
                    <Th>Status</Th>
                    <Th>Location</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {filtered.map((r) => {
                    const total = Number(r.qty) || 1
                    const allocated = Number(r.allocated) || 0
                    const rented = Number(r.rented) || 0
                    const inUse = allocated + rented
                    const availableUnits = Math.max(0, total - inUse)
                    const utilPercent = Math.min(100, Math.round((inUse / total) * 100))

                    return (
                      <tr key={r.id} className="hover:bg-brand-50/40 transition-colors">
                        <Td>
                          <div className="flex items-center gap-3">
                            <AssetThumb r={r} />
                            <div>
                              <p className="font-semibold text-brand-950 flex items-center gap-2">
                                {r.name}
                                {r.rentalAvailable && (
                                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Rentable
                                  </span>
                                )}
                              </p>
                              <p className="font-mono text-[11px] text-ink/40">{r.code || 'A-EQ'}</p>
                            </div>
                          </div>
                        </Td>
                        <Td><Badge status="done" label={r.category} /></Td>
                        <Td>
                          <div className="font-bold text-brand-950 text-sm">
                            {total} <span className="text-xs font-normal text-ink/50">units</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            {availableUnits} available
                          </p>
                        </Td>
                        <Td>
                          <div className="w-36">
                            <div className="mb-1 flex justify-between text-[11px]">
                              <span className="text-ink/50">Used: {inUse}/{total}</span>
                              <span className="font-bold text-brand-950">{utilPercent}%</span>
                            </div>
                            <Progress value={utilPercent} color={utilPercent > 80 ? 'bg-gold-500' : 'bg-brand-600'} />
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-ink/45">
                              <span>Events: {allocated}</span>
                              <span>·</span>
                              <span className="font-semibold text-gold-700">Rented: {rented}</span>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          {r.rentalAvailable ? (
                            <div>
                              <p className="font-black text-brand-950 text-sm">
                                ETB {(r.rentalRate || 0).toLocaleString()}
                                <span className="text-[10px] font-normal text-ink/50"> /day</span>
                              </p>
                              {r.rentalDeposit > 0 && (
                                <p className="text-[10px] text-ink/45">
                                  Deposit: ETB {Number(r.rentalDeposit).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              Internal Only
                            </span>
                          )}
                        </Td>
                        <Td><Badge status={r.status} label={r.status} /></Td>
                        <Td className="text-xs text-ink/65">{r.location}</Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.rentalAvailable && (
                              <button
                                className={`btn-primary !px-2.5 !py-1 text-xs !bg-gold-500 hover:!bg-gold-600 !text-brand-950 font-bold ${availableUnits === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => openRentForItem(r)}
                                disabled={availableUnits === 0}
                                title={availableUnits === 0 ? 'All units currently deployed or rented' : 'Rent this item to earn revenue'}
                              >
                                <CircleDollarSign size={13} /> Rent Out
                              </button>
                            )}
                            <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => openEdit(r)}>
                              Edit
                            </button>
                          </div>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <EmptyState icon={Package} title="No assets match your search" subtitle="Try changing the category or clear your search query." />
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: RENTALS & REVENUE LEDGER ──────────────── */}
      {activeTab === 'rentals' && (
        <div className="space-y-5 animate-fade-in">
          {/* Sub Header Banner */}
          <div className="rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50/80 via-white to-brand-50/50 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500 text-brand-950 shadow-sm"><CircleDollarSign size={24} /></span>
              <div>
                <p className="text-base font-black text-brand-950">Equipment Rental Operations & Revenue</p>
                <p className="text-xs text-ink/60">Rent out Amen Events equipment, collect rental fees, hold deposits, and manage returns.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-outline !py-2 text-xs" onClick={exportRentalsReport}>
                <Download size={14} /> Export Rentals Ledger
              </button>
              <button className="btn-primary !bg-gold-500 hover:!bg-gold-600 !text-brand-950 font-bold !py-2 text-xs shadow-sm" onClick={openNewRentalGeneric}>
                <Plus size={14} /> New Equipment Rental
              </button>
            </div>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: `All Rentals (${state.rentals?.length || 0})` },
                { key: 'active', label: `Active Hires (${rentalStats.activeCount})` },
                { key: 'overdue', label: `Overdue Returns (${rentalStats.overdueCount})` },
                { key: 'returned', label: 'Completed Returns' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setRentFilter(pill.key)}
                  className={`tab ${rentFilter === pill.key ? 'tab-active' : 'tab-idle'}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
            <SearchBox value={rentQ} onChange={setRentQ} placeholder="Search renter, ref, equipment…" className="w-full sm:w-64" />
          </div>

          {/* Rentals Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-brand-50/50">
                  <tr>
                    <Th>Rental Ref</Th>
                    <Th>Equipment Rented</Th>
                    <Th>Renter / Client</Th>
                    <Th>Rental Period</Th>
                    <Th>Rental Revenue</Th>
                    <Th>Deposit</Th>
                    <Th>Payment</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {filteredRentals.map((r) => {
                    const res = state.resources.find((x) => x.id === r.resourceId)
                    const isOverdue = (r.status === 'active' || r.status === 'overdue') && r.endDate < todayStr

                    return (
                      <tr key={r.id} className="hover:bg-brand-50/40 transition-colors">
                        <Td>
                          <span className="font-mono text-xs font-black text-brand-900 bg-brand-50 px-2 py-1 rounded-md border border-brand-100">
                            {r.rentalCode || 'RNT-2026'}
                          </span>
                          <p className="text-[10px] text-ink/40 mt-1">{r.createdAt || 'Recent'}</p>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <AssetThumb r={res} className="h-8 w-8" />
                            <div>
                              <p className="font-bold text-brand-950 text-xs">{r.resourceName || res?.name || 'Equipment'}</p>
                              <p className="text-[11px] text-ink/50 font-medium">Quantity: {r.qty || 1} units</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div>
                            <p className="font-semibold text-brand-950 text-xs">{r.renterName}</p>
                            <p className="text-[11px] text-ink/50">{r.renterCompany || 'Individual'}</p>
                            {r.renterPhone && <p className="text-[10px] text-ink/40">{r.renterPhone}</p>}
                          </div>
                        </Td>
                        <Td>
                          <div>
                            <p className="text-xs font-semibold text-brand-950">
                              {r.startDate} <span className="text-ink/40">→</span> {r.endDate}
                            </p>
                            <p className="text-[11px] text-ink/50">{r.durationDays || 1} Days duration</p>
                            {isOverdue && (
                              <span className="inline-block mt-0.5 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                                Overdue for return
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div>
                            <p className="text-xs font-black text-emerald-700">
                              ETB {Number(r.totalAmount || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-ink/45">
                              @ ETB {Number(r.dailyRate || 0).toLocaleString()} /day
                            </p>
                          </div>
                        </Td>
                        <Td>
                          <div>
                            <p className="text-xs font-bold text-ink/75">
                              ETB {Number(r.deposit || 0).toLocaleString()}
                            </p>
                            <span className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold ${r.depositStatus === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-gold-100 text-gold-800'}`}>
                              {r.depositStatus === 'refunded' ? 'Refunded' : 'Held in Escrow'}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <span
                            onClick={() => r.paymentStatus !== 'paid' && openPaymentModal(r)}
                            className={`cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-bold ${r.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : r.paymentStatus === 'partial' ? 'bg-gold-100 text-gold-800' : 'bg-red-100 text-red-700'}`}
                            title={r.paymentStatus !== 'paid' ? 'Click to record payment' : ''}
                          >
                            {r.paymentStatus === 'paid' ? 'Paid' : r.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                          </span>
                          <p className="text-[10px] text-ink/40 mt-0.5">{r.paymentMethod || 'Telebirr'}</p>
                        </Td>
                        <Td>
                          <Badge
                            status={r.status === 'returned' ? 'done' : isOverdue ? 'delayed' : 'scheduled'}
                            label={r.status === 'returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                          />
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'active' && (
                              <button
                                className="btn-outline !px-2.5 !py-1 text-xs !bg-brand-50 hover:!bg-brand-100 !text-brand-900 font-semibold"
                                onClick={() => openReturnModal(r)}
                                title="Check in returned equipment and inspect condition"
                              >
                                <RotateCcw size={12} /> Return
                              </button>
                            )}
                            <button
                              className="btn-ghost !px-2 !py-1 text-xs !text-brand-700"
                              onClick={() => downloadRentalAgreement(r)}
                              title="Download Signed Rental Agreement & Invoice PDF"
                            >
                              <FileText size={14} /> Receipt
                            </button>
                            <button
                              className="btn-ghost !px-1.5 !py-1 text-xs !text-red-500 hover:!bg-red-50"
                              onClick={() => {
                                if (window.confirm(`Delete rental booking ${r.rentalCode}?`)) {
                                  deleteRental(r.id)
                                  show('Rental record deleted')
                                }
                              }}
                              title="Delete record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredRentals.length === 0 && (
              <EmptyState
                icon={CircleDollarSign}
                title="No rentals recorded"
                subtitle="Rent out equipment from your inventory to clients or external organizers to start earning revenue."
                action={
                  <button className="btn-primary !bg-gold-500 !text-brand-950 font-bold text-xs" onClick={openNewRentalGeneric}>
                    <Plus size={14} /> Create First Rental
                  </button>
                }
              />
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: ACTIVE EVENT ALLOCATIONS ──────────────── */}
      {activeTab === 'allocations' && (
        <div className="card p-5 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Internal Event Allocations</p>
              <p className="text-xs text-ink/50">Company equipment assigned to in-house client events and summits.</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-ink/50"><AlertTriangle size={13} className="text-gold-500" /> Automatically synchronized with Event Planner</span>
          </div>
          <div className="space-y-2.5">
            {activeAllocations.map((al) => {
              const r = (state.resources || []).find((x) => x.id === al.resourceId)
              const ev = (state.events || []).find((e) => e.id === al.eventId)
              const m = (state.staff || []).find((x) => x.id === al.by)
              return (
                <div key={al.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 p-3 hover:bg-brand-50/20">
                  <AssetThumb r={r} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-950">{r?.name || 'Assigned Asset'} × {al.qty}</p>
                    <p className="text-[11px] text-ink/50">{ev?.name || 'Amen Event'} · Allocated {al.date}</p>
                  </div>
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink/50">
                    by <Avatar name={m?.name || 'Staff'} initials={m?.initials || 'ST'} color={m?.color || 'bg-brand-600'} size="xs" />{m?.name || 'Operations'}
                  </span>
                  <Badge status={r?.status || 'in-use'} label={r?.status || 'in-use'} />
                </div>
              )
            })}
            {activeAllocations.length === 0 && (
              <p className="rounded-lg border border-dashed border-brand-200 p-6 text-center text-xs text-ink/40">
                No active internal event allocations recorded.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: MAINTENANCE SCHEDULE ──────────────── */}
      {activeTab === 'maintenance' && (
        <div className="card p-5 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Maintenance & Equipment Servicing</p>
              <p className="text-xs text-ink/50">Preventative maintenance, lamp replacements, speaker servicing, and firmware audits.</p>
            </div>
            <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setMtOpen(true)}>
              <Plus size={13} /> Schedule Task
            </button>
          </div>
          <div className="space-y-2.5">
            {(state.maintenance || []).length === 0 && (
              <p className="rounded-lg border border-dashed border-brand-200 p-6 text-center text-xs text-ink/40">
                No maintenance tasks scheduled.
              </p>
            )}
            {(state.maintenance || []).map((mt) => {
              const r = (state.resources || []).find((x) => x.id === mt.resourceId)
              const overdue = mt.status !== 'done' && mt.date < todayStr
              return (
                <div key={mt.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 p-3 hover:bg-brand-50/20">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${mt.status === 'done' ? 'bg-brand-100 text-brand-700' : 'bg-gold-100 text-gold-700'}`}>
                    <Wrench size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-950">{r?.name || 'Asset'} — {mt.task}</p>
                    <p className="text-[11px] text-ink/50">{r?.code || '-'} · Scheduled for {mt.date}{overdue ? ' · Overdue' : ''}</p>
                  </div>
                  <Badge status={mt.status === 'done' ? 'done' : 'scheduled'} label={mt.status} />
                  {mt.status !== 'done' && (
                    <button className="btn-outline !px-3 !py-1 text-xs" onClick={() => { completeMaintenance(mt.id); show('Maintenance marked complete') }}>
                      Mark Complete
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: RENT EQUIPMENT OUT ──────────────── */}
      <Modal
        open={rentOpen}
        onClose={() => setRentOpen(false)}
        title="Rent Equipment Out (Earn Revenue)"
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-gold-200 bg-gold-50/60 p-3.5 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-brand-950 font-bold">
              <CircleDollarSign size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-brand-950">Commercial Equipment Rental</p>
              <p className="text-[11px] text-ink/65">Dispatch equipment from inventory to external organizers or clients to generate income.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Equipment Selection */}
            <Field label="Equipment to Rent *" className="col-span-2">
              <select
                className="input font-semibold text-brand-950"
                value={rentForm.resourceId || ''}
                onChange={(e) => handleRentChange('resourceId', e.target.value)}
              >
                <option value="">Select equipment item…</option>
                {state.resources.map((r) => {
                  const total = Number(r.qty) || 1
                  const inUse = (Number(r.allocated) || 0) + (Number(r.rented) || 0)
                  const available = Math.max(0, total - inUse)
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code || 'EQ'}) — {available} available — ETB {(r.rentalRate || 0).toLocaleString()}/day
                    </option>
                  )
                })}
              </select>
              {errors.resourceId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.resourceId}</p>}
            </Field>

            <Field label="Quantity to Rent *">
              <input
                type="number"
                min="1"
                className="input font-bold"
                value={rentForm.qty || 1}
                onChange={(e) => handleRentChange('qty', e.target.value)}
                placeholder="1"
              />
              {errors.qty && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.qty}</p>}
            </Field>

            {/* Renter Type Toggle */}
            <Field label="Customer Type">
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleRentChange('renterType', 'client')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all border ${rentForm.renterType === 'client' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-ink/70 border-brand-200'}`}
                >
                  Amen CRM Client
                </button>
                <button
                  type="button"
                  onClick={() => handleRentChange('renterType', 'external')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all border ${rentForm.renterType === 'external' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-ink/70 border-brand-200'}`}
                >
                  External Organizer
                </button>
              </div>
            </Field>

            {rentForm.renterType === 'client' ? (
              <Field label="Select Client *" className="col-span-2">
                <select
                  className="input font-semibold"
                  value={rentForm.clientId || ''}
                  onChange={(e) => handleRentChange('clientId', e.target.value)}
                >
                  <option value="">Select client company…</option>
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} — {c.contactPerson} ({c.phone || c.email})
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <>
                <Field label="Renter Name *">
                  <input
                    className="input"
                    value={rentForm.renterName || ''}
                    onChange={(e) => handleRentChange('renterName', e.target.value)}
                    placeholder="e.g. Dawit Mengistu"
                  />
                  {errors.renterName && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.renterName}</p>}
                </Field>
                <Field label="Company / Organizer">
                  <input
                    className="input"
                    value={rentForm.renterCompany || ''}
                    onChange={(e) => handleRentChange('renterCompany', e.target.value)}
                    placeholder="e.g. Addis Grand Events PLC"
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    className="input"
                    value={rentForm.renterPhone || ''}
                    onChange={(e) => handleRentChange('renterPhone', e.target.value)}
                    placeholder="+251 911 000 000"
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    className="input"
                    value={rentForm.renterEmail || ''}
                    onChange={(e) => handleRentChange('renterEmail', e.target.value)}
                    placeholder="contact@events.et"
                  />
                </Field>
              </>
            )}

            {/* Schedule */}
            <Field label="Rental Start Date *">
              <input
                type="date"
                className="input"
                value={rentForm.startDate || todayStr}
                onChange={(e) => handleRentChange('startDate', e.target.value)}
              />
              {errors.startDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.startDate}</p>}
            </Field>

            <Field label="Return Date *">
              <input
                type="date"
                className="input"
                value={rentForm.endDate || tomorrowStr}
                onChange={(e) => handleRentChange('endDate', e.target.value)}
              />
              {errors.endDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.endDate}</p>}
            </Field>

            {/* Financials */}
            <Field label="Daily Rental Rate (ETB) *">
              <div className="relative">
                <CircleDollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  type="number"
                  className="input pl-9 font-bold text-brand-950"
                  value={rentForm.dailyRate || ''}
                  onChange={(e) => handleRentChange('dailyRate', e.target.value)}
                  placeholder="25000"
                />
              </div>
              {errors.dailyRate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.dailyRate}</p>}
            </Field>

            <Field label="Security Deposit (ETB)">
              <div className="relative">
                <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  type="number"
                  className="input pl-9 font-semibold"
                  value={rentForm.deposit || ''}
                  onChange={(e) => handleRentChange('deposit', e.target.value)}
                  placeholder="50000"
                />
              </div>
            </Field>

            {/* Live Pricing Breakdown Box */}
            <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-2">Revenue & Pricing Calculation</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-ink/65">
                    {rentForm.qty || 1} Unit(s) × ETB {Number(rentForm.dailyRate || 0).toLocaleString()} × {rentForm.durationDays || 1} Day(s)
                  </p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    + ETB {Number(rentForm.deposit || 0).toLocaleString()} Refundable Security Deposit
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-ink/50">Total Rental Revenue</p>
                  <p className="text-xl font-black text-emerald-700">
                    ETB {Number(rentForm.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment & Terms */}
            <Field label="Payment Status">
              <select
                className="input font-semibold"
                value={rentForm.paymentStatus || 'paid'}
                onChange={(e) => handleRentChange('paymentStatus', e.target.value)}
              >
                <option value="paid">Paid in Full</option>
                <option value="partial">Partial Advance Paid</option>
                <option value="pending">Pending Payment</option>
              </select>
            </Field>

            <Field label="Payment Method">
              <select
                className="input"
                value={rentForm.paymentMethod || 'Telebirr'}
                onChange={(e) => handleRentChange('paymentMethod', e.target.value)}
              >
                <option value="Telebirr">Telebirr</option>
                <option value="Bank Transfer">Bank Transfer (CBE / Awash)</option>
                <option value="Cash">Cash</option>
                <option value="Chapa">Chapa Online</option>
              </select>
            </Field>

            <Field label="Dispatch Condition & Handover Notes" className="col-span-2">
              <textarea
                className="input min-h-[55px] resize-y text-xs"
                value={rentForm.notes || ''}
                onChange={(e) => handleRentChange('notes', e.target.value)}
                placeholder="Condition upon dispatch, cables included, operator instructions, delivery location…"
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button className="btn-outline" onClick={() => setRentOpen(false)}>Cancel</button>
            <button className="btn-primary !bg-gold-500 hover:!bg-gold-600 !text-brand-950 font-black shadow-sm" onClick={submitRental}>
              <CircleDollarSign size={16} /> Confirm Rental & Collect ETB {Number(rentForm.totalAmount || 0).toLocaleString()}
            </button>
          </div>
        </div>
      </Modal>

      {/* ──────────────── MODAL: PROCESS RETURN ──────────────── */}
      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Process Equipment Return"
        width="max-w-lg"
      >
        {returnTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800">Rental Reference</p>
              <p className="text-sm font-bold text-brand-950">{returnTarget.rentalCode} — {returnTarget.resourceName}</p>
              <p className="text-xs text-ink/60 mt-0.5">Rented to {returnTarget.renterName} ({returnTarget.qty} units)</p>
              <p className="text-xs text-ink/50 mt-0.5">Scheduled Return: {returnTarget.endDate} · Deposit Held: ETB {Number(returnTarget.deposit || 0).toLocaleString()}</p>
            </div>

            <Field label="Actual Return Date *">
              <input
                type="date"
                className="input"
                value={returnForm.actualReturnDate || todayStr}
                onChange={(e) => setReturnForm({ ...returnForm, actualReturnDate: e.target.value })}
              />
            </Field>

            <Field label="Equipment Return Condition">
              <select
                className="input"
                value={returnForm.conditionOnReturn || 'Good condition, no damage'}
                onChange={(e) => setReturnForm({ ...returnForm, conditionOnReturn: e.target.value })}
              >
                <option value="Good condition, no damage">Good / Pristine (Full deposit refund)</option>
                <option value="Needs minor cleaning">Minor cleaning required</option>
                <option value="Component damaged / Repair needed">Damaged / Repair required (Deduct fee)</option>
              </select>
            </Field>

            <Field label="Deposit Settlement">
              <select
                className="input font-semibold"
                value={returnForm.depositStatus || 'refunded'}
                onChange={(e) => setReturnForm({ ...returnForm, depositStatus: e.target.value })}
              >
                <option value="refunded">Refund Full Deposit (ETB {Number(returnTarget.deposit || 0).toLocaleString()})</option>
                <option value="held">Hold Deposit Pending Inspection</option>
                <option value="forfeited">Deduct / Forfeit Deposit</option>
              </select>
            </Field>

            <Field label="Check-in Notes">
              <textarea
                className="input min-h-[60px] text-xs"
                value={returnForm.notes || ''}
                onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                placeholder="Inspected by warehouse staff; cables returned; power tested…"
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={() => setReturnOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitReturn}>
                <CheckCircle2 size={16} /> Complete Return & Restock
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── MODAL: RECORD PAYMENT ──────────────── */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record Rental Payment"
        width="max-w-md"
      >
        {paymentTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
              <p className="text-xs font-bold text-emerald-950">Rental {paymentTarget.rentalCode}</p>
              <p className="text-sm font-black text-emerald-700 mt-1">ETB {Number(paymentTarget.totalAmount || 0).toLocaleString()} Fee</p>
              <p className="text-xs text-ink/60 mt-0.5">Renter: {paymentTarget.renterName}</p>
            </div>

            <Field label="Payment Status">
              <select
                className="input font-semibold"
                value={paymentForm.paymentStatus || 'paid'}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
              >
                <option value="paid">Paid in Full</option>
                <option value="partial">Partial Payment</option>
                <option value="pending">Pending</option>
              </select>
            </Field>

            <Field label="Payment Method">
              <select
                className="input"
                value={paymentForm.paymentMethod || 'Telebirr'}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="Telebirr">Telebirr</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Chapa">Chapa</option>
              </select>
            </Field>

            <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={() => setPaymentOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitPayment}>Save Payment</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── 4-STEP ASSET REGISTER WIZARD ──────────────── */}
      <Modal
        open={open}
        onClose={closeAssetWizard}
        title="Register Asset to Inventory"
        width="max-w-2xl"
        dirty={Boolean(form.name || form.code || form.qty || form.unitCost || assetStep > 1)}
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/60">
            <span className={assetStep >= 1 ? 'text-brand-700' : ''}>1. Asset Identity (25%)</span>
            <span className={assetStep >= 2 ? 'text-brand-700' : ''}>2. Inventory & Specs (50%)</span>
            <span className={assetStep >= 3 ? 'text-brand-700' : ''}>3. Financials & Rental (75%)</span>
            <span className={assetStep >= 4 ? 'text-brand-700' : ''}>4. Review & Confirm (100%)</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: assetStep === 1 ? '25%' : assetStep === 2 ? '50%' : assetStep === 3 ? '75%' : '100%',
                background: 'linear-gradient(90deg, #188A2E, #39D353)',
              }}
            />
          </div>
        </div>

        {/* STEP 1: Asset Identity */}
        {assetStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Package size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Asset Identity & Photo</p>
                <p className="text-[11px] text-ink/55">Upload asset photo, specify name, category, and tracking code.</p>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                {form?.image
                  ? <img src={form.image} alt="Asset" className="h-full w-full object-cover" />
                  : <Upload size={24} className="text-brand-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-950">Asset Photo</p>
                <p className="text-xs text-ink/50">Show the item on inventory and allocation views (JPG, PNG - max 5MB).</p>
                <div className="mt-2 flex gap-2">
                  <label className="btn-outline !py-1.5 cursor-pointer text-xs">
                    <Upload size={14} /> Choose image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e, setForm)} />
                  </label>
                  {form?.image && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setForm((x) => ({ ...x, image: '' }))}><Trash2 size={13} /> Remove</button>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Asset Name *" className="col-span-2">
                <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Par LED Lights (10)" />
                {errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}
              </Field>
              <Field label="Category">
                <select className="input" value={form.category || 'Branding'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Asset Code">
                <input className="input font-mono" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="A-LE-01" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={closeAssetWizard}>Cancel</button>
              <button className="btn-primary" onClick={handleAssetNext}>Next: Inventory & Specs →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Inventory & Technical Specs */}
        {assetStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Boxes size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Inventory & Technical Specs</p>
                <p className="text-[11px] text-ink/55">Specify stock quantity, physical warehouse location, and current status.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity *">
                <input type="number" className="input" value={form.qty || ''} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="e.g. 10" />
                {errors.qty && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.qty}</p>}
              </Field>
              <Field label="Status">
                <select className="input" value={form.status || 'available'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {statuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Storage Location" className="col-span-2">
                <input className="input" value={form.location || 'Main Warehouse'} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Warehouse / Stage B" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleAssetBack}>← Back</button>
              <button className="btn-primary" onClick={handleAssetNext}>Next: Financials & Rental →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Procurement & Rental Monetization */}
        {assetStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><CircleDollarSign size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Procurement & Rental Pricing</p>
                <p className="text-[11px] text-ink/55">Set replacement value and configure rental rates to generate revenue.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit Replacement Cost (ETB)">
                <div className="relative">
                  <CircleDollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="number" className="input pl-9" value={form.unitCost || ''} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="e.g. 120000" />
                </div>
              </Field>
              <Field label="Supplier / Vendor">
                <input className="input" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. Addis AV Traders" />
              </Field>

              {/* Rental configuration box */}
              <div className="col-span-2 rounded-xl border border-gold-200 bg-gold-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-brand-950">External Equipment Rental</p>
                    <p className="text-[11px] text-ink/55">Allow this item to be rented out to organizers & clients.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-900">
                    <input
                      type="checkbox"
                      checked={form.rentalAvailable !== false}
                      onChange={(e) => setForm({ ...form, rentalAvailable: e.target.checked })}
                      className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    Available for Rent
                  </label>
                </div>

                {form.rentalAvailable !== false && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gold-200">
                    <Field label="Daily Rental Rate (ETB)">
                      <input
                        type="number"
                        className="input font-bold text-brand-950"
                        value={form.rentalRate || ''}
                        onChange={(e) => setForm({ ...form, rentalRate: e.target.value })}
                        placeholder="e.g. 25000"
                      />
                    </Field>
                    <Field label="Security Deposit (ETB)">
                      <input
                        type="number"
                        className="input"
                        value={form.rentalDeposit || ''}
                        onChange={(e) => setForm({ ...form, rentalDeposit: e.target.value })}
                        placeholder="e.g. 50000"
                      />
                    </Field>
                    <Field label="Rental Terms & Requirements" className="col-span-2">
                      <input
                        className="input text-xs"
                        value={form.rentalTerms || ''}
                        onChange={(e) => setForm({ ...form, rentalTerms: e.target.value })}
                        placeholder="e.g. Includes certified technician; deposit refunded upon inspection."
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleAssetBack}>← Back</button>
              <button className="btn-primary" onClick={handleAssetNext}>Next: Review & Confirm →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Confirm */}
        {assetStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><CheckCircle2 size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Review & Register Asset</p>
                <p className="text-[11px] text-ink/55">Verify asset details, specifications, and rental monetization settings.</p>
              </div>
            </div>
            <Field label="Notes / Specifications">
              <textarea className="input min-h-[60px] resize-y text-xs" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Condition, specifications, serial numbers, maintenance cycle…" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-1">Asset Identity</p>
                <p className="text-sm font-bold text-brand-950">{form.name}</p>
                <p className="text-xs text-ink/60">{form.category || 'Branding'} · {form.qty || 1} Units</p>
                <p className="text-xs text-ink/50 mt-1">Location: {form.location || 'Main Warehouse'}</p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-gold-50/30 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-900 mb-1">Rental Monetization</p>
                <p className="text-sm font-bold text-brand-950">
                  {form.rentalAvailable !== false ? `ETB ${Number(form.rentalRate || 0).toLocaleString()} / day` : 'Internal Use Only'}
                </p>
                {form.rentalDeposit > 0 && <p className="text-xs text-ink/60">Deposit: ETB {Number(form.rentalDeposit).toLocaleString()}</p>}
                <p className="text-xs text-emerald-700 font-medium mt-1">Ready to rent for revenue</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleAssetBack}>← Back</button>
              <button className="btn-primary !px-6" onClick={submit}><CheckCircle2 size={16} /> Register Asset</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── MODAL: EDIT ASSET ──────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Asset & Rental Pricing" width="max-w-2xl">
        {renderFields(editForm, setEditForm)}
        <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      {/* ──────────────── MODAL: SCHEDULE MAINTENANCE ──────────────── */}
      <Modal open={mtOpen} onClose={() => setMtOpen(false)} title="Schedule Maintenance">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asset *" className="col-span-2">
            <select className="input" value={mtForm.resourceId || ''} onChange={(e) => setMtForm({ ...mtForm, resourceId: e.target.value })}>
              <option value="">Select asset…</option>
              {state.resources.filter((r) => r.status !== 'maintenance').map((r) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
            </select>
            {errors.resourceId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.resourceId}</p>}
          </Field>
          <Field label="Task"><input className="input" value={mtForm.task || ''} onChange={(e) => setMtForm({ ...mtForm, task: e.target.value })} placeholder="Routine maintenance" />{errors.task && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.task}</p>}</Field>
          <Field label="Date"><input type="date" className="input" value={mtForm.date || todayStr} onChange={(e) => setMtForm({ ...mtForm, date: e.target.value })} />{errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}</Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setMtOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitMaintenance}><Plus size={14} /> Schedule</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}