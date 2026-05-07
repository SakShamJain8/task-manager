import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectApi, taskApi } from '../api'
import { useAuth } from './AuthContext'
import {
  Plus, ArrowLeft, Users, CheckSquare, Trash2,
  UserMinus, UserPlus, FolderKanban, Calendar, Edit3, X
} from 'lucide-react'
import { format, isValid, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import TaskModal from './tasks'
import './projects.css'

// ——— Helpers ———
const fmtDate = d => d && isValid(new Date(d)) ? format(new Date(d), 'MMM d, yyyy') : '—'
const initials = name => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function StatusBadge({ status }) {
  const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' }
  const label = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
  return <span className={`badge ${map[status]}`}>{label[status]}</span>
}

// ——— Add Member Modal ———
function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await projectApi.addMember(projectId, { email: email.trim(), role })
      toast.success('Member added!')
      onAdded(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Add Member</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">User Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              <p className="text-muted text-sm" style={{ marginTop: 'var(--sp-2)' }}>
                The user must already have a Task Manager account.
              </p>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-4)', marginBottom: 0 }}>
              <label className="form-label">Project Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Adding...</> : <><UserPlus size={15} />Add Member</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditMemberRoleModal({ projectId, member, onClose, onUpdated }) {
  const [role, setRole] = useState(member.role)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await projectApi.updateMemberRole(projectId, member.user.id, { role })
      toast.success('Member role updated')
      onUpdated(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Edit Member Role</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Member</label>
              <div className="text-muted text-sm">{member.user.name} ({member.user.email})</div>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--sp-4)', marginBottom: 0 }}>
              <label className="form-label">Project Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Inline Status Select ———
function StatusSelect({ task, canEditStatus, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  if (!canEditStatus) return <StatusBadge status={task.status} />

  const handleChange = async e => {
    const newStatus = e.target.value
    setUpdating(true)
    try {
      const res = await taskApi.updateStatus(task.id, newStatus)
      onStatusChange(res.data)
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const colorMap = { TODO: 'var(--todo)', IN_PROGRESS: 'var(--in-progress)', DONE: 'var(--done)' }

  return (
    <select
      className="status-select"
      value={task.status}
      onChange={handleChange}
      disabled={updating}
      style={{ color: colorMap[task.status] }}
      onClick={e => e.stopPropagation()}
    >
      <option value="TODO" style={{ color: 'var(--todo)' }}>To Do</option>
      <option value="IN_PROGRESS" style={{ color: 'var(--in-progress)' }}>In Progress</option>
      <option value="DONE" style={{ color: 'var(--done)' }}>Done</option>
    </select>
  )
}

// ——— Tasks Tab ———
function TasksTab({ tasks, isAdmin, currentUserId, onAdd, onEdit, onDelete, onStatusChange }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const filtered = tasks
    .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
    .filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const handleDelete = async (e, taskId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this task?')) return
    try {
      await taskApi.delete(taskId)
      onDelete(taskId)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  return (
    <div>
      <div className="filter-row">
        <input
          className="filter-search"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="ALL">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={14} />Add Task
          </button>
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CheckSquare size={22} /></div>
            <h3>{tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}</h3>
            <p>{tasks.length === 0 && isAdmin ? 'Create the first task for this project' : 'Try adjusting your filters'}</p>
            {tasks.length === 0 && isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14} />Add Task</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const isOverdue = task.overdue || (task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE')
                  return (
                    <tr key={task.id} onClick={() => isAdmin && onEdit(task)}>
                      <td data-label="Task" style={{ minWidth: 220 }}>
                        <div className="task-title-cell">
                          <span className="task-title-text">{task.title}</span>
                          {task.description && (
                            <span className="task-desc-text">{task.description}</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Priority">
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td data-label="Status" onClick={e => e.stopPropagation()}>
                        <StatusSelect
                          task={task}
                          canEditStatus={isAdmin || task.assignee?.id === currentUserId}
                          onStatusChange={onStatusChange}
                        />
                      </td>
                      <td data-label="Assignee">
                        {task.assignee ? (
                          <div className="assignee-chip">
                            <div className="assignee-avatar">{initials(task.assignee.name)}</div>
                            <span className="assignee-name">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted text-sm">Unassigned</span>
                        )}
                      </td>
                      <td data-label="Due Date">
                        <span className={`due-date-cell ${isOverdue ? 'text-danger' : 'text-muted'}`}>
                          {task.dueDate ? fmtDate(task.dueDate) : '—'}
                          {isOverdue && ' ⚠'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td data-label="Actions">
                          <div className="task-actions-cell">
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit"
                              onClick={e => { e.stopPropagation(); onEdit(task) }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-icon btn-sm"
                              title="Delete"
                              onClick={e => handleDelete(e, task.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ——— Members Tab ———
function MembersTab({ projectId, members, isAdmin, currentUserId, onMembersChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this project?`)) return
    try {
      await projectApi.removeMember(projectId, userId)
      onMembersChange(members.filter(m => m.user.id !== userId))
      toast.success(`${userName} removed`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleAdded = member => onMembersChange([...members, member])
  const handleUpdated = updatedMember =>
    onMembersChange(members.map(m => (m.id === updatedMember.id ? updatedMember : m)))

  return (
    <div>
      {isAdmin && (
        <div style={{ marginBottom: 'var(--sp-5)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} />Add Member
          </button>
        </div>
      )}

      <div className="member-list">
        {members.map(m => (
          <div key={m.id} className="member-row">
            <div className="member-avatar">{initials(m.user.name)}</div>
            <div className="member-info">
              <div className="member-name">
                {m.user.name}
                {m.user.id === currentUserId && (
                  <span className="text-muted text-xs" style={{ marginLeft: 8 }}>(you)</span>
                )}
              </div>
              <div className="member-email">{m.user.email}</div>
            </div>
            <div className="member-actions">
              <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
              {isAdmin && m.user.id !== currentUserId && (
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  title="Edit role"
                  onClick={() => setEditingMember(m)}
                >
                  <Edit3 size={14} />
                </button>
              )}
              {isAdmin && m.user.id !== currentUserId && (
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  title="Remove member"
                  onClick={() => handleRemove(m.user.id, m.user.name)}
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}

      {editingMember && (
        <EditMemberRoleModal
          projectId={projectId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}

// ——— Main Component ———
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [taskModal, setTaskModal] = useState(null) // null | 'create' | task object

  const isAdmin = project?.currentUserRole === 'ADMIN'

  const load = useCallback(async () => {
    try {
      const [projectRes, tasksRes, membersRes] = await Promise.all([
        projectApi.get(id),
        taskApi.listByProject(id),
        projectApi.getMembers(id)
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setMembers(membersRes.data)
    } catch (err) {
      toast.error('Failed to load project')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const handleTaskSaved = task => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id)
      return idx >= 0 ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]
    })
  }

  const handleTaskDelete = taskId => setTasks(prev => prev.filter(t => t.id !== taskId))
  const handleStatusChange = task => setTasks(prev => prev.map(t => t.id === task.id ? task : t))

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      await projectApi.delete(id)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project')
    }
  }

  if (loading) return (
    <div>
      <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 'var(--sp-6)', borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 80, marginBottom: 'var(--sp-6)', borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
    </div>
  )

  if (!project) return null

  const todoCount = tasks.filter(t => t.status === 'TODO').length
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const doneCount = tasks.filter(t => t.status === 'DONE').length

  return (
    <div className="fade-in">
      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 'var(--sp-5)' }}
      >
        <ArrowLeft size={15} />Back to Projects
      </button>

      {/* Project Header */}
      <div className="project-detail-header">
        <div className="project-detail-icon">
          <FolderKanban size={24} />
        </div>
        <div className="project-detail-info">
          <h1 className="project-detail-name">{project.name}</h1>
          {project.description && (
            <p className="text-secondary text-sm" style={{ marginBottom: 'var(--sp-3)' }}>
              {project.description}
            </p>
          )}
          <div className="project-detail-meta">
            <div className="project-detail-meta-item">
              <Users size={13} />
              <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="project-detail-meta-item">
              <CheckSquare size={13} />
              <span>{tasks.length} tasks</span>
            </div>
            <div className="project-detail-meta-item">
              <Calendar size={13} />
              <span>Created {fmtDate(project.createdAt)}</span>
            </div>
            <span className={`badge badge-${isAdmin ? 'admin' : 'member'}`}>
              {project.currentUserRole}
            </span>
          </div>
        </div>
        <div className="project-detail-actions">
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginRight: 'var(--sp-2)' }}>
            {[
              { label: 'To Do', count: todoCount, color: 'var(--todo)' },
              { label: 'Doing', count: inProgressCount, color: 'var(--in-progress)' },
              { label: 'Done', count: doneCount, color: 'var(--done)' }
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-md)',
                padding: '6px 12px',
                textAlign: 'center',
                minWidth: 56
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color, fontSize: '1.125rem', lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <button className="btn btn-danger btn-icon" title="Delete project" onClick={handleDeleteProject}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>Role Access</div>
            <p className="text-secondary text-sm">
              {isAdmin
                ? 'Admin: Manage tasks and users.'
                : 'Member: View and update assigned tasks only.'}
            </p>
          </div>
          <span className={`badge badge-${isAdmin ? 'admin' : 'member'}`}>
            {project.currentUserRole}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'tasks' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={15} />Tasks
          <span className="tab-count">{tasks.length}</span>
        </button>
        {isAdmin && (
          <button
            className={`tab ${activeTab === 'members' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={15} />Members
            <span className="tab-count">{members.length}</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onAdd={() => setTaskModal('create')}
          onEdit={task => setTaskModal(task)}
          onDelete={handleTaskDelete}
          onStatusChange={handleStatusChange}
        />
      )}
      {activeTab === 'members' && isAdmin && (
        <MembersTab
          projectId={id}
          members={members}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onMembersChange={setMembers}
        />
      )}

      {/* Task Modal */}
      {taskModal && (
        <TaskModal
          projectId={id}
          task={taskModal === 'create' ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}