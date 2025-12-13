import React, { useState, useEffect } from 'react';
import { Target, Plus, X, Edit2, Check, Trash2, TrendingUp, Calendar } from 'lucide-react';

export default function Goals({ sessions }) {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    type: 'daily', // daily, weekly, monthly
    target: '',
    subject: '' // vazio = geral, preenchido = por matéria
  });

  // Mover loadGoals para ANTES do useEffect
  const loadGoals = async () => {
    try {
      const result = await window.storage.get('study-goals');
      if (result) {
        setGoals(JSON.parse(result.value));
      }
    } catch (err) {
      console.log('Nenhuma meta encontrada', err);
    }
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const saveGoals = async (updatedGoals) => {
    try {
      await window.storage.set('study-goals', JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
    }
  };

  const addGoal = () => {
    if (!newGoal.target || parseFloat(newGoal.target) <= 0) return;

    const goal = {
      id: Date.now(),
      ...newGoal,
      target: parseFloat(newGoal.target),
      createdAt: new Date().toISOString()
    };

    if (editingGoal) {
      const updated = goals.map(g => g.id === editingGoal.id ? { ...goal, id: editingGoal.id } : g);
      saveGoals(updated);
      setEditingGoal(null);
    } else {
      saveGoals([...goals, goal]);
    }

    setNewGoal({ type: 'daily', target: '', subject: '' });
    setShowModal(false);
  };

  const deleteGoal = (id) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const editGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      type: goal.type,
      target: goal.target.toString(),
      subject: goal.subject
    });
    setShowModal(true);
  };

  const calculateProgress = (goal) => {
    const now = new Date();
    let filteredSessions = [];

    if (goal.type === 'daily') {
      const today = now.toISOString().split('T')[0];
      filteredSessions = sessions.filter(s => s.date.split('T')[0] === today);
    } else if (goal.type === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredSessions = sessions.filter(s => {
        const sessionDate = new Date(s.date.split('T')[0] + 'T12:00:00');
        return sessionDate >= weekAgo;
      });
    } else if (goal.type === 'monthly') {
      filteredSessions = sessions.filter(s => {
        const sessionDate = new Date(s.date.split('T')[0] + 'T12:00:00');
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      });
    }

    // Filtrar por matéria se especificado
    if (goal.subject) {
      filteredSessions = filteredSessions.filter(s => 
        s.subject.toLowerCase() === goal.subject.toLowerCase()
      );
    }

    const current = filteredSessions.reduce((sum, s) => sum + parseFloat(s.duration), 0);
    const percentage = Math.min((current / goal.target) * 100, 100);

    return { current, percentage };
  };

  const getGoalLabel = (type) => {
    const labels = {
      daily: 'Diária',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };
    return labels[type];
  };

  const getGoalIcon = (type) => {
    if (type === 'daily') return '📅';
    if (type === 'weekly') return '📊';
    return '🗓️';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'from-green-500 to-emerald-600';
    if (percentage >= 75) return 'from-blue-500 to-cyan-600';
    if (percentage >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="text-yellow-400" size={24} />
          <h2 className="text-2xl font-black text-white">Minhas Metas</h2>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setNewGoal({ type: 'daily', target: '', subject: '' });
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm"
        >
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400 mb-4">Você ainda não tem metas definidas</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            Criar primeira meta →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const { current, percentage } = calculateProgress(goal);
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal.id}
                className={`bg-white/5 border rounded-xl p-4 transition-all ${
                  isCompleted 
                    ? 'border-green-500/50 shadow-lg shadow-green-500/20' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getGoalIcon(goal.type)}</span>
                      <span className="text-white font-bold text-lg">
                        Meta {getGoalLabel(goal.type)}
                        {goal.subject && ` - ${goal.subject}`}
                      </span>
                      {isCompleted && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Check size={12} />
                          Concluída!
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {current.toFixed(1)}h / {goal.target}h
                      <span className="ml-2 text-yellow-400 font-bold">
                        ({percentage.toFixed(0)}%)
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editGoal(goal)}
                      className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(percentage)} rounded-full transition-all duration-1000 flex items-center justify-end pr-2`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage >= 20 && (
                      <span className="text-white text-xs font-bold">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Motivational Message */}
                {!isCompleted && (
                  <p className="text-gray-400 text-xs mt-2">
                    {percentage >= 75 ? '🔥 Quase lá! Continue assim!' :
                     percentage >= 50 ? '💪 Você está no caminho certo!' :
                     percentage >= 25 ? '⚡ Vamos lá, você consegue!' :
                     '🚀 Comece agora e alcance sua meta!'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingGoal(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2">Tipo de Meta</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'monthly'].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewGoal({ ...newGoal, type })}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        newGoal.type === type
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {getGoalIcon(type)} {getGoalLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Horas de Estudo (meta)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-bold"
                  placeholder="Ex: 4"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Matéria (opcional)
                </label>
                <input
                  type="text"
                  value={newGoal.subject}
                  onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  placeholder="Deixe vazio para meta geral"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Se deixar vazio, a meta será para todas as matérias
                </p>
              </div>

              {/* Presets Rápidos */}
              <div>
                <label className="block text-white font-bold mb-2">Presets Rápidos</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewGoal({ ...newGoal, type: 'daily', target: '2' })}
                    className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all"
                  >
                    📅 2h/dia
                  </button>
                  <button
                    onClick={() => setNewGoal({ ...newGoal, type: 'daily', target: '4' })}
                    className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all"
                  >
                    📅 4h/dia
                  </button>
                  <button
                    onClick={() => setNewGoal({ ...newGoal, type: 'weekly', target: '20' })}
                    className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all"
                  >
                    📊 20h/semana
                  </button>
                  <button
                    onClick={() => setNewGoal({ ...newGoal, type: 'monthly', target: '80' })}
                    className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all"
                  >
                    🗓️ 80h/mês
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingGoal(null);
                }}
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={addGoal}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-bold"
              >
                {editingGoal ? 'Salvar' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}