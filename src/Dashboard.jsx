import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, BookOpen, BarChart3, Plus, X, LogOut, Award, Target, Zap, Star, ChevronRight, Flame } from 'lucide-react';
import axios from 'axios';
import PomodoroTimer from './PomodoroTimer';
import Goals from './Goals';

const API_URL = '/api/sessions';

export default function Dashboard({ user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('daily');
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: '',
    date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
    notes: ''
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, {
        headers: getAuthHeader()
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      if (error.response?.status === 401) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const addSession = async () => {
      if (!newSession.subject || !newSession.duration) return;

      try {
        // Criar data no fuso local sem conversão UTC
        const [year, month, day] = newSession.date.split('-');
        const localDate = `${year}-${month}-${day}`;
   
        const response = await axios.post(API_URL, {
          subject: newSession.subject,
          duration: parseFloat(newSession.duration),
          date: localDate,
          notes: newSession.notes
        }, {
          headers: getAuthHeader()
        });


        setSessions([response.data, ...sessions]);
        setNewSession({ 
          subject: '', 
          duration: '', 
          date: new Date().toISOString().split('T')[0], 
          notes: '' 
        });
        setShowModal(false);
      } catch (error) {
        console.error('Erro ao adicionar sessão:', error);
        alert('Erro ao adicionar sessão. Tente novamente.');
      }
    };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API_URL}?id=${id}`, {
        headers: getAuthHeader()
      });
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      alert('Erro ao deletar sessão. Tente novamente.');
    }
  };

    const getFilteredSessions = () => {
      const now = new Date();
      // Pegar data local em YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      return sessions.filter(s => {
        // Extrair só a data (YYYY-MM-DD) do campo date
        const dateOnly = s.date.split('T')[0];
        const sessionDate = new Date(dateOnly + 'T12:00:00');
        
        if (viewMode === 'daily') {
          return dateOnly === today;
        } else if (viewMode === 'weekly') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        } else if (viewMode === 'monthly') {
          return sessionDate.getMonth() === now.getMonth() && 
                sessionDate.getFullYear() === now.getFullYear();
        } else {
          return sessionDate.getFullYear() === now.getFullYear();
        }
      });
    };

  const calculateStats = () => {
    const filtered = getFilteredSessions();
    const totalHours = filtered.reduce((sum, s) => sum + parseFloat(s.duration), 0);
    const bySubject = {};
    
    filtered.forEach(s => {
      bySubject[s.subject] = (bySubject[s.subject] || 0) + parseFloat(s.duration);
    });

    const sortedSubjects = Object.entries(bySubject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalHours, bySubject: sortedSubjects, sessionCount: filtered.length };
  };

    const calculateStreak = () => {
    if (sessions.length === 0) return 0;

    // Ordenar sessões por data (mais recente primeiro)
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = new Date(a.date.split('T')[0]);
      const dateB = new Date(b.date.split('T')[0]);
      return dateB - dateA;
    });

    // Pegar apenas datas únicas
    const uniqueDates = [...new Set(sortedSessions.map(s => s.date.split('T')[0]))];

    // Data de hoje no fuso local
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let streak = 0;
    let currentDate = new Date(today);

    // Começar a contar do dia mais recente
    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = uniqueDates[i];
      const checkDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      if (sessionDate === checkDate) {
        streak++;
        // Voltar um dia
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Se pulou um dia, quebrou a sequência
        break;
      }
    }

    return streak;
  };

  const stats = calculateStats();
  const streak = calculateStreak();
  const filteredSessions = getFilteredSessions();

  const getProgressColor = (hours) => {
    if (hours >= 4) return 'from-green-500 to-emerald-600';
    if (hours >= 2) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getBadgeColor = (hours) => {
    if (hours >= 4) return 'bg-green-500';
    if (hours >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const viewLabels = {
    daily: 'Hoje',
    weekly: 'Esta Semana',
    monthly: 'Este Mês',
    yearly: 'Este Ano'
  };

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500 mx-auto"></div>
            <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400" size={32} />
          </div>
          <p className="text-white font-bold mt-4 text-lg">Carregando seus estudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl">
                    <BookOpen className="text-white" size={32} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white">
                    {getMotivationalMessage()}, {user.name.split(' ')[0]}! 👋
                  </h1>
                  <div className="flex items-center gap-3 mt-1">

                    <span className="text-gray-400">{sessions.length} sessões registradas</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-bold transform hover:scale-105"
                >
                  <Plus size={20} />
                  Nova Sessão
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogout}
                  className="bg-white/5 hover:bg-red-500/20 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all border border-white/10 hover:border-red-500/50 font-semibold"
                >
                  <LogOut size={20} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10 inline-flex gap-2 flex-wrap">
            {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Clock className="text-white" size={24} />
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
            <p className="text-gray-400 text-sm font-semibold mb-1">Total de Horas</p>
            <p className="text-4xl font-black text-white">{stats.totalHours.toFixed(1)}h</p>
          </div>

           <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 hover:border-green-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <p className="text-gray-400 text-sm font-semibold mb-1">Sessões</p>
            <p className="text-4xl font-black text-white">{stats.sessionCount}</p>
          </div> 
          
          <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div className="text-3xl">📈</div>
            </div>
            <p className="text-gray-400 text-sm font-semibold mb-1">Média/Dia</p>
            <p className="text-4xl font-black text-white">
              {viewMode === 'daily' ? stats.totalHours.toFixed(1) : 
               viewMode === 'weekly' ? (stats.totalHours / 7).toFixed(1) :
               viewMode === 'monthly' ? (stats.totalHours / 30).toFixed(1) :
               (stats.totalHours / 365).toFixed(1)}h
            </p>
          </div>

          <div className="group bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Flame className="text-white" size={24} />
              </div>
              <div className="text-3xl">🔥</div>
            </div>
            <p className="text-gray-400 text-sm font-semibold mb-1">Ofensiva</p>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-black text-white">{streak}</p>
              <span className="text-orange-400 font-bold text-lg">
                {streak === 0 ? '' : streak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            {streak >= 7 && <p className="text-orange-300 text-xs mt-2 font-bold">🏆 Uma semana!</p>}
            {streak >= 30 && <p className="text-orange-300 text-xs mt-2 font-bold">👑 Um mês incrível!</p>}
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Subject Breakdown */}
          <div className="lg:col-span-2 space-y-6">

          {/* Sistema de Metas - NOVO! */}
            <Goals sessions={sessions} />
            
            {/* Subject Breakdown */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Target className="text-purple-400" size={24} />
                <h2 className="text-2xl font-black text-white">Matérias Estudadas</h2>
              </div>
              {stats.bySubject.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="text-gray-600 mx-auto mb-4" size={48} />
                  <p className="text-gray-400">Nenhuma sessão registrada neste período</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Adicionar primeira sessão →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.bySubject.map(([subject, hours], index) => (
                    <div key={subject} className="group">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${getBadgeColor(hours)} flex items-center justify-center text-white font-bold text-sm`}>
                            {index + 1}
                          </div>
                          <span className="font-bold text-white text-lg">{subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-semibold">{hours.toFixed(1)}h</span>
                          <span className="text-purple-400 font-bold">({((hours / stats.totalHours) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="relative bg-white/10 rounded-full h-4 overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(hours)} rounded-full transition-all duration-1000 ease-out group-hover:opacity-80`}
                          style={{ width: `${(hours / stats.totalHours) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sessions List */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-pink-400" size={24} />
                <h2 className="text-2xl font-black text-white">Sessões Recentes</h2>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Nenhuma sessão registrada</p>
                  </div>
                ) : (
                  filteredSessions
                    .slice(0, 10)
                    .map(session => (
                      <div key={session.id} className="group bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{session.subject}</h3>
                              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {parseFloat(session.duration)}h
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                              <Calendar size={14} />
                              {(() => {
                                const dateOnly = session.date.split('T')[0];
                                const date = new Date(dateOnly + 'T12:00:00');
                                return date.toLocaleDateString('pt-BR', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                });
                              })()}
                            </p>
                            {session.notes && (
                              <p className="text-gray-300 text-sm mt-2 bg-white/5 rounded-lg p-2 italic">{session.notes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            
          {/* Pomodoro Timer */}
          <PomodoroTimer onSessionComplete={loadSessions} />

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-black text-white mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-xl font-bold flex items-center justify-between transition-all hover:scale-105"
                >
                  <span>Adicionar Sessão</span>
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Motivational Card */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {stats.totalHours >= 4 ? '🔥' : stats.totalHours >= 2 ? '⚡' : '💪'}
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  {stats.totalHours >= 4 ? 'Incrível!' : stats.totalHours >= 2 ? 'Bom trabalho!' : 'Continue assim!'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {stats.totalHours >= 4 
                    ? 'Você está arrasando! Continue nesse ritmo!' 
                    : stats.totalHours >= 2 
                    ? 'Está no caminho certo! Só mais um pouco!'
                    : 'Cada minuto conta! Vamos lá!'}
                </p>
              </div>
            </div>

            {/* Total Overview */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-black text-white mb-4">Visão Geral</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total de Matérias</span>
                  <span className="text-white font-bold">{stats.bySubject.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sessões Registradas</span>
                  <span className="text-white font-bold">{sessions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Horas Totais</span>
                  <span className="text-white font-bold">{sessions.reduce((sum, s) => sum + parseFloat(s.duration), 0).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-gray-400">Ofensiva Atual</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {streak > 0 && <Flame className="text-orange-400" size={16} />}
                  {streak} {streak === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl">
                  <Plus className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white">Nova Sessão de Estudo</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-bold mb-2 text-sm">Matéria</label>
                  <input
                    type="text"
                    value={newSession.subject}
                    onChange={(e) => setNewSession({...newSession, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="Ex: Matemática"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2 text-sm">Duração (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="Ex: 2.5"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2 text-sm">Data</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2 text-sm">Anotações (opcional)</label>
                  <textarea
                    value={newSession.notes}
                    onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                    rows="3"
                    placeholder="Ex: Estudei cálculo integral..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={addSession}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}