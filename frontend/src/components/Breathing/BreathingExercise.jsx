import React, { useState, useEffect } from 'react';

const BreathingExercise = () => {
  const [phase, setPhase] = useState('ready'); // ready, inhale, hold, exhale, pause
  const [count, setCount] = useState(4);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('Ready to begin?');
  const [timerId, setTimerId] = useState(null);
  const [exerciseType, setExerciseType] = useState('4-4-4-4'); // Default breathing pattern
  const [completedCycles, setCompletedCycles] = useState(0);

  const exerciseTypes = {
    '4-4-4-4': { 
      name: 'Box Breathing', 
      description: 'Equal timing for stress relief',
      phases: {
        inhale: { duration: 4, message: 'Breathe In', next: 'hold' },
        hold: { duration: 4, message: 'Hold', next: 'exhale' },
        exhale: { duration: 4, message: 'Breathe Out', next: 'pause' },
        pause: { duration: 4, message: 'Rest', next: 'inhale' },
      }
    },
    '4-7-8': { 
      name: '4-7-8 Breathing', 
      description: 'For better sleep and relaxation',
      phases: {
        inhale: { duration: 4, message: 'Breathe In', next: 'hold' },
        hold: { duration: 7, message: 'Hold', next: 'exhale' },
        exhale: { duration: 8, message: 'Breathe Out', next: 'pause' },
        pause: { duration: 2, message: 'Rest', next: 'inhale' },
      }
    },
    '6-2-6-2': { 
      name: 'Calm Breathing', 
      description: 'Simple pattern for daily use',
      phases: {
        inhale: { duration: 6, message: 'Breathe In', next: 'hold' },
        hold: { duration: 2, message: 'Hold', next: 'exhale' },
        exhale: { duration: 6, message: 'Breathe Out', next: 'pause' },
        pause: { duration: 2, message: 'Rest', next: 'inhale' },
      }
    }
  };

  const currentExercise = exerciseTypes[exerciseType];
  const phases = currentExercise.phases;

  const startExercise = () => {
    setIsActive(true);
    setPhase('inhale');
    setCount(phases.inhale.duration);
    setMessage(phases.inhale.message);
    setCompletedCycles(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('ready');
    setCount(0);
    setMessage(`Great job! You completed ${completedCycles} breathing cycles.`);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  useEffect(() => {
    if (!isActive || phase === 'ready') {
      if (timerId) clearInterval(timerId);
      setTimerId(null);
      return;
    }

    const currentPhase = phases[phase];
    setMessage(`${currentPhase.message}`);

    if (count > 0) {
      const id = setInterval(() => {
        setCount(prevCount => {
          if (prevCount <= 1) {
            // Moving to next phase
            const nextPhase = phases[currentPhase.next];
            setPhase(currentPhase.next);
            setCount(nextPhase.duration);
            setMessage(nextPhase.message);
            
            // Count completed cycles (when returning to inhale)
            if (currentPhase.next === 'inhale') {
              setCompletedCycles(prev => prev + 1);
            }
            return nextPhase.duration;
          }
          return prevCount - 1;
        });
      }, 1000);
      setTimerId(id);
      
      return () => clearInterval(id);
    }
  }, [isActive, phase]); // Removed count and timerId from dependencies

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-calm-900 mb-4">Breathing Exercise</h1>
          <p className="text-lg text-calm-600">
            Follow the rhythm to calm your mind and body
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Exercise Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-calm-200">
            <h2 className="text-xl font-semibold text-calm-900 mb-4">Choose Your Pattern</h2>
            <div className="space-y-3">
              {Object.entries(exerciseTypes).map(([key, exercise]) => (
                <button
                  key={key}
                  onClick={() => !isActive && setExerciseType(key)}
                  disabled={isActive}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    exerciseType === key 
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-900' 
                      : 'bg-calm-50 border-2 border-transparent hover:bg-calm-100'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                >
                  <div className="font-semibold text-lg">{exercise.name}</div>
                  <div className="text-sm text-calm-600 mt-1">{exercise.description}</div>
                  <div className="text-xs text-calm-500 mt-2 font-mono">
                    Pattern: {key.split('-').join(' - ')} seconds
                  </div>
                </button>
              ))}
            </div>

            {/* Stats */}
            {completedCycles > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-700">{completedCycles}</div>
                  <div className="text-sm text-emerald-600">Completed Cycles</div>
                </div>
              </div>
            )}
          </div>

          {/* Breathing Visualization */}
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-calm-200">
            <h3 className="text-lg font-semibold text-calm-900 mb-6">{currentExercise.name}</h3>
            
            {/* Breathing Circle */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out transform
                ${phase === 'inhale' ? 'bg-gradient-to-br from-green-200 to-emerald-300 scale-110' : ''}
                ${phase === 'hold' ? 'bg-gradient-to-br from-yellow-200 to-amber-300 scale-110' : ''}
                ${phase === 'exhale' ? 'bg-gradient-to-br from-blue-200 to-cyan-300 scale-75' : ''}
                ${phase === 'pause' ? 'bg-gradient-to-br from-gray-200 to-slate-300 scale-75' : ''}
                ${phase === 'ready' ? 'bg-gradient-to-br from-purple-200 to-indigo-300 scale-100' : ''}
              `}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-calm-800 mb-2">{message}</div>
                  {count > 0 && phase !== 'ready' && (
                    <div className="text-4xl font-bold text-calm-900">{count}</div>
                  )}
                  {phase === 'ready' && (
                    <div className="text-6xl">🫁</div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              {phase === 'ready' ? (
                <p className="text-calm-600">Click start when you're ready to begin</p>
              ) : (
                <p className="text-calm-600">
                  {phase === 'inhale' && '↗️ Slowly breathe in through your nose'}
                  {phase === 'hold' && '⏸️ Hold your breath gently'}
                  {phase === 'exhale' && '↘️ Slowly breathe out through your mouth'}
                  {phase === 'pause' && '⏳ Rest and prepare for the next breath'}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isActive ? (
                <button
                  onClick={startExercise}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Exercise
                </button>
              ) : (
                <button
                  onClick={stopExercise}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Stop Exercise
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreathingExercise;
