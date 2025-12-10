import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, BookOpen, BarChart3, Plus, X, LogOut } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api/sessions';

export default function Dashboard({ user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('daily');
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
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
      const response = await axios.post(API_URL, {
        ...newSession,
        duration: parseFloat(newSession.duration)
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
    const today = now.toISOString().split('T')[0];
    
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      
      if (viewMode === 'daily') {
        return s.date === today;
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

  const stats = calculateStats();
  const filteredSessions = getFilteredSessions();

  const getProgressColor = (hours) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <BookOpen className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Controle de Estudos</h1>
                <p className="text-gray-500">Olá, {user.name}! 👋</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
              >
                <Plus size={20} />
                Nova Sessão
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Clock className="text-blue-600" size={24} />
              </div>
              <h3 className="text-gray-600 font-semibold">Total de Horas</h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">{stats.totalHours.toFixed(1)}h</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <BarChart3 className="text-green-600" size={24} />
              </div>
              <h3 className="text-gray-600 font-semibold">Sessões</h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">{stats.sessionCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <h3 className="text-gray-600 font-semibold">Média/Dia</h3>
            </div>
            <p className="text-4xl font-bold text-gray-800">
              {viewMode === 'daily' ? stats.totalHours.toFixed(1) : 
               viewMode === 'weekly' ? (stats.totalHours / 7).toFixed(1) :
               viewMode === 'monthly' ? (stats.totalHours / 30).toFixed(1) :
               (stats.totalHours / 365).toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Matérias Estudadas</h2>
          {stats.bySubject.length === 0 ? (
            <p className="text-gray-500">Nenhuma sessão registrada neste período</p>
          ) : (
            <div className="space-y-4">
              {stats.bySubject.map(([subject, hours]) => (
                <div key={subject}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-700">{subject}</span>
                    <span className="text-gray-600">{hours.toFixed(1)}h</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={`${getProgressColor(hours)} h-3 rounded-full transition-all`}
                      style={{ width: `${(hours / stats.totalHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sessões Recentes</h2>
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <p className="text-gray-500">Nenhuma sessão registrada</p>
            ) : (
              filteredSessions
                .slice(0, 10)
                .map(session => (
                  <div key={session.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{session.subject}</h3>
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {parseFloat(session.duration)}h
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm flex items-center gap-2">
                          <Calendar size={16} />
                          {new Date(session.date).toLocaleDateString('pt-BR')}
                        </p>
                        {session.notes && (
                          <p className="text-gray-500 text-sm mt-2 italic">{session.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Nova Sessão de Estudo</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Matéria</label>
                  <input
                    type="text"
                    value={newSession.subject}
                    onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: 2.5"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Data</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Anotações (opcional)</label>
                  <textarea
                    value={newSession.notes}
                    onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                    placeholder="Ex: Estudei cálculo integral..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={addSession}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}