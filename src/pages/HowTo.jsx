import { useState } from 'react'
import {
  BookOpen, ChevronDown, ChevronUp, LogIn, LayoutDashboard, Printer,
  CheckSquare, FolderOpen, Users, Calculator, Shield, User,
  Zap, Repeat, AlertCircle, Clock, CheckCircle2, ArrowRight,
  Lock, Edit3, UserCheck, Eye
} from 'lucide-react'

const GOLD = 'text-brand-gold'

function Section({ icon: Icon, title, color = 'text-brand-gold', children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={color} />
          <span className="text-white font-semibold">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-brand-border pt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ n, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-brand-gold text-xs font-bold">{n}</span>
      </div>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        {desc && <p className="text-brand-muted text-sm mt-0.5 leading-relaxed">{desc}</p>}
      </div>
    </div>
  )
}

function Rule({ icon: Icon, color, label, desc }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
      <Icon size={15} className={`${color} mt-0.5 flex-shrink-0`} />
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {desc && <p className="text-brand-muted text-xs mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

function Badge({ color, label }) {
  const colors = {
    gold: 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold',
    blue: 'bg-blue-400/10 border-blue-400/20 text-blue-400',
    red: 'bg-red-400/10 border-red-400/30 text-red-400',
    orange: 'bg-orange-400/10 border-orange-400/30 text-orange-400',
    green: 'bg-green-400/10 border-green-400/20 text-green-400',
    yellow: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400',
    purple: 'bg-purple-400/10 border-purple-400/20 text-purple-400',
    muted: 'bg-white/5 border-white/10 text-brand-muted',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[color] || colors.muted}`}>
      {label}
    </span>
  )
}

export default function HowTo() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">How-To Guide</h1>
          <p className="text-brand-muted text-sm mt-1">Everything you need to know about the Monaxa Ops Portal</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 border border-brand-border text-brand-muted hover:text-white hover:border-brand-gold px-3 py-2 rounded-lg text-sm transition-colors print:hidden"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      {/* Quick start banner */}
      <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl px-5 py-4">
        <p className="text-brand-gold font-semibold text-sm mb-1">Quick Start</p>
        <p className="text-brand-muted text-sm">
          Log in with your Monaxa work email and the temporary password <span className="text-white font-mono bg-brand-dark px-1.5 py-0.5 rounded text-xs">Monaxa2026!</span> — then navigate using the sidebar on the left.
        </p>
      </div>

      {/* 1. Logging In */}
      <Section icon={LogIn} title="1. Logging In" color="text-blue-400">
        <div className="space-y-3">
          <Step n="1" title="Go to the portal URL" desc="Open the link shared with you in your browser." />
          <Step n="2" title="Enter your work email" desc="Use your @monaxa.com email address (e.g. artem.b@monaxa.com)." />
          <Step n="3" title="Enter your password" desc="Use the temporary password Monaxa2026! for your first login. Contact Kleopas to reset if needed." />
          <Step n="4" title="You're in" desc="You'll land on your personal dashboard showing all active tasks assigned to you or the full team." />
        </div>
      </Section>

      {/* 2. Dashboard */}
      <Section icon={LayoutDashboard} title="2. Your Dashboard" color="text-brand-gold">
        <p className="text-brand-muted text-sm leading-relaxed">
          The dashboard is your main workspace. It shows all active tasks sorted by priority — most urgent at the top.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            <p className="text-sm"><span className="text-red-400 font-medium">Urgent</span> — highest priority, needs immediate attention</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            <p className="text-sm"><span className="text-orange-400 font-medium">High</span> — important, action needed today</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <p className="text-sm"><span className="text-blue-400 font-medium">Medium</span> — standard priority</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
            <p className="text-sm"><span className="text-brand-muted font-medium">Low</span> — when time allows</p>
          </div>
        </div>
        <div className="bg-brand-dark rounded-lg border border-brand-border p-4 space-y-2">
          <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Filter tabs</p>
          <div className="flex gap-2 flex-wrap">
            <Badge color="gold" label="All" />
            <Badge color="blue" label="Mine" />
            <Badge color="muted" label="Recurring" />
            <Badge color="muted" label="One-off" />
          </div>
          <p className="text-brand-muted text-xs mt-1">Use the <span className="text-white">Mine</span> tab to see only tasks assigned to you. Use <span className="text-white">Recurring</span> for daily/weekly/monthly tasks.</p>
        </div>
        <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4">
          <p className="text-green-400 text-sm font-medium mb-1 flex items-center gap-2"><CheckCircle2 size={13} /> Recently Finished</p>
          <p className="text-brand-muted text-sm">The bottom panel shows completed tasks with findings and timestamps. Click to expand it.</p>
        </div>
      </Section>

      {/* 3. Tasks */}
      <Section icon={CheckSquare} title="3. Working with Tasks" color="text-yellow-400">
        <div className="space-y-4">
          <div>
            <p className="text-white text-sm font-semibold mb-2">Task Types</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-brand-dark rounded-lg border border-brand-border">
                <Repeat size={13} className="text-cyan-400" />
                <div>
                  <p className="text-white text-xs font-medium">Daily</p>
                  <p className="text-brand-muted text-xs">Repeats every day</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-brand-dark rounded-lg border border-brand-border">
                <Repeat size={13} className="text-indigo-400" />
                <div>
                  <p className="text-white text-xs font-medium">Weekly</p>
                  <p className="text-brand-muted text-xs">Repeats every week</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-brand-dark rounded-lg border border-brand-border">
                <Repeat size={13} className="text-violet-400" />
                <div>
                  <p className="text-white text-xs font-medium">Monthly</p>
                  <p className="text-brand-muted text-xs">Repeats every month</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-brand-dark rounded-lg border border-brand-border">
                <Zap size={13} className="text-brand-gold" />
                <div>
                  <p className="text-white text-xs font-medium">One-off</p>
                  <p className="text-brand-muted text-xs">Single assignment</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-2">How to update a task</p>
            <div className="space-y-2">
              <Step n="1" title="Click any task row" desc="This opens the task detail panel." />
              <Step n="2" title="Review the details" desc="See who created it, when it was assigned, the source (where it came from), and the due date." />
              <Step n="3" title="Update the status" desc="Click the status that applies to you — Open, Working On, Pending Review, or Completed." />
              <Step n="4" title="Add findings when completing" desc="When you mark a task as Completed, a green text box appears. Fill in what you found and what action you took — this is mandatory for a proper record." />
              <Step n="5" title="Save changes" desc="Click Save Changes. The task updates for everyone on the team instantly." />
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-2">Status flow</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="blue" label="Open" />
              <ArrowRight size={12} className="text-brand-muted" />
              <Badge color="yellow" label="Working On" />
              <ArrowRight size={12} className="text-brand-muted" />
              <Badge color="purple" label="Pending Review" />
              <ArrowRight size={12} className="text-brand-muted" />
              <Badge color="green" label="Completed" />
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-2">Creating a task</p>
            <div className="space-y-2">
              <Step n="1" title="Go to Tasks in the sidebar" />
              <Step n="2" title='Click "New Task"' desc="Fill in the title, description, type, and priority." />
              <Step n="3" title="Assign it" desc='Leave "Assign to myself" selected to self-assign. Only admins can assign tasks to other team members.' />
              <Step n="4" title="Set a due date if applicable" desc="Tasks with due dates show overdue and deadline badges on the dashboard." />
            </div>
          </div>

          <div className="bg-brand-dark rounded-lg border border-brand-border p-4">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider mb-2">Self-assign from dashboard</p>
            <p className="text-brand-muted text-sm">If you see an unassigned task you want to pick up, click it and hit the <span className="text-brand-gold font-medium">Self-Assign</span> button. It will assign it to you and set status to Working On automatically.</p>
          </div>
        </div>
      </Section>

      {/* 4. Cases */}
      <Section icon={FolderOpen} title="4. Cases" color="text-orange-400">
        <p className="text-brand-muted text-sm leading-relaxed">
          Cases are for compliance and dealing desk investigations — hedge abuse, bonus abuse, copy trading disputes, KYC issues, and so on.
        </p>
        <div className="space-y-2">
          <Step n="1" title="Go to Cases in the sidebar" />
          <Step n="2" title='Click "New Case"' desc="Enter the account ID, case type, priority, and any initial notes." />
          <Step n="3" title="Case reference auto-generates" desc="Each case gets a unique reference (e.g. CASE-20260519-001) if you leave the field blank." />
          <Step n="4" title="Update status as you investigate" desc="Move cases from Open → In Progress → Escalated → Closed as the investigation progresses." />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['Hedge Abuse', 'Bonus Abuse', 'Copy Trading', 'Withdrawal', 'KYC', 'Latency Arb', 'EA Detection', 'Other'].map(t => (
            <div key={t} className="text-xs text-brand-muted px-2 py-1.5 bg-brand-dark rounded border border-brand-border">{t}</div>
          ))}
        </div>
      </Section>

      {/* 5. Team View */}
      <Section icon={Users} title="5. Team View" color="text-green-400">
        <p className="text-brand-muted text-sm leading-relaxed">
          The Team View shows every team member's active workload at a glance — who is on what, what's open, and how many cases each person has. Use this to coordinate handoffs and avoid duplicating work.
        </p>
        <Rule icon={Eye} color="text-green-400" label="Everyone can see everyone's workload" desc="Full visibility across the dealing desk — no hidden tasks." />
      </Section>

      {/* 6. Calculator */}
      <Section icon={Calculator} title="6. Trading Calculator" color="text-pink-400">
        <p className="text-brand-muted text-sm leading-relaxed">
          Found under <span className="text-white">Tools → Calculator</span> in the sidebar. Contains 20 modules covering all key trading calculations.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Pip Value', 'Lot Size', 'Margin Required', 'Margin Level %',
            'Slippage', 'Swap / Overnight', 'Spread Cost', 'Commission',
            'Break Even', 'Profit / Loss', 'Risk / Reward', 'Drawdown',
            'Margin Call / Stop Out', 'Win Rate & Expectancy',
            'Kelly Criterion', 'Recovery Factor'
          ].map(c => (
            <div key={c} className="text-xs text-brand-muted px-2 py-1.5 bg-brand-dark rounded border border-brand-border">{c}</div>
          ))}
        </div>
        <p className="text-brand-muted text-xs">Hover the ℹ️ icon on any field to see the formula. All results update live as you type.</p>
      </Section>

      {/* 7. Permissions */}
      <Section icon={Shield} title="7. Permissions & Access Rules" color="text-red-400">
        <div className="space-y-3">
          <Rule
            icon={UserCheck}
            color="text-brand-gold"
            label="Creating tasks — anyone"
            desc="Any team member can create a task and assign it to themselves. Only admins can assign tasks to other team members."
          />
          <Rule
            icon={CheckCircle2}
            color="text-green-400"
            label="Completing tasks — anyone"
            desc="Any team member can mark a task as completed and must enter findings/results when doing so."
          />
          <Rule
            icon={Edit3}
            color="text-blue-400"
            label="Editing tasks — owner or admin"
            desc="You can edit tasks assigned to you. Admins can edit any task."
          />
          <Rule
            icon={Users}
            color="text-purple-400"
            label="Reassigning tasks — admin only"
            desc="Only admins can reassign a task from one team member to another."
          />
          <Rule
            icon={Lock}
            color="text-red-400"
            label="Admin panel — admin only"
            desc="Adding/removing team members and managing account access is restricted to admins."
          />
          <Rule
            icon={Eye}
            color="text-cyan-400"
            label="Viewing — everyone"
            desc="All team members can see all tasks, cases, the team view, and the calendar."
          />
        </div>

        <div className="bg-brand-dark rounded-lg border border-brand-border p-4 mt-2">
          <p className="text-xs text-brand-muted font-medium uppercase tracking-wider mb-2">Current Admin</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-black">KG</div>
            <div>
              <p className="text-white text-sm font-medium">Kleopas G</p>
              <p className="text-brand-muted text-xs">kleopas.g@monaxa.com</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Tips */}
      <Section icon={AlertCircle} title="8. Tips & Best Practices" color="text-cyan-400">
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <Clock size={14} className="text-brand-gold flex-shrink-0 mt-0.5" />
            <p className="text-brand-muted text-sm"><span className="text-white font-medium">Always set a due date</span> on time-sensitive tasks. Overdue tasks show in red on the dashboard.</p>
          </div>
          <div className="flex gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-brand-muted text-sm"><span className="text-white font-medium">Fill in findings</span> when completing — this creates a permanent record of what was done and is visible to the whole team.</p>
          </div>
          <div className="flex gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <FolderOpen size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-brand-muted text-sm"><span className="text-white font-medium">Use Cases for investigations</span> — not Tasks. Tasks are for action items; Cases are for compliance/dealing desk investigations that need a reference number.</p>
          </div>
          <div className="flex gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <User size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-brand-muted text-sm"><span className="text-white font-medium">Self-assign open tasks</span> rather than waiting to be assigned. If you see something unassigned that you can handle, pick it up directly from the dashboard.</p>
          </div>
          <div className="flex gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-brand-muted text-sm"><span className="text-white font-medium">Urgent tasks come first</span> — always check the top of the dashboard flow table when you start your day.</p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-brand-muted text-xs">Questions? Contact <span className="text-brand-gold">Kleopas G</span> — kleopas.g@monaxa.com</p>
      </div>
    </div>
  )
}
