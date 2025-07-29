import React, { useState, useEffect } from 'react';

const GuidedMeditation = () => {
  const [meditationStarted, setMeditationStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(300); // 5 minutes default
  const [currentPhase, setCurrentPhase] = useState('preparation');
  const [guidanceText, setGuidanceText] = useState('Find a comfortable position and close your eyes');

  const durations = [
    { value: 180, label: '3 minutes', description: 'Quick mindfulness' },
    { value: 300, label: '5 minutes', description: 'Daily practice' },
    { value: 600, label: '10 minutes', description: 'Deep relaxation' },
    { value: 900, label: '15 minutes', description: 'Extended session' },
    { value: 1200, label: '20 minutes', description: 'Full meditation' }
  ];

  const guidancePhases = {
    preparation: {
      text: 'Find a comfortable position. Close your eyes and begin to notice your breath.',
      duration: 30
    },
    centering: {
      text: 'Take three deep breaths. In... and out. Let your body settle into this moment.',
      duration: 60
    },
    breath_focus: {
      text: 'Now, simply observe your natural breathing. Notice the sensation of air flowing in and out.',
      duration: 120
    },
    body_awareness: {
      text: 'Gently scan your body from head to toe. Notice any areas of tension and let them soften.',
      duration: 120
    },
    mindfulness: {
      text: 'If thoughts arise, acknowledge them with kindness and gently return to your breath.',
      duration: 180
    },
    closing: {
      text: 'Begin to wiggle your fingers and toes. When ready, slowly open your eyes.',
      duration: 30
    }
  };

  useEffect(() => {
    if (meditationStarted) {
      const id = setInterval(() => {
        setTimer(prevTimer => {
          const newTimer = prevTimer + 1;
          updateGuidance(newTimer);
          
          if (newTimer >= selectedDuration) {
            stopMeditation();
            return selectedDuration;
          }
          return newTimer;
        });
      }, 1000);
      setIntervalId(id);
    } else {
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [meditationStarted, selectedDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGuidance = (currentTime) => {
    const progress = currentTime / selectedDuration;
    
    if (progress < 0.1) {
      setCurrentPhase('preparation');
      setGuidanceText(guidancePhases.preparation.text);
    } else if (progress < 0.2) {
      setCurrentPhase('centering');
      setGuidanceText(guidancePhases.centering.text);
    } else if (progress < 0.4) {
      setCurrentPhase('breath_focus');
      setGuidanceText(guidancePhases.breath_focus.text);
    } else if (progress < 0.6) {
      setCurrentPhase('body_awareness');
      setGuidanceText(guidancePhases.body_awareness.text);
    } else if (progress < 0.9) {
      setCurrentPhase('mindfulness');
      setGuidanceText(guidancePhases.mindfulness.text);
    } else {
      setCurrentPhase('closing');
      setGuidanceText(guidancePhases.closing.text);
    }
  };

  const startMeditation = () => {
    setMeditationStarted(true);
    setTimer(0);
    setCurrentPhase('preparation');
    setGuidanceText(guidancePhases.preparation.text);
  };

  const stopMeditation = () => {
    setMeditationStarted(false);
    setCurrentPhase('preparation');
    setGuidanceText('Find a comfortable position and close your eyes');
    const completedMinutes = Math.floor(timer / 60);
    if (completedMinutes > 0) {
      alert(`Great session! You meditated for ${formatTime(timer)}.`);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-green-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-calm-900 mb-4">Guided Meditation</h1>
          <p className="text-lg text-calm-600">
            Take a moment to relax your mind and find inner peace
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Duration Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-calm-200">
            <h2 className="text-xl font-semibold text-calm-900 mb-4">Choose Duration</h2>
            <div className="space-y-3">
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => !meditationStarted && setSelectedDuration(duration.value)}
                  disabled={meditationStarted}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedDuration === duration.value 
                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-900' 
                      : 'bg-calm-50 border-2 border-transparent hover:bg-calm-100'
                  } ${meditationStarted ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                >
                  <div className="font-semibold text-lg">{duration.label}</div>
                  <div className="text-sm text-calm-600 mt-1">{duration.description}</div>
                </button>
              ))}
            </div>

            {/* Progress */}
            {meditationStarted && (
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="text-center mb-3">
                  <div className="text-sm text-emerald-600 mb-2">Progress</div>
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(timer / selectedDuration) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-emerald-600 mt-2">
                    {formatTime(timer)} / {formatTime(selectedDuration)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Meditation Interface */}
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-calm-200">
            
            {/* Meditation Circle */}
            <div className={`relative w-64 h-64 mx-auto mb-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-2000 ${
              meditationStarted 
                ? 'bg-gradient-to-br from-emerald-300 to-green-400 animate-pulse' 
                : 'bg-gradient-to-br from-emerald-200 to-green-300'
            }`}>
              <div className="text-center">
                <span className="text-6xl text-white mb-4">🧘‍♀️</span>
                <div className="text-white font-bold text-lg">
                  {formatTime(timer)}
                </div>
              </div>
            </div>

            {/* Guidance Text */}
            <div className="mb-8 min-h-[80px] flex items-center justify-center">
              <p className="text-lg text-calm-700 leading-relaxed max-w-md italic">
                "{guidanceText}"
              </p>
            </div>

            {/* Phase Indicator */}
            {meditationStarted && (
              <div className="mb-6">
                <div className="text-sm text-emerald-600 font-medium capitalize">
                  {currentPhase.replace('_', ' ')} Phase
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!meditationStarted ? (
                <button
                  onClick={startMeditation}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Begin Meditation
                </button>
              ) : (
                <button
                  onClick={stopMeditation}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedMeditation;
