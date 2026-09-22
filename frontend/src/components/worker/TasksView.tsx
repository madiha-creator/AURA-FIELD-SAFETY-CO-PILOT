import React from 'react';
import { TaskItem } from '../../types/workerWorkflows';
import { CheckSquare, Play, Clock, MapPin, Wrench } from 'lucide-react';

interface TasksViewProps {
  tasks: TaskItem[];
  onStartProcedure: (procedureId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onStartProcedure
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'var(--aura-teal)',
            textTransform: 'uppercase'
          }}
        >
          WORKER ASSIGNMENTS
        </span>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.25,
            marginTop: '2px'
          }}
        >
          Assigned Field Tasks
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-500)', marginTop: '4px' }}>
          Select a task to activate step-by-step voice guidance.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tasks.map((task) => {
          const isCurrent = task.status === 'in_progress';
          const isPaused = task.status === 'paused';

          return (
            <div
              key={task.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-card)',
                border: isCurrent ? '2px solid var(--aura-teal)' : '1px solid var(--border-subtle)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--bg-secondary-surface)'
                      : isPaused
                      ? 'var(--warning-amber-bg)'
                      : 'var(--bg-app)',
                    color: isCurrent
                      ? 'var(--aura-teal-dark)'
                      : isPaused
                      ? 'var(--warning-amber-text)'
                      : 'var(--ink-700)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase'
                  }}
                >
                  {task.status.replace('_', ' ')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--ink-500)', fontWeight: 600 }}>
                  <Clock size={14} />
                  <span>~{task.estimatedMinutes} mins</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-950)', lineHeight: 1.3 }}>
                  {task.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--ink-700)', fontWeight: 500 }}>
                    <MapPin size={15} color="var(--aura-teal)" />
                    <span>{task.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--ink-700)', fontWeight: 500 }}>
                    <Wrench size={15} color="var(--aura-teal)" />
                    <span>{task.equipment}</span>
                  </div>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', marginBottom: '4px' }}>
                  <span>PROGRESS</span>
                  <span>STEP {task.stepCurrent} OF {task.stepTotal}</span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(task.stepCurrent / task.stepTotal) * 100}%`,
                      height: '100%',
                      backgroundColor: 'var(--aura-teal)',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>

              {/* Start / Resume Voice Guidance Button */}
              <button
                onClick={() => onStartProcedure(task.procedureId)}
                style={{
                  height: '48px',
                  backgroundColor: isCurrent ? 'var(--aura-teal)' : 'var(--bg-app)',
                  color: isCurrent ? '#FFFFFF' : 'var(--ink-950)',
                  border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Play size={16} fill={isCurrent ? '#FFFFFF' : 'currentColor'} />
                <span>{isCurrent ? 'RESUME GUIDANCE' : isPaused ? 'CONTINUE STEP' : 'START PROCEDURE'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
