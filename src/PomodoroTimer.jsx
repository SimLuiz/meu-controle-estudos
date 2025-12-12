import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Clock, Coffee, Zap, BookOpen } from 'lucide-react';
import axios from 'axios';

export default function PomodoroTimer({ onSessionComplete }) {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [subject, setSubject] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  
const audioRef = useRef(null);
const hasPlayedSound = useRef(false);
const startTimeRef = useRef(null);

// Mover saveSession para ANTES do useEffect
const saveSession = async () => {
  try {
    const token = localStorage.getItem('token');
    const duration = workMinutes / 60; // Converter para horas
    
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    await axios.post('/api/sessions', {
      subject: subject.trim(),
      duration: duration,
      date: today,
      notes: `🍅 Sessão Pomodoro (${workMinutes} min)`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Notificar o dashboard para recarregar
    if (onSessionComplete) {
      onSessionComplete();
    }

    console.log('Sessão salva automaticamente!');
  } catch (error) {
    console.error('Erro ao salvar sessão do Pomodoro:', error);
  }
};

// AGORA vem o useEffect
useEffect(() => {
  if (timeLeft === 0 && !hasPlayedSound.current) {
    hasPlayedSound.current = true;
    
    // Tocar som
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio error:', e));
    }

    // Se terminou um ciclo de trabalho (não descanso) e tem matéria definida
    if (!isBreak && autoSave && subject.trim()) {
      saveSession();
    }

    // Parar o timer
    setIsRunning(false);

    // Agendar a troca de modo para o próximo render
    setTimeout(() => {
      if (isBreak) {
        setIsBreak(false);
        setTimeLeft(workMinutes * 60);
        setCycles(prev => prev + 1);
      } else {
        setIsBreak(true);
        setTimeLeft(breakMinutes * 60);
      }
      hasPlayedSound.current = false;
    }, 0);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [timeLeft, isBreak, workMinutes, breakMinutes, autoSave, subject]);

  // Efeito do contador
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      // Guardar quando começou
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (!isRunning) {
      startTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);



  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMinutes * 60);
    hasPlayedSound.current = false;
    startTimeRef.current = null;
  };

  const applySettings = (newWork, newBreak) => {
    setWorkMinutes(newWork);
    setBreakMinutes(newBreak);
    setTimeLeft(newWork * 60);
    setIsRunning(false);
    setIsBreak(false);
    setShowSettings(false);
    hasPlayedSound.current = false;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((breakMinutes * 60 - timeLeft) / (breakMinutes * 60)) * 100
    : ((workMinutes * 60 - timeLeft) / (workMinutes * 60)) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnYpBSp+zPLaizsIGGS57OihURELTKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx6OyrWBgJPJnc8sFuJAUuhM/y1YU2Bhxqvu7mnFINDlOq5O+zYBoGPZTY88p5KwUme8rx3I4+CRZitOrpo1QSC0mi4PG8aCAFMYnU886BMAYfcsLu45hPDAk7ldrxx3MoBSh9zPPajj0JF2G3ȵhVDgxIouD0wGsbBjKO1fPQgi4GIXHCȴZLDAk5ldny03oxBit8yPHKfDQHHGq76d2VUQwMTqjh9rtoHAU0jNLzzn0uBSNyw+ΦmE0LDkWl4PK/aiEGLobP8tZ+LwUkcsfx34xACxFcsOrpo1QTDEii4POܞSDF0ep5uugUgwLR5/k9fFuIgUqfMrѕg0+ChhfsuXtpVgXDTyU2fO+byIFLoDM8diGOQgWYrjqrFsZ" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isBreak ? (
            <Coffee className="text-green-400" size={24} />
          ) : (
            <Clock className="text-purple-400" size={24} />
          )}
          <h3 className="text-xl font-black text-white">
            {isBreak ? 'Hora do Descanso' : 'Foco Total'}
          </h3>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Campo de Matéria */}
      {!isBreak && (
        <div className="mb-4">
          <label className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
            <BookOpen size={16} />
            Matéria de estudo
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isRunning}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 disabled:opacity-50"
            placeholder="Ex: Matemática"
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="autoSave"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="autoSave" className="text-gray-400 text-xs">
              Salvar automaticamente como sessão
            </label>
          </div>
        </div>
      )}

      {/* Circular Progress */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`transition-all duration-1000 ${
              isBreak ? 'text-green-400' : 'text-purple-500'
            }`}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black ${isBreak ? 'text-green-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-gray-400 text-sm mt-2 font-semibold">
            {cycles > 0 && `${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'} completos`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={resetTimer}
          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl transition-all border border-white/20"
        >
          <RotateCcw size={24} />
        </button>

        <button
          onClick={toggleTimer}
          disabled={!isBreak && !subject.trim() && autoSave}
          className={`${
            isBreak
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          } text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRunning ? (
            <>
              <Pause size={24} />
              Pausar
            </>
          ) : (
            <>
              <Play size={24} />
              Iniciar
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsBreak(!isBreak);
            setTimeLeft(isBreak ? workMinutes * 60 : breakMinutes * 60);
            setIsRunning(false);
            hasPlayedSound.current = false;
          }}
          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl transition-all border border-white/20"
        >
          <Zap size={24} />
        </button>
      </div>

      {/* Motivational message */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          {!subject.trim() && !isBreak && autoSave ? (
            '📝 Defina a matéria para começar'
          ) : isRunning ? (
            isBreak ? '☕ Relaxe e recarregue as energias!' : '🎯 Mantenha o foco!'
          ) : (
            '▶️ Clique em Iniciar para começar'
          )}
        </p>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">Configurações</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-bold mb-2">
                  Tempo de Foco (minutos)
                </label>
                <input
                  type="number"
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-bold"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Tempo de Descanso (minutos)
                </label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-bold"
                  min="1"
                  max="30"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applySettings(25, 5)}
                  className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  25/5
                  <div className="text-xs text-gray-400">Clássico</div>
                </button>
                <button
                  onClick={() => applySettings(50, 10)}
                  className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  50/10
                  <div className="text-xs text-gray-400">Intenso</div>
                </button>
                <button
                  onClick={() => applySettings(15, 3)}
                  className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  15/3
                  <div className="text-xs text-gray-400">Rápido</div>
                </button>
              </div>

              <button
                onClick={() => applySettings(workMinutes, breakMinutes)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}