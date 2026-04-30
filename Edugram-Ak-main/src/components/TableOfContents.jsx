import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CheckCircle, Target, Lock } from 'lucide-react';

const TableOfContents = ({ topicId, topic, currentIndex, onNavigate }) => {
  const [expandedTopic, setExpandedTopic] = useState(topicId);

  if (!topic || !topic.syllabus) {
    return <div>Loading syllabus...</div>;
  }

  const toggleExpand = (id) => {
    setExpandedTopic(expandedTopic === id ? null : id);
  };

  const completionPercentage = Math.round(
    (topic.completedSubtopics.length / topic.syllabus.length) * 100
  );

  return (
    <div className="glass-panel" style={{ padding: '0' }}>
      {/* Topic Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        onClick={() => toggleExpand(topicId)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <ChevronDown
            size={20}
            style={{
              transform: expandedTopic === topicId ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}
          />
          <h3 style={{ flex: 1, margin: 0, color: 'white' }}>{topic.name}</h3>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{completionPercentage}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${completionPercentage}%`,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {topic.completedSubtopics.length} of {topic.syllabus.length} completed
          </p>
        </div>
      </div>

      {/* Syllabus List */}
      {expandedTopic === topicId && (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {topic.syllabus.map((subtopic, i) => {
            const isActive = i === currentIndex;
            const isDone = topic.completedSubtopics.includes(subtopic.title);

            return (
              <Link
                key={i}
                to={`/learn/${topicId}/${i}`}
                onClick={() => onNavigate && onNavigate(i)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <div style={{ marginTop: '0.2rem' }}>
                  {isDone ? (
                    <CheckCircle size={18} color="var(--color-secondary)" strokeWidth={2} />
                  ) : isActive ? (
                    <Target size={18} color="var(--color-primary)" />
                  ) : (
                    <Target size={18} color="var(--color-text-muted)" />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-secondary)' : 'var(--color-text-main)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    {subtopic.title}
                  </p>
                  <p
                    style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {subtopic.description}
                  </p>
                </div>

                {/* Status Badge */}
                {isDone && (
                  <span
                    style={{
                      marginTop: '0.2rem',
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(14, 165, 233, 0.2)',
                      color: 'var(--color-secondary)',
                      fontSize: '0.7rem',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Done
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableOfContents;
