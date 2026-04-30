import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext(null);

export const ProgressProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('edugram_user');
    const defaultUser = { 
      topics: [], 
      recentActivity: [], 
      courseHistory: [],
      streak: 0,
      lastActiveDate: null,
      totalTimeSpent: 0, // in minutes
      dailyStats: {}, // { "YYYY-MM-DD": { topicsLearned: [], timeSpent: minutes } }
      createdAt: new Date().toISOString()
    };
    return saved ? JSON.parse(saved) : defaultUser;
  });

  // Ensure courseHistory and quizResults exist for legacy users
  useEffect(() => {
    if (currentUser) {
      let needsUpdate = false;
      const updatedUser = { ...currentUser };
      if (!updatedUser.courseHistory) {
        updatedUser.courseHistory = [];
        needsUpdate = true;
      }
      if (updatedUser.topics) {
        updatedUser.topics = updatedUser.topics.map(t => {
          if (!t.quizResults) {
            needsUpdate = true;
            return { ...t, quizResults: [] };
          }
          return t;
        });
      }
      if (needsUpdate) {
        setCurrentUser(updatedUser);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edugram_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const addTopic = (topicName, syllabus) => {
    setCurrentUser((prev) => ({
      ...prev,
      topics: [
        ...prev.topics,
        {
          id: Date.now().toString(),
          name: topicName,
          syllabus,
          progress: 0,
          completedSubtopics: [],
          cachedContent: {}, // Cache structured as { "subtopicTitle": "markdown content..." }
          quizResults: [], // Store results like { subtopicTitle, score, total }
          assignments: [], // Store assignments: { subtopicTitle, status, submission, feedback, score }
          notes: [] // Store notes: { subtopicTitle, smartNotes, studyGuide, flashcards, saved: timestamp }
        }
      ],
      recentActivity: [`Started learning "${topicName}"`, ...prev.recentActivity].slice(0, 5)
    }));
  };

  const deleteTopic = (topicId) => {
    setCurrentUser((prev) => {
      const topicToArchive = prev.topics.find(t => t.id === topicId);
      if (!topicToArchive) return prev;

      return {
        ...prev,
        topics: prev.topics.filter(t => t.id !== topicId),
        courseHistory: [topicToArchive, ...(prev.courseHistory || [])],
        recentActivity: [`Archived course "${topicToArchive.name}"`, ...prev.recentActivity].slice(0, 5)
      };
    });
  };

  const saveSubtopicContent = (topicId, subtopicTitle, content) => {
    setCurrentUser((prev) => {
      return {
        ...prev,
        topics: prev.topics.map((t) => {
          if (t.id === topicId) {
            return {
              ...t,
              cachedContent: {
                ...(t.cachedContent || {}),
                [subtopicTitle]: content
              }
            };
          }
          return t;
        })
      };
    });
  };

  const markSubtopicComplete = (topicId, subtopicTitle) => {
    setCurrentUser((prev) => {
      return {
        ...prev,
        topics: prev.topics.map((t) => {
          if (t.id === topicId && !t.completedSubtopics.includes(subtopicTitle)) {
             const newCompleted = [...t.completedSubtopics, subtopicTitle];
             const newProgress = Math.round((newCompleted.length / t.syllabus.length) * 100);
             return { ...t, completedSubtopics: newCompleted, progress: newProgress };
          }
          return t;
        }),
        recentActivity: [`Completed "${subtopicTitle}"`, ...prev.recentActivity].slice(0, 5)
      };
    });
  };

  const saveQuizResult = (topicId, subtopicTitle, score, total) => {
    setCurrentUser((prev) => {
      return {
        ...prev,
        topics: prev.topics.map((t) => {
          if (t.id === topicId) {
             const existingIndex = (t.quizResults || []).findIndex(q => q.subtopicTitle === subtopicTitle);
             let newQuizResults = [...(t.quizResults || [])];
             if (existingIndex >= 0) {
               // Update existing
               newQuizResults[existingIndex] = { subtopicTitle, score, total };
             } else {
               // Add new
               newQuizResults.push({ subtopicTitle, score, total });
             }
             return { ...t, quizResults: newQuizResults };
          }
          return t;
        })
      };
    });
  };

  const updateStreakAndTime = (timeSpentMinutes = 0) => {
    setCurrentUser((prev) => {
      const today = new Date().toDateString();
      const lastActive = prev.lastActiveDate ? new Date(prev.lastActiveDate).toDateString() : null;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      let newStreak = prev.streak || 0;
      if (lastActive !== today) {
        if (lastActive === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const dateKey = new Date().toISOString().split('T')[0];
      const dailyStats = { ...(prev.dailyStats || {}) };
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { topicsLearned: [], timeSpent: 0 };
      }
      dailyStats[dateKey].timeSpent += timeSpentMinutes;

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: new Date().toISOString(),
        totalTimeSpent: (prev.totalTimeSpent || 0) + timeSpentMinutes,
        dailyStats
      };
    });
  };

  const saveAssignmentSubmission = (topicId, subtopicTitle, submission, feedback, score) => {
    setCurrentUser((prev) => {
      return {
        ...prev,
        topics: prev.topics.map((t) => {
          if (t.id === topicId) {
            const existingIndex = (t.assignments || []).findIndex(a => a.subtopicTitle === subtopicTitle);
            let newAssignments = [...(t.assignments || [])];
            if (existingIndex >= 0) {
              newAssignments[existingIndex] = { subtopicTitle, submission, feedback, score, status: 'submitted' };
            } else {
              newAssignments.push({ subtopicTitle, submission, feedback, score, status: 'submitted' });
            }
            return { ...t, assignments: newAssignments };
          }
          return t;
        })
      };
    });
  };

  const saveSmartNotes = (topicId, subtopicTitle, smartNotes, studyGuide, flashcards) => {
    setCurrentUser((prev) => {
      return {
        ...prev,
        topics: prev.topics.map((t) => {
          if (t.id === topicId) {
            const existingIndex = (t.notes || []).findIndex(n => n.subtopicTitle === subtopicTitle);
            let newNotes = [...(t.notes || [])];
            if (existingIndex >= 0) {
              newNotes[existingIndex] = { subtopicTitle, smartNotes, studyGuide, flashcards, saved: new Date().toISOString() };
            } else {
              newNotes.push({ subtopicTitle, smartNotes, studyGuide, flashcards, saved: new Date().toISOString() });
            }
            return { ...t, notes: newNotes };
          }
          return t;
        })
      };
    });
  };

  return (
    <ProgressContext.Provider value={{ currentUser, addTopic, markSubtopicComplete, deleteTopic, saveSubtopicContent, saveQuizResult, updateStreakAndTime, saveAssignmentSubmission, saveSmartNotes }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext);
