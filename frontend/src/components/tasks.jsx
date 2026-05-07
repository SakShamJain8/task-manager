import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { taskApi, projectApi } from '../api'
import toast from 'react-hot-toast'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']

export default function TaskModal({ projectId, task, onClose, onSaved, isAdmin }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'TODO',
    assigneeId: task?.assignee?.id || ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (projectId) {
      projectApi.getMembers(projectId)
        .then(res => setMembers(res.data))
        .catch(() => {})
    }
  }, [projectId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const err = {}
    if (!form.title || form.title.length < 2) err.title = 'Title must be at least 2 characters'
    return err
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        status: isEdit ? form.status : undefined,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined
      }
      let res
      if (isEdit) {
        res = await taskApi.update(task.id, payload)
      } else {
        res = await taskApi.create(projectId, payload)
      }
      toast.success(isEdit ? 'Task updated!' : 'Task created!')
      onSaved(res.data)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {}).join(', ')
        || 'Operation failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                autoFocus
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Add more details..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              {isEdit && isAdmin && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={e => set('status', e.target.value)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assign To</label>
                <select
                  className="form-select"
                  value={form.assigneeId}
                  onChange={e => set('assigneeId', e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />{isEdit ? 'Saving...' : 'Creating...'}</>
                : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}