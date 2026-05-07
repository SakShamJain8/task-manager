import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../api'
import { Plus, FolderKanban, Users, CheckSquare, Crown, X } from 'lucide-react'
import toast from 'react-hot-toast'
import './projects.css'

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const err = {}
    if (!form.name || form.name.length < 2) err.name = 'Name must be at least 2 characters'
    return err
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    setLoading(true)
    try {
      const res = await projectApi.create(form)
      toast.success('Project created!')
      onCreated(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="What is this project about?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Creating...</> : <>
                <Plus size={16} />Create Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  const isAdmin = project.currentUserRole === 'ADMIN'
  return (
    <div className="project-card card card-interactive" onClick={onClick}>
      <div className="project-card-header">
        <div className="project-card-icon">
          <FolderKanban size={20} />
        </div>
        <span className={`badge badge-${isAdmin ? 'admin' : 'member'}`}>
          {isAdmin ? <><Crown size={10} />Admin</> : 'Member'}
        </span>
      </div>
      <div className="project-card-body">
        <h3 className="project-card-name">{project.name}</h3>
        {project.description && (
          <p className="project-card-desc">{project.description}</p>
        )}
      </div>
      <div className="project-card-footer">
        <div className="project-card-stat">
          <Users size={13} />
          <span>{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="project-card-stat">
          <CheckSquare size={13} />
          <span>{project.taskCount} task{project.taskCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

export default function ProjectList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    projectApi.list()
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreated = project => setProjects(p => [project, ...p])

  if (loading) return (
    <div>
      <div className="page-header">
        <div className="skeleton" style={{ width: 180, height: 36 }} />
        <div className="skeleton" style={{ width: 140, height: 38, borderRadius: 8 }} />
      </div>
      <div className="grid-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FolderKanban size={24} /></div>
            <h3>No projects yet</h3>
            <p>Create your first project to start collaborating with your team</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} />Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}