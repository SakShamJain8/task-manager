import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskApi } from '../api'
import { CheckSquare, Clock, Circle, Calendar, FolderKanban, AlertTriangle } from 'lucide-react'
import { format, isValid, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import './projects.css'

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',      icon: Circle,       color: 'var(--todo)' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Clock,        color: 'var(--in-progress)' },
  { key: 'DONE',        label: 'Done',        icon: CheckSquare,  color: 'var(--done)' }
]

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function TaskCard({ task, onStatusChange, navigate }) {
  const [updating, setUpdating] = useState(false)
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'

  const handleStatusCycle = async e => {
    e.stopPropagation()
    const order = ['TODO', 'IN_PROGRESS', 'DONE']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    setUpdating(true)
    try {
      const res = await taskApi.updateStatus(task.id, next)
      onStatusChange(res.data)
      toast.success(`Moved to ${next === 'TODO' ? 'To Do' : next === 'IN_PROGRESS' ? 'In Progress' : 'Done'}`)
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const priorityColors = {
    URGENT: 'var(--urgent)',
    HIGH: 'var(--high)',
    MEDIUM: 'var(--medium)',
    LOW: 'var(--low)'
  }

  return (
    <div
      className="task-card"
      style={{ borderLeftColor: priorityColors[task.priority], borderLeftWidth: 3 }}
      onClick={() => navigate(`/projects/${task.projectId}`)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
        <div className="task-card-title" style={{ flex: 1 }}>{task.title}</div>
        <span className={`badge badge-${task.priority.toLowerCase()}`} style={{ flexShrink: 0, fontSize: '0.65rem' }}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--sp-1)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {task.description}
        </p>
      )}

      <div className="task-card-meta">
        <span className="task-card-project">
          <FolderKanban size={11} />{task.projectName}
        </span>
        {task.dueDate && isValid(new Date(task.dueDate)) && (
          <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Status advance button */}
      {task.status !== 'DONE' && (
        <button
          className="btn btn-ghost btn-sm"
          style={{
            marginTop: 'var(--sp-3)',
            width: '100%',
            fontSize: '0.78rem',
            borderColor: 'var(--border-default)',
            justifyContent: 'center'
          }}
          onClick={handleStatusCycle}
          disabled={updating}
        >
          {updating
            ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />Updating...</>
            : task.status === 'TODO'
              ? '→ Mark In Progress'
              : '→ Mark Done'
          }
        </button>
      )}
    </div>
  )
}

export default function MyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL | overdue

  useEffect(() => {
    taskApi.myTasks()
      .then(res => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = updated => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const getFiltered = () => {
    if (filter === 'overdue') {
      return tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE')
    }
    return tasks
  }

  const displayed = getFiltered()
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE').length

  if (loading) return (
    <div>
      <div className="skeleton" style={{ width: 200, height: 36, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 140, height: 18, marginBottom: 32 }} />
      <div className="my-tasks-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
            {overdueCount > 0 && (
              <span style={{ color: 'var(--overdue)', marginLeft: 8 }}>
                · {overdueCount} overdue
              </span>
            )}
          </p>
            <div className="my-tasks-actions">
          <button
            className={`btn ${filter === 'ALL' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setFilter('ALL')}
          >
            All
          </button>
          <button
            className={`btn ${filter === 'overdue' ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setFilter(filter === 'overdue' ? 'ALL' : 'overdue')}
            disabled={overdueCount === 0}
          >
            <AlertTriangle size={14} />
            Overdue {overdueCount > 0 && `(${overdueCount})`}
          </button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CheckSquare size={24} /></div>
            <h3>No tasks assigned to you</h3>
            <p>When a project admin assigns tasks to you, they'll appear here.</p>
          </div>
        </div>
      ) : (
        <div className="my-tasks-grid">
          {COLUMNS.map(col => {
            const colTasks = displayed
              .filter(t => t.status === col.key)
              .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <div className="kanban-col-title" style={{ color: col.color }}>
                    <col.icon size={14} />
                    {col.label}
                  </div>
                  <span className="kanban-col-count">{colTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {colTasks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: 'var(--sp-6) var(--sp-4)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem'
                    }}>
                      No tasks here
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        navigate={navigate}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}