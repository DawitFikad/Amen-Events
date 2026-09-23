import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Workflow, ChevronRight, ChevronLeft, CheckCircle2, Circle, Clock,
  Building2, FileText, Handshake, CalendarDays, KanbanSquare, MapPin,
  Package, Wallet, Ticket, QrCode, BarChart3, Trophy, ArrowRight, History,
  Search, Filter, ExternalLink, Sparkles, AlertCircle, Check, ArrowUpRight,
  TrendingUp, Layers, Compass, UserCheck, Shield, RefreshCw, Send,
  Pencil, Plus, CheckSquare, MessageSquare, User, Tag, Calendar, DollarSign,
  Users, CheckCircle, AlertTriangle, X
} from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, Modal, Field } from '../components/ui'
import { fmt, todayISO } from '../store/data'

export const CANONICAL_STAGES = [
  { id: 0, name: 'Client Created', key: 'client_created', module: 'crm', route: '/erp/crm', actionLabel: 'Open CRM' },
  { id: 1, name: 'Opportunity', key: 'opportunity', module: 'crm', route: '/erp/crm', actionLabel: 'CRM Pipeline' },
  { id: 2, name: 'Quotation', key: 'quotation', module: 'crm', route: '/erp/crm', actionLabel: 'Quotes' },
  { id: 3, name: 'Contract', key: 'contract', module: 'crm', route: '/erp/crm', actionLabel: 'Contracts' },
  { id: 4, name: 'Event Schedule', key: 'event', module: 'events', route: '/erp/admin/events', actionLabel: 'Events' },
  { id: 5, name: 'Tasks & Planning', key: 'tasks', module: 'projects', route: '/erp/projects', actionLabel: 'Tasks' },
  { id: 6, name: 'Venue Allocation', key: 'venue', module: 'venues', route: '/erp/venues', actionLabel: 'Venues' },
  { id: 7, name: 'Resource Allocation', key: 'resources', module: 'resources', route: '/erp/resources', actionLabel: 'Resources' },
  { id: 8, name: 'Budget & Spend', key: 'budget', module: 'finance', route: '/erp/finance', actionLabel: 'Finance' },
  { id: 9, name: 'Registration', key: 'registration', module: 'ticketing', route: '/erp/ticketing', actionLabel: 'Registrations' },
  { id: 10, name: 'QR Tickets', key: 'qr_tickets', module: 'ticketing', route: '/erp/ticketing', actionLabel: 'QR Passes' },
  { id: 11, name: 'On-Site Check-In', key: 'checkin', module: 'checkin', route: '/erp/checkin', actionLabel: 'QR Scanner' },
  { id: 12, name: 'Reports & Invoicing', key: 'reports', module: 'reports', route: '/erp/reports', actionLabel: 'Reports' },
  { id: 13, name: 'Completed', key: 'completed', module: 'events', route: '/erp/admin/events', actionLabel: 'Event Close' },
]

const STAGE_ICONS = [
  Building2, TrendingUp, FileText, Handshake, CalendarDays, KanbanSquare,
  MapPin, Package, Wallet, Ticket, QrCode, CheckCircle2, BarChart3, Trophy,
]

// Phase groupings for high-level visualization & filtering
const PIPELINE_PHASES = [
  { id: 'all', label: 'All Stages', range: [0, 13] },
  { id: 'initiation', label: '1. Initiation', range: [0, 3], color: 'from-blue-500/20 to-sky-500/10 text-sky-700' },
  { id: 'planning', label: '2. Planning', range: [4, 8], color: 'from-amber-500/20 to-yellow-500/10 text-amber-700' },
  { id: 'execution', label: '3. Operations', range: [9, 11], color: 'from-emerald-500/20 to-teal-500/10 text-emerald-700' },
  { id: 'closeout', label: '4. Closeout', range: [12, 13], color: 'from-purple-500/20 to-brand-500/10 text-purple-700' },
]

const EVENT_STATUSES = [
  { id: 'upcoming', label: 'Upcoming', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'planning', label: 'Planning', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'confirmed', label: 'Confirmed', cls: 'bg-brand-100 text-brand-800 border-brand-200' },
  { id: 'ongoing', label: 'In Progress / Ongoing', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'completed', label: 'Completed', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'on-hold', label: 'On Hold', cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'cancelled', label: 'Cancelled', cls: 'bg-red-100 text-red-800 border-red-200' },
]

const EVENT_CATEGORIES = [
  'Conference', 'Exhibition', 'Product Launch', 'Summit', 'Retreat',
  'Gala Dinner', 'Award Ceremony', 'Workshop', 'Festival', 'Wedding', 'Other'
]

export function computeStageChecklist(event, state) {
  if (!event) return []
  const client = state.clients?.find((c) => c.id === event.clientId)
  const venue = state.venues?.find((v) => v.id === event.venueId)
  const tasks = (state.tasks || []).filter((t) => t.eventId === event.id)
  const allocations = (state.allocations || []).filter((a) => a.eventId === event.id)
  const registrations = (state.registrations || []).filter((r) => r.eventId === event.id)
  const checkedInCount = registrations.filter((r) => r.checkedIn).length
  const qrGeneratedCount = registrations.filter((r) => r.qr || r.ticketCode).length
  const contracts = (state.contracts || []).filter((ct) => ct.eventId === event.id || ct.clientId === event.clientId)
  const hasSignedContract = contracts.some((ct) => ct.status === 'signed' || ct.status === 'closed') || client?.stage === 'contract'
  const hasOpportunity = !!client && (client.stage === 'opportunity' || client.stage === 'quotation' || client.stage === 'negotiation' || client.stage === 'contract')
  const budgetVal = Number(event.budget) || 0
  const spentVal = Number(event.spent) || 0

  return CANONICAL_STAGES.map((s, idx) => {
    let done = false
    let detail = ''
    let hint = ''

    switch (s.key) {
      case 'client_created':
        done = !!event.clientId
        detail = client ? `${client.company} (${client.contactPerson || 'Client Contact'})` : 'No client profile linked'
        hint = client ? 'Client linked from CRM directory' : 'Assign client in Event Management'
        break
      case 'opportunity':
        done = hasOpportunity
        detail = client ? `CRM Stage: ${client.stage || 'lead'}` : 'Requires qualified client lead'
        hint = hasOpportunity ? 'Opportunity qualified in CRM' : 'Advance client from lead to opportunity'
        break
      case 'quotation':
        done = budgetVal > 0 || (client?.totalValue && client.totalValue > 0)
        detail = budgetVal > 0 ? `Proposed Budget: ETB ${budgetVal.toLocaleString()}` : (client?.totalValue ? `Client Value: ETB ${client.totalValue.toLocaleString()}` : 'No quote or budget set')
        hint = budgetVal > 0 ? 'Commercial proposal and budget drafted' : 'Define budget in Event Management'
        break
      case 'contract':
        done = hasSignedContract
        detail = hasSignedContract ? (contracts[0]?.ref ? `Signed (${contracts[0].ref})` : 'Client contract signed') : 'Contract pending signature'
        hint = hasSignedContract ? 'Legal agreement confirmed' : 'Record signed contract in CRM'
        break
      case 'event':
        done = !!event.name && !!event.date
        detail = event.date ? `Scheduled: ${event.date}${event.time ? ` at ${event.time}` : ''}` : 'No date set'
        hint = event.date ? 'Core event schedule locked' : 'Set date & schedule'
        break
      case 'tasks':
        done = tasks.length > 0
        detail = tasks.length > 0 ? `${tasks.length} task(s) (${tasks.filter((t) => t.status === 'done').length} done)` : 'No tasks assigned'
        hint = tasks.length > 0 ? 'Team action items assigned' : 'Create tasks in Projects module'
        break
      case 'venue':
        done = !!event.venueId
        detail = venue ? `${venue.name} (${venue.city || 'Addis Ababa'})` : 'No venue allocated'
        hint = venue ? `Capacity: ${venue.capacity?.toLocaleString() || 'N/A'} pax` : 'Book venue in Venue Management'
        break
      case 'resources':
        done = allocations.length > 0
        detail = allocations.length > 0 ? `${allocations.length} inventory asset(s) deployed` : 'No gear allocated'
        hint = allocations.length > 0 ? 'AV & production inventory locked' : 'Allocate equipment in Resources module'
        break
      case 'budget':
        done = budgetVal > 0
        detail = budgetVal > 0 ? `Budget: ETB ${budgetVal.toLocaleString()} (Spend: ETB ${spentVal.toLocaleString()})` : 'No budget set'
        hint = budgetVal > 0 ? `Financial utilization: ${Math.round((spentVal / (budgetVal || 1)) * 100)}%` : 'Set financial baseline in Finance'
        break
      case 'registration':
        done = registrations.length > 0
        detail = registrations.length > 0 ? `${registrations.length} attendee(s) registered` : 'Registration pending'
        hint = registrations.length > 0 ? 'Attendee roster active' : 'Publish passes in Ticketing'
        break
      case 'qr_tickets':
        done = qrGeneratedCount > 0
        detail = qrGeneratedCount > 0 ? `${qrGeneratedCount} verified QR pass(es) generated` : 'No QR tickets issued'
        hint = qrGeneratedCount > 0 ? 'Access credentials generated' : 'Issue QR passes to confirmed attendees'
        break
      case 'checkin':
        done = checkedInCount > 0
        detail = checkedInCount > 0 ? `${checkedInCount} attendee(s) checked in` : 'Doors not opened / 0 check-ins'
        hint = checkedInCount > 0 ? 'On-site entry scanning underway' : 'Validate tickets via Check-In scanner'
        break
      case 'reports':
        done = (event.stage >= 12 || (state.invoices || []).some((i) => i.eventId === event.id))
        detail = (state.invoices || []).some((i) => i.eventId === event.id) ? 'Invoices & financial report generated' : 'Post-event accounting review'
        hint = 'Generate settlement reports and client invoice'
        break
      case 'completed':
        done = event.stage === 13 || event.status === 'completed'
        detail = (event.stage === 13 || event.status === 'completed') ? 'Event officially wrapped & archived' : 'Pending final signoff'
        hint = 'All 14 lifecycle milestones finalized'
        break
      default:
        done = idx <= event.stage
        detail = 'Stage milestone'
        hint = ''
    }

    return {
      ...s,
      done,
      detail,
      hint,
    }
  })
}

export default function WorkflowPage() {
  const { rbac, backendOnline, state, updateEvent, addTask, updateTask, addNotification, logActivity, setDemoFlag } = useData()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(searchParams.get('eventId') || null)
  const [view, setView] = useState('pipeline') // 'pipeline' | 'matrix' | 'tasks' | 'history'
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  // Stage Transition Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTargetStage, setModalTargetStage] = useState(null)
  const [modalActionType, setModalActionType] = useState('advance') // 'advance' | 'revert' | 'jump'
  const [modalNote, setModalNote] = useState('')

  // Quick Edit Event Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Dispatch Action / Task Modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due: todayISO(),
    assigneeId: '',
    stageId: 5,
    notify: true,
  })

  const show = (m, t = 'success') => {
    setToast({ message: m, type: t })
    setTimeout(() => setToast(null), 3200)
  }

  // Derive enriched events list directly from live Supabase / local data store
  const storeEvents = useMemo(() => {
    return (state.events || []).map((e) => {
      const explicitStage = typeof e.stage === 'number' && e.stage >= 0 && e.stage <= 13 ? e.stage : null
      const computedStage = explicitStage !== null ? explicitStage : Math.max(0, Math.min(13, Math.round(((e.progress ?? 0) / 100) * 13)))
      const checklist = computeStageChecklist({ ...e, stage: computedStage }, state)
      const client = state.clients?.find((c) => c.id === e.clientId)
      const venue = state.venues?.find((v) => v.id === e.venueId)
      const pm = state.staff?.find((s) => s.id === e.pmId)
      const completedSteps = checklist.filter((c) => c.done).length

      return {
        id: e.id,
        name: e.name || 'Untitled Event',
        category: e.category || 'Conference',
        date: e.date || 'TBD',
        time: e.time || '09:00',
        endDate: e.endDate || '',
        endTime: e.endTime || '',
        status: e.status || 'upcoming',
        budget: Number(e.budget) || 0,
        spent: Number(e.spent) || 0,
        capacity: Number(e.capacity) || 0,
        clientId: e.clientId,
        venueId: e.venueId,
        pmId: e.pmId,
        description: e.description || '',
        contactName: e.contactName || '',
        contactPhone: e.contactPhone || '',
        client: { company: client?.company || 'No client assigned' },
        venue: { name: venue?.name || 'Unassigned venue' },
        pm: { name: pm?.name || 'Unassigned Lead' },
        stage: computedStage,
        stageName: CANONICAL_STAGES[computedStage]?.name || `Stage ${computedStage + 1}`,
        progress: e.progress ?? Math.round(((computedStage + 1) / 14) * 100),
        completedSteps,
        totalSteps: 14,
        checklist,
      }
    })
  }, [state.events, state.clients, state.venues, state.staff, state.tasks, state.allocations, state.registrations, state.contracts, state.invoices, state.expenses])

  // Filtered event list for sidebar
  const filteredEvents = useMemo(() => {
    return storeEvents.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.client?.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (phaseFilter === 'all') return true
      const phase = PIPELINE_PHASES.find((p) => p.id === phaseFilter)
      if (phase) {
        return e.stage >= phase.range[0] && e.stage <= phase.range[1]
      }
      return true
    })
  }, [storeEvents, searchQuery, phaseFilter])

  // Selected event
  const selected = useMemo(() => {
    if (selectedId) {
      const found = storeEvents.find((e) => e.id === selectedId)
      if (found) return found
    }
    return storeEvents[0] || null
  }, [storeEvents, selectedId])

  // Synchronize selection with URL search param
  const selectEvent = (evt) => {
    setSelectedId(evt.id)
    setSearchParams({ eventId: evt.id }, { replace: true })
  }

  // Active tasks for the selected event
  const eventTasks = useMemo(() => {
    if (!selected?.id) return []
    return (state.tasks || []).filter((t) => t.eventId === selected.id)
  }, [state.tasks, selected?.id])

  // Real-time event activities from Supabase ActivityLog and workflow logs
  const eventActivities = useMemo(() => {
    if (!selected) return []
    const evName = (selected.name || '').toLowerCase()
    return (state.activities || []).filter((a) => {
      const txt = (a.text || '').toLowerCase()
      return txt.includes(evName) || txt.includes(selected.id.toLowerCase()) || a.type === 'workflow'
    }).slice(0, 30)
  }, [state.activities, selected])

  // Trigger modal for stage transition
  const initiateTransition = (targetStage, actionType = 'advance') => {
    setModalTargetStage(targetStage)
    setModalActionType(actionType)
    setModalNote('')
    setModalOpen(true)
  }

  // Execute stage update with full Supabase PostgreSQL persistence
  const commitStageTransition = async () => {
    if (!selected || modalTargetStage === null) return
    setBusy(true)

    const nextStageId = Math.max(0, Math.min(13, modalTargetStage))
    const nextProgress = Math.round(((nextStageId + 1) / 14) * 100)
    const nextStatus = nextStageId === 13 ? 'completed' : selected.status === 'completed' ? 'ongoing' : selected.status
    const stageName = CANONICAL_STAGES[nextStageId].name

    try {
      // 1. Direct write to Supabase Postgres DB & reactive local state
      await updateEvent(selected.id, {
        stage: nextStageId,
        progress: nextProgress,
        status: nextStatus,
      })

      // 2. Best-effort backend workflow log sync if backend available (silent failure safe)
      if (backendOnline && api?.workflow) {
        if (modalActionType === 'advance') {
          await api.workflow.advance(selected.id, modalNote)
        } else if (modalActionType === 'revert') {
          await api.workflow.revert(selected.id, modalNote)
        } else {
          await api.workflow.setStage(selected.id, nextStageId, modalNote)
        }
      }

      // 3. Record in Supabase Activity table
      const logText = modalNote
        ? `Workflow: ${selected.name} advanced to Stage ${nextStageId + 1} (${stageName}) — "${modalNote}"`
        : `Workflow: ${selected.name} set to Stage ${nextStageId + 1} (${stageName})`
      logActivity(logText, 'workflow')

      // 4. Notify PM or Client
      if (selected.pmId) {
        addNotification({
          text: `Workflow updated: "${selected.name}" is now at Stage ${nextStageId + 1}: ${stageName}`,
          type: 'workflow',
          userId: selected.pmId,
        })
      }

      show(`Event successfully updated to Stage ${nextStageId + 1}: ${stageName}`)
      setModalOpen(false)
    } catch (err) {
      console.error('Stage transition error:', err)
      show('Failed to update stage in database', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Quick next / prev helpers
  const handleQuickAdvance = () => {
    if (!selected || selected.stage >= 13) return
    initiateTransition(selected.stage + 1, 'advance')
  }

  const handleQuickRevert = () => {
    if (!selected || selected.stage <= 0) return
    initiateTransition(selected.stage - 1, 'revert')
  }

  // Live Event Status update (Supabase Postgres write)
  const handleStatusChange = async (newStatus) => {
    if (!selected || selected.status === newStatus) return
    setBusy(true)
    try {
      const updates = { status: newStatus }
      if (newStatus === 'completed') {
        updates.stage = 13
        updates.progress = 100
      }
      await updateEvent(selected.id, updates)
      logActivity(`Event "${selected.name}" status updated to ${newStatus}`, 'event')

      if (selected.pmId) {
        addNotification({
          text: `Status for "${selected.name}" changed to ${newStatus.toUpperCase()}`,
          type: 'event',
          userId: selected.pmId,
        })
      }

      show(`Status updated to "${newStatus}"`)
    } catch (err) {
      show('Failed to update event status', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Open Quick Edit Modal
  const openEditModal = () => {
    if (!selected) return
    setEditForm({
      name: selected.name,
      category: selected.category,
      status: selected.status,
      date: selected.date,
      time: selected.time,
      endDate: selected.endDate,
      endTime: selected.endTime,
      venueId: selected.venueId || '',
      clientId: selected.clientId || '',
      pmId: selected.pmId || '',
      budget: selected.budget || 0,
      capacity: selected.capacity || 0,
      description: selected.description || '',
      contactName: selected.contactName || '',
      contactPhone: selected.contactPhone || '',
    })
    setEditModalOpen(true)
  }

  // Save Event Edit to Supabase
  const handleSaveEdit = async () => {
    if (!selected || !editForm.name?.trim()) {
      show('Please fill out this field: Event name', 'warn')
      return
    }
    setBusy(true)
    try {
      await updateEvent(selected.id, {
        ...editForm,
        budget: Number(editForm.budget) || 0,
        capacity: Number(editForm.capacity) || 0,
      })
      logActivity(`Event details updated for "${editForm.name}"`, 'event')
      show('Event details saved to database')
      setEditModalOpen(false)
    } catch (err) {
      show('Failed to save changes to database', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Open Action Dispatch Modal
  const openActionModal = () => {
    if (!selected) return
    setActionForm({
      title: '',
      description: '',
      priority: 'medium',
      due: todayISO(),
      assigneeId: selected.pmId || state.staff[0]?.id || '',
      stageId: selected.stage || 5,
      notify: true,
    })
    setActionModalOpen(true)
  }

  // Dispatch Action / Task to Person (Supabase Task + Notification + Activity write)
  const handleDispatchAction = async () => {
    if (!actionForm.title?.trim()) {
      show('Please fill out this field: Action title', 'warn')
      return
    }
    if (!actionForm.assigneeId) {
      show('Please select a person to assign this action to', 'warn')
      return
    }
    setBusy(true)
    try {
      const assignedPerson = state.staff?.find((s) => s.id === actionForm.assigneeId)
      const personName = assignedPerson?.name || 'Team Member'

      // 1. Write Task to Supabase Task Table
      const taskPayload = {
        title: actionForm.title.trim(),
        description: actionForm.description.trim() || `Workflow Action for ${selected.name} (Stage ${actionForm.stageId + 1}: ${CANONICAL_STAGES[actionForm.stageId]?.name})`,
        eventId: selected.id,
        assigneeId: actionForm.assigneeId,
        priority: actionForm.priority,
        status: 'todo',
        due: actionForm.due || todayISO(),
        progress: 0,
      }
      await addTask(taskPayload)

      // 2. Dispatch Live Notification to Assigned Person in Supabase
      if (actionForm.notify) {
        addNotification({
          text: `Action Assigned by Workflow: "${actionForm.title}" for event "${selected.name}". Due: ${actionForm.due}`,
          type: 'task',
          userId: actionForm.assigneeId,
        })
      }

      // 3. Record Audit Trail in Supabase Activity Table
      logActivity(`Workflow Action dispatched to ${personName}: "${actionForm.title}" (${selected.name})`, 'task')

      show(`Action dispatched to ${personName}!`)
      setActionModalOpen(false)
      setView('tasks')
    } catch (err) {
      show('Failed to dispatch action item', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Toggle Task Completion Live
  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    const nextProgress = nextStatus === 'done' ? 100 : 0
    await updateTask(task.id, { status: nextStatus, progress: nextProgress })
    logActivity(`Task "${task.title}" marked as ${nextStatus}`, 'task')
    show(`Task marked as ${nextStatus}`)
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = storeEvents.length
    const completed = storeEvents.filter((e) => e.stage === 13 || e.status === 'completed').length
    const inProgress = total - completed
    const avgProgress = total > 0 ? Math.round(storeEvents.reduce((acc, e) => acc + (e.progress || 0), 0) / total) : 0
    return { total, completed, inProgress, avgProgress }
  }, [storeEvents])

  return (
    <div className="space-y-6">
      {/* Top Page Header with Live Status Badges & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Event Workflow & Governance Center"
          subtitle="Real-time 14-stage lifecycle pipeline, event status control, and action item dispatch with live Supabase database sync."
          icon={Workflow}
        />
        <div className="flex flex-wrap items-center gap-2">
          {selected && (
            <>
              <button
                onClick={openActionModal}
                className="btn-primary flex items-center gap-1.5 text-xs !py-2 px-3.5 shadow-sm"
              >
                <Send size={13} /> Dispatch Action
              </button>
              <button
                onClick={openEditModal}
                className="btn-outline flex items-center gap-1.5 text-xs !py-2 px-3"
              >
                <Pencil size={13} /> Edit Event
              </button>
            </>
          )}
          <Link to="/erp/admin/events" className="btn-outline flex items-center gap-1.5 text-xs !py-2">
            <CalendarDays size={13} /> Events Directory
          </Link>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Events In Pipeline</p>
              <p className="mt-1 text-2xl font-black text-brand-950">{stats.total}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Layers size={18} />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-ink/50">Live Supabase tracked records</div>
        </div>

        <div className="card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Active In-Flight</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{stats.inProgress}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-ink/50">Currently in planning or execution</div>
        </div>

        <div className="card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Completed & Closed</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{stats.completed}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-ink/50">Full 14 stages finalized</div>
        </div>

        <div className="card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Average Progress</p>
              <p className="mt-1 text-2xl font-black text-brand-700">{stats.avgProgress}%</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
              <Compass size={18} />
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
            <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Event Navigator + Pipeline Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: Event Selection Drawer */}
        <div className="space-y-3">
          <div className="card flex flex-col p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-brand-100 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                Registered Events ({filteredEvents.length})
              </span>
              <span className="chip bg-brand-100 text-[10px] font-semibold text-brand-800">
                Live Postgres Sync
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event, client or category…"
                className="w-full rounded-lg border border-brand-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Phase Filters */}
            <div className="flex flex-wrap gap-1">
              {PIPELINE_PHASES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhaseFilter(p.id)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                    phaseFilter === p.id
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-brand-50 text-ink/60 hover:bg-brand-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="max-h-[640px] overflow-y-auto space-y-1.5 pr-0.5">
              {filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-xs text-ink/40">
                  No matching events found.
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selected?.id === evt.id
                  const isDone = evt.stage === 13 || evt.status === 'completed'
                  const StageIcon = STAGE_ICONS[evt.stage] || Circle

                  return (
                    <button
                      key={evt.id}
                      onClick={() => selectEvent(evt)}
                      className={`group flex w-full flex-col rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                          : 'border-brand-100/70 bg-white hover:border-brand-300 hover:bg-brand-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-brand-950 group-hover:text-brand-700">
                          {evt.name}
                        </span>
                        <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700' : 'text-brand-700'}`}>
                          {evt.progress}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-ink/50">
                        <span className="truncate">{evt.client?.company || 'No client'}</span>
                        <span>{evt.date || 'TBD'}</span>
                      </div>

                      {/* Stage indicator chip */}
                      <div className="mt-2 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-brand-200 text-brand-900'
                            }`}
                          >
                            <StageIcon size={10} />
                          </span>
                          <span className="truncate text-[10px] font-medium text-brand-900">
                            Stage {evt.stage + 1}: {evt.stageName}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-ink/40">
                          {evt.status}
                        </span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-brand-100">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-500' : 'bg-brand-600'
                          }`}
                          style={{ width: `${evt.progress}%` }}
                        />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Active Event Pipeline Detail Workspace */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Event Header Banner Card with Live Status Selector & Controls */}
              <div className="card border-brand-200/80 bg-gradient-to-br from-white via-white to-brand-50/30 p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-brand-950 tracking-tight">{selected.name}</h2>
                      <span className="chip bg-brand-100 text-brand-800 text-[11px] font-bold">
                        Stage {selected.stage + 1} of 14: {CANONICAL_STAGES[selected.stage]?.name}
                      </span>
                    </div>

                    {/* Quick Status Control Dropdown */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-ink/50">Event Status:</span>
                      <select
                        value={selected.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={busy}
                        className="rounded-lg border border-brand-300 bg-white px-2.5 py-1 text-xs font-bold text-brand-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {EVENT_STATUSES.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={openEditModal}
                        className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1 text-brand-700 hover:bg-brand-100"
                        title="Edit event details"
                      >
                        <Pencil size={12} /> Edit Details
                      </button>

                      <button
                        onClick={openActionModal}
                        className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1 text-brand-700 hover:bg-brand-100"
                        title="Assign new action item"
                      >
                        <Plus size={12} /> Assign Action
                      </button>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-ink/65 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={13} className="text-brand-600" />
                        <strong>Client:</strong> {selected.client?.company || 'No client assigned'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-brand-600" />
                        <strong>Venue:</strong> {selected.venue?.name || 'Unassigned'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} className="text-brand-600" />
                        <strong>Date:</strong> {selected.date || 'TBD'} ({selected.time || '09:00'})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck size={13} className="text-brand-600" />
                        <strong>Lead:</strong> {selected.pm?.name || 'Unassigned'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet size={13} className="text-brand-600" />
                        <strong>Budget:</strong> ETB {(selected.budget || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Stage Advance / Revert Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleQuickRevert}
                      disabled={busy || selected.stage <= 0}
                      className="btn-outline flex items-center gap-1 text-xs !py-2 px-3 disabled:opacity-40"
                      title="Revert to previous stage"
                    >
                      <ChevronLeft size={14} /> Previous Stage
                    </button>
                    <button
                      onClick={handleQuickAdvance}
                      disabled={busy || selected.stage >= 13}
                      className="btn-primary flex items-center gap-1.5 text-xs !py-2 px-4 shadow-sm disabled:opacity-40"
                    >
                      {busy ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {selected.stage >= 13 ? 'Event Completed' : 'Advance Next Stage'}
                    </button>
                  </div>
                </div>

                {/* Main Visual Progress Tracker Bar */}
                <div className="pt-3 border-t border-brand-100">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-brand-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      Lifecycle Progress: Stage {selected.stage + 1} of 14 ({CANONICAL_STAGES[selected.stage]?.name})
                    </span>
                    <span className="text-brand-800">
                      {selected.completedSteps} of 14 prerequisites verified ({selected.progress}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-brand-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${selected.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setView('pipeline')}
                    className={`tab flex items-center gap-1.5 ${view === 'pipeline' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <Workflow size={14} /> 14-Stage Pipeline
                  </button>
                  <button
                    onClick={() => setView('matrix')}
                    className={`tab flex items-center gap-1.5 ${view === 'matrix' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <Layers size={14} /> Phase Matrix
                  </button>
                  <button
                    onClick={() => setView('tasks')}
                    className={`tab flex items-center gap-1.5 ${view === 'tasks' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <CheckSquare size={14} /> Actions & Team Tasks ({eventTasks.length})
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className={`tab flex items-center gap-1.5 ${view === 'history' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <History size={14} /> Live Supabase Activities ({eventActivities.length})
                  </button>
                </div>

                {/* Quick module direct link */}
                <div className="text-xs text-ink/50 flex items-center gap-2">
                  <span>Current Module:</span>
                  <Link
                    to={CANONICAL_STAGES[selected.stage]?.route || '/erp/dashboard'}
                    className="inline-flex items-center gap-1 text-brand-700 font-bold hover:underline"
                  >
                    {CANONICAL_STAGES[selected.stage]?.actionLabel} <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* VIEW 1: Interactive 14-Stage Stepper View */}
              {view === 'pipeline' && (
                <div className="card divide-y divide-brand-50 overflow-hidden shadow-sm">
                  {selected.checklist?.map((step, idx) => {
                    const Icon = STAGE_ICONS[idx] || Circle
                    const isCurrent = idx === selected.stage
                    const isPast = idx < selected.stage
                    const isFuture = idx > selected.stage

                    return (
                      <div
                        key={step.id}
                        className={`group relative flex flex-col gap-3 p-4 transition md:flex-row md:items-center md:justify-between ${
                          isCurrent
                            ? 'bg-gradient-to-r from-amber-50/60 via-brand-50/30 to-white ring-1 ring-inset ring-amber-300'
                            : isPast
                            ? 'bg-white hover:bg-brand-50/20'
                            : 'bg-white/60 opacity-60 hover:opacity-100 hover:bg-brand-50/20'
                        }`}
                      >
                        {/* Step indicator circle and info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition ${
                              isPast
                                ? 'bg-brand-700 text-white'
                                : isCurrent
                                ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                                : 'bg-brand-100 text-brand-400'
                            }`}
                          >
                            {isPast ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
                          </span>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                                Stage {idx + 1}
                              </span>
                              <h3
                                className={`text-sm font-bold tracking-tight ${
                                  isCurrent
                                    ? 'text-brand-950 font-black'
                                    : isPast
                                    ? 'text-brand-900'
                                    : 'text-ink/60'
                                }`}
                              >
                                {step.name}
                              </h3>

                              {isCurrent && (
                                <span className="chip bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                                  Current Stage
                                </span>
                              )}
                              {isPast && (
                                <span className="chip bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Completed
                                </span>
                              )}
                              {step.done ? (
                                <span className="chip bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                                  ✓ Criteria Met
                                </span>
                              ) : (
                                <span className="chip bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
                                  ⚠ Action Pending
                                </span>
                              )}
                            </div>

                            {/* Prerequisite detail info */}
                            <p className="text-xs text-ink/70 font-medium">{step.detail}</p>
                            <p className="text-[11px] text-ink/40 italic">{step.hint}</p>
                          </div>
                        </div>

                        {/* Action buttons on the right */}
                        <div className="flex items-center gap-2 shrink-0 md:self-center">
                          {/* Jump directly to module */}
                          <Link
                            to={step.route}
                            className="btn-outline !py-1.5 px-2.5 text-[11px] flex items-center gap-1 hover:border-brand-500 hover:text-brand-700"
                            title={`Navigate to ${step.module.toUpperCase()}`}
                          >
                            <span>{step.actionLabel}</span>
                            <ExternalLink size={11} />
                          </Link>

                          {/* Jump to stage button */}
                          {isFuture && (
                            <button
                              onClick={() => initiateTransition(idx, 'jump')}
                              disabled={busy}
                              className="btn-primary !py-1.5 px-3 text-[11px] shadow-sm"
                            >
                              Jump to Stage {idx + 1}
                            </button>
                          )}

                          {isPast && (
                            <button
                              onClick={() => initiateTransition(idx, 'revert')}
                              disabled={busy}
                              className="btn-outline !py-1.5 px-3 text-[11px] text-ink/60 hover:text-brand-700"
                            >
                              Revisit Stage
                            </button>
                          )}

                          {isCurrent && (
                            <button
                              onClick={handleQuickAdvance}
                              disabled={busy || selected.stage >= 13}
                              className="btn-primary !py-1.5 px-3 text-[11px] shadow-sm bg-brand-700 hover:bg-brand-800"
                            >
                              Complete & Advance <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* VIEW 2: Phase Matrix / Kanban Board View */}
              {view === 'matrix' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PIPELINE_PHASES.filter((p) => p.id !== 'all').map((phase) => {
                    const phaseStages = CANONICAL_STAGES.slice(phase.range[0], phase.range[1] + 1)
                    const isPhaseActive = selected.stage >= phase.range[0] && selected.stage <= phase.range[1]
                    const isPhaseComplete = selected.stage > phase.range[1]

                    return (
                      <div
                        key={phase.id}
                        className={`card flex flex-col p-4 space-y-3 ${
                          isPhaseActive ? 'border-brand-500 shadow-md ring-1 ring-brand-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-brand-100 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-950">{phase.label}</h4>
                          <span
                            className={`chip text-[10px] font-bold ${
                              isPhaseComplete
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPhaseActive
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-brand-100 text-ink/50'
                            }`}
                          >
                            {isPhaseComplete ? 'Done' : isPhaseActive ? 'Active' : 'Upcoming'}
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          {phaseStages.map((st) => {
                            const stepCheck = selected.checklist?.find((c) => c.id === st.id)
                            const isCurrent = selected.stage === st.id
                            const isPast = selected.stage > st.id
                            const Icon = STAGE_ICONS[st.id] || Circle

                            return (
                              <div
                                key={st.id}
                                onClick={() => initiateTransition(st.id, isPast ? 'revert' : 'jump')}
                                className={`cursor-pointer rounded-lg border p-2.5 transition ${
                                  isCurrent
                                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                                    : isPast
                                    ? 'border-brand-100 bg-white hover:border-brand-300'
                                    : 'border-brand-100/60 bg-brand-50/20 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Icon size={12} className={isCurrent ? 'text-amber-600' : 'text-brand-600'} />
                                    <span className="truncate text-xs font-bold text-brand-950">
                                      {st.id + 1}. {st.name}
                                    </span>
                                  </div>
                                  {stepCheck?.done && <Check size={12} className="text-emerald-600 shrink-0" />}
                                </div>
                                <p className="mt-1 truncate text-[10px] text-ink/50">{stepCheck?.detail}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* VIEW 3: Actions & Team Tasks View */}
              {view === 'tasks' && (
                <div className="card p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-100 pb-3">
                    <div>
                      <h3 className="font-bold text-brand-950 text-sm">Active Action Items & Team Dispatch</h3>
                      <p className="text-xs text-ink/45">Assigned tasks and deliverables for {selected.name}</p>
                    </div>
                    <button
                      onClick={openActionModal}
                      className="btn-primary text-xs !py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Plus size={13} /> Dispatch New Action
                    </button>
                  </div>

                  {eventTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-brand-200 py-10 text-center text-xs text-ink/40">
                      No action items assigned to this event yet. Click "Dispatch New Action" above to assign tasks to team members.
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-50">
                      {eventTasks.map((t) => {
                        const assignee = state.staff?.find((s) => s.id === t.assigneeId)
                        const isDone = t.status === 'done'

                        return (
                          <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                onClick={() => toggleTaskStatus(t)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-brand-300 bg-white hover:border-brand-500'
                                }`}
                                title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                              >
                                {isDone && <Check size={13} strokeWidth={3} />}
                              </button>
                              <div className="space-y-0.5 min-w-0">
                                <p className={`text-xs font-bold text-brand-950 ${isDone ? 'line-through text-ink/40' : ''}`}>
                                  {t.title}
                                </p>
                                {t.description && (
                                  <p className="text-[11px] text-ink/55 truncate max-w-md">{t.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink/45 pt-0.5">
                                  <span className="font-semibold text-brand-800">
                                    Assigned to: {assignee?.name || 'Team Member'}
                                  </span>
                                  <span>·</span>
                                  <span>Due: {t.due || 'TBD'}</span>
                                  <span>·</span>
                                  <span className={`chip text-[9px] font-bold uppercase ${
                                    t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    t.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                    'bg-brand-50 text-brand-800'
                                  }`}>
                                    {t.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className={`chip text-[10px] font-bold ${
                                isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: Audit Trail & Live Activities View */}
              {view === 'history' && (
                <div className="card p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-100 pb-3">
                    <div>
                      <h3 className="font-bold text-brand-950 text-sm">Live Supabase Governance Activity Log</h3>
                      <p className="text-xs text-ink/45">Real-time audit activities and transitions recorded for {selected.name}</p>
                    </div>
                    <span className="chip bg-brand-100 text-brand-800 text-xs font-bold">
                      {eventActivities.length} activities logged
                    </span>
                  </div>

                  {eventActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-brand-200 py-10 text-center text-xs text-ink/40">
                      No activity records found for this event yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {eventActivities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 rounded-xl border border-brand-100/80 bg-white p-3 shadow-sm"
                        >
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                            <Activity size={13} />
                          </span>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-brand-950">
                                {act.text}
                              </p>
                              <span className="text-[10px] text-ink/40">
                                {act.at || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString() : 'Recent')}
                              </span>
                            </div>
                            <span className="chip text-[9px] bg-brand-50 text-brand-800 font-semibold uppercase">
                              {act.type || 'workflow'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center p-12 text-center text-ink/50">
              <Compass size={36} className="text-brand-300 mb-3" />
              <p className="font-bold text-brand-950">No event selected</p>
              <p className="text-xs text-ink/45 mt-1">Select an event from the left list to view and manage its 14-stage lifecycle pipeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Transition Note Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Confirm Stage Transition · ${selected?.name || 'Event'}`}
        width="max-w-lg"
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-brand-50/80 p-4 border border-brand-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Target Transition</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink/50">From Current:</p>
                <p className="text-sm font-bold text-brand-900">
                  Stage {((selected?.stage ?? 0) + 1)}: {selected?.stageName}
                </p>
              </div>
              <ArrowRight size={18} className="text-brand-500 shrink-0" />
              <div className="text-right">
                <p className="text-xs text-ink/50">To New Stage:</p>
                <p className="text-sm font-black text-brand-700">
                  Stage {(modalTargetStage ?? 0) + 1}: {CANONICAL_STAGES[modalTargetStage ?? 0]?.name}
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Transition Note / Justification (Optional)"
            hint="Record remarks, approval details, or client confirmations for the governance audit trail."
          >
            <textarea
              rows={3}
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="e.g. Venue deposit confirmed, client contract signed, budget approved by board..."
              className="w-full rounded-xl border border-brand-200 bg-white p-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={commitStageTransition}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy && <RefreshCw size={13} className="animate-spin" />}
              Confirm Transition
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Edit Event Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Event · ${selected?.name || ''}`}
        width="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Event Name *" className="sm:col-span-2">
              <input
                type="text"
                className="input"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g. Annual Tech Summit 2026"
              />
            </Field>

            <Field label="Category">
              <select
                className="input"
                value={editForm.category || 'Conference'}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                className="input"
                value={editForm.status || 'upcoming'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                {EVENT_STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Start Date">
              <input
                type="date"
                className="input"
                value={editForm.date || ''}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </Field>

            <Field label="Start Time">
              <input
                type="time"
                className="input"
                value={editForm.time || '09:00'}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              />
            </Field>

            <Field label="Client Profile">
              <select
                className="input"
                value={editForm.clientId || ''}
                onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
              >
                <option value="">Unassigned client</option>
                {(state.clients || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.company} ({c.contactPerson})</option>
                ))}
              </select>
            </Field>

            <Field label="Venue Booking">
              <select
                className="input"
                value={editForm.venueId || ''}
                onChange={(e) => setEditForm({ ...editForm, venueId: e.target.value })}
              >
                <option value="">Unassigned venue</option>
                {(state.venues || []).map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.city || 'Addis Ababa'})</option>
                ))}
              </select>
            </Field>

            <Field label="Assigned Event Lead / PM">
              <select
                className="input"
                value={editForm.pmId || ''}
                onChange={(e) => setEditForm({ ...editForm, pmId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {(state.staff || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role || s.dept})</option>
                ))}
              </select>
            </Field>

            <Field label="Budget (ETB)">
              <input
                type="number"
                className="input"
                value={editForm.budget || ''}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                placeholder="e.g. 500000"
              />
            </Field>

            <Field label="Target Capacity (pax)">
              <input
                type="number"
                className="input"
                value={editForm.capacity || ''}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                placeholder="e.g. 1500"
              />
            </Field>

            <Field label="Contact Phone">
              <input
                type="text"
                className="input"
                value={editForm.contactPhone || ''}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                placeholder="+251 9XX XXX XXX"
              />
            </Field>

            <Field label="Event Description / Objectives" className="sm:col-span-2">
              <textarea
                rows={2}
                className="input min-h-[60px]"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Scope, key VIPs, themes, deliverables..."
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-100">
            <button
              onClick={() => setEditModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy && <RefreshCw size={13} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Dispatch Action Item to Person Modal */}
      <Modal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Dispatch Action Item · ${selected?.name || ''}`}
        width="max-w-lg"
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-3 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Send size={16} />
            </span>
            <div>
              <p className="text-xs font-bold text-brand-950">Workflow Governance Action</p>
              <p className="text-[11px] text-ink/55">Create a task, assign to a person, and dispatch an instant live notification.</p>
            </div>
          </div>

          <Field label="Action / Task Title *">
            <input
              type="text"
              className="input"
              value={actionForm.title}
              onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
              placeholder="e.g. Sign Venue Contract, Finalize Catering Tasting, Inspect Stage Rigging..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Assign To (Requested Person) *">
              <select
                className="input"
                value={actionForm.assigneeId}
                onChange={(e) => setActionForm({ ...actionForm, assigneeId: e.target.value })}
              >
                <option value="">Select team member…</option>
                {(state.staff || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role || s.dept})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Related Lifecycle Stage">
              <select
                className="input"
                value={actionForm.stageId}
                onChange={(e) => setActionForm({ ...actionForm, stageId: Number(e.target.value) })}
              >
                {CANONICAL_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    Stage {st.id + 1}: {st.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                className="input"
                value={actionForm.priority}
                onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority (Immediate Action)</option>
              </select>
            </Field>

            <Field label="Due Date">
              <input
                type="date"
                className="input"
                value={actionForm.due}
                onChange={(e) => setActionForm({ ...actionForm, due: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Detailed Instructions / Deliverables">
            <textarea
              rows={3}
              className="input min-h-[60px]"
              value={actionForm.description}
              onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
              placeholder="Provide context, required documents, vendor contacts, or deadlines..."
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={actionForm.notify}
              onChange={(e) => setActionForm({ ...actionForm, notify: e.target.checked })}
              className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs font-semibold text-brand-900">
              Dispatch instant live alert notification to assignee in Supabase
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-100">
            <button
              onClick={() => setActionModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleDispatchAction}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              Dispatch Action Item
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
