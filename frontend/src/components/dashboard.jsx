import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api'
import { useAuth } from './AuthContext'
import { CheckCircle, Clock, AlertTriangle, FolderKanban, TrendingUp, Users } from 'lucide-react'
import { format, isValid } from 'date-fns'
import './dashboard.css'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function StatusBar({ todo, inProgress, done }) {
  const total = todo + inProgress + done
  if (total === 0) return <div className="status-bar-empty">No tasks yet</div>
  return (
    <div className="status-bar-wrap">
      <div className="status-bar">
        {todo > 0 && <div className="status-bar-seg seg-todo" style={{ width: `${(todo/total)*100}%` }} title={`To Do: ${todo}`} />}
        {inProgress > 0 && <div className="status-bar-seg seg-progress" style={{ width: `${(inProgress/total)*100}%` }} title={`In Progress: ${inProgress}`} />}
        {done > 0 && <div className="status-bar-seg seg-done" style={{ width: `${(done/total)*100}%` }} title={`Done: ${done}`} />}
      </div>
      <div className="status-bar-legend">
        <span><span className="legend-dot dot-todo" />To Do ({todo})</span>
        <span><span className="legend-dot dot-progress" />In Progress ({inProgress})</span>
        <span><span className="legend-dot dot-done" />Done ({done})</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()
  const currentUser = user || storedUser

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-header">
        <div>
          <div className="skeleton" style={{ width: 240, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 18 }} />
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 'var(--sp-6)' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-6">
        <StatCard label="Total Tasks" value={data?.totalTasks ?? 0} icon={TrendingUp} color="var(--accent)" />
        <StatCard label="Projects" value={data?.totalProjects ?? 0} icon={FolderKanban} color="var(--todo)" />
        <StatCard label="In Progress" value={data?.inProgressCount ?? 0} icon={Clock} color="var(--in-progress)" />
        <StatCard label="Overdue" value={data?.overdueCount ?? 0} icon={AlertTriangle} color="var(--overdue)" />
      </div>

      <div className="dashboard-grid">
        {/* Task Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Task Status</h3>
          </div>
          <div className="card-body">
            <StatusBar
              todo={data?.todoCount ?? 0}
              inProgress={data?.inProgressCount ?? 0}
              done={data?.doneCount ?? 0}
            />
          </div>
        </div>

        {/* Tasks Per User */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tasks Per Member</h3>
            <Users size={16} color="var(--text-muted)" />
          </div>
          <div className="card-body">
            {data?.tasksPerUser?.length > 0 ? (
              <div className="user-task-list">
                {data.tasksPerUser.sort((a, b) => b.taskCount - a.taskCount).map(u => (
                  <div key={u.userId} className="user-task-row">
                    <div className="user-task-avatar">
                      {u.userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="user-task-info">
                      <div className="user-task-name">{u.userName}</div>
                      <div className="user-task-bar-wrap">
                        <div
                          className="user-task-bar"
                          style={{ width: `${(u.taskCount / Math.max(...data.tasksPerUser.map(x => x.taskCount))) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="user-task-count">{u.taskCount}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
                <p>No task assignments yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data?.recentTasks?.length > 0 ? (
              <div className="task-mini-list">
                {data.recentTasks.map(task => (
                  <div
                    key={task.id}
                    className="task-mini-row"
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                  >
                    <div className={`task-mini-dot status-dot-${task.status.toLowerCase()}`} />
                    <div className="task-mini-info">
                      <div className="task-mini-title">{task.title}</div>
                      <div className="task-mini-project">{task.projectName}</div>
                    </div>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
                <p>No tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        {data?.overdueTasks?.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--overdue)' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
                Overdue Tasks
              </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="task-mini-list">
                {data.overdueTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="task-mini-row"
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                  >
                    <div className="task-mini-dot" style={{ background: 'var(--overdue)' }} />
                    <div className="task-mini-info">
                      <div className="task-mini-title">{task.title}</div>
                      <div className="task-mini-project">
                        {task.dueDate && isValid(new Date(task.dueDate))
                          ? `Due ${format(new Date(task.dueDate), 'MMM d')}`
                          : task.projectName}
                      </div>
                    </div>
                    <span className="badge badge-overdue">OVERDUE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}