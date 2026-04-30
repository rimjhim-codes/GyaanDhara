import React from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { BookOpen, CheckCircle, TrendingUp, Clock, Play, Trash2, History, Award, Flame, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, deleteTopic } = useProgress();

  if (!currentUser.topics || currentUser.topics.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '50%', marginBottom: '1rem' }}>
              <TrendingUp size={48} color="var(--color-primary)" />
            </div>
            <h1>Welcome to Edugram</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}>
              Your personalized AI learning journey starts here. Enter any topic you want to learn, and we'll build a tailored curriculum for you.
            </p>
          </div>
          <Link to="/setup" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
            Start Learning Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Your Learning Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Resume where you left off or start something new.</p>
        </div>
        <Link to="/setup" className="btn btn-primary">
          <BookOpen size={18} /> New Topic
        </Link>
      </div>

      {/* Quick Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Flame size={24} color="var(--color-accent)" />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Current Streak</p>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--color-accent)' }}>{currentUser.streak || 0} days</h3>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Clock size={24} color="var(--color-primary)" />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Time Spent</p>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }}>
            {Math.floor((currentUser.totalTimeSpent || 0) / 60)}h {((currentUser.totalTimeSpent || 0) % 60)}m
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <CheckCircle size={24} color="var(--color-secondary)" />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Topics Completed</p>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--color-secondary)' }}>
            {(currentUser.topics || []).reduce((acc, t) => acc + t.completedSubtopics.length, 0)}
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <TrendingUp size={24} color="var(--color-secondary)" />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Courses</p>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--color-secondary)' }}>{(currentUser.topics || []).length}</h3>
        </div>
      </div>

      {/* Topics Grid */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Active Learning</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {currentUser.topics.map((topic) => (
          <div key={topic.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button 
              onClick={() => deleteTopic(topic.id)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Archive this course"
            >
              <Trash2 size={18} />
            </button>
            
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '2rem' }}>
              {topic.progress === 100 ? <CheckCircle color="var(--color-secondary)" /> : <Clock color="var(--color-primary)" />}
              {topic.name}
            </h3>
            
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
                <span style={{ fontWeight: 'bold' }}>{topic.progress}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${topic.progress}%`, 
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
            </div>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
              {topic.completedSubtopics.length} of {topic.syllabus.length} topics completed
            </p>

            <Link 
              to={`/learn/${topic.id}/0`} 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
            >
              {topic.progress === 0 ? 'Start Learning' : 'Resume Curriculum'} <Play size={16} />
            </Link>
          </div>
        ))}
      </div>
      
      {currentUser.recentActivity && currentUser.recentActivity.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '3rem' }}>
          <h3>Recent Activity</h3>
          <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
             {currentUser.recentActivity.map((activity, i) => (
               <li key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <CheckCircle size={16} color="var(--color-text-muted)" />
                 {activity}
               </li>
             ))}
          </ul>
        </div>
      )}

      {currentUser.courseHistory && currentUser.courseHistory.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
            <History size={20} /> Course History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentUser.courseHistory.map((topic, i) => (
              <div key={topic.id || i} style={{ padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>{topic.name}</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Syllabus: {topic.syllabus.length} topics • Completed: {topic.completedSubtopics?.length || 0}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: topic.progress === 100 ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: topic.progress === 100 ? 'var(--color-secondary)' : 'var(--color-text-muted)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {topic.progress === 100 ? 'Completed' : 'Archived'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const allTopics = [...(currentUser.topics || []), ...(currentUser.courseHistory || [])];
        const topicsWithQuizzes = allTopics.filter(t => t.quizResults && t.quizResults.length > 0);
        
        if (topicsWithQuizzes.length === 0) return null;

        return (
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
              <Award size={20} /> Quiz Results
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {topicsWithQuizzes.map((topic, i) => (
                <div key={`quiz-${topic.id || i}`} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ color: 'white', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>{topic.name}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topic.quizResults.map((result, j) => {
                      const ratio = result.score / result.total;
                      const scoreColor = ratio >= 0.8 ? 'var(--color-secondary)' : ratio >= 0.5 ? 'var(--color-primary)' : 'var(--color-accent)';
                      
                      return (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-text-muted)', flex: 1, paddingRight: '1rem' }}>{result.subtopicTitle}</span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: scoreColor,
                            background: `color-mix(in srgb, ${scoreColor} 20%, transparent)`,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {result.score} / {result.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
