import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User, AlertCircle, Sparkles, TrendingUp, Award } from 'lucide-react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl w-full">
          
          {/* Left Side - Info */}
          <div className="hidden md:flex flex-col justify-center text-white space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="text-yellow-300" size={20} />
                <span className="text-sm font-semibold">Controle Total dos Seus Estudos</span>
              </div>
              
              <h1 className="text-6xl font-black leading-tight">
                Transforme
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Seus Estudos
                </span>
              </h1>
              
              <p className="text-xl text-gray-300">
                Acompanhe seu progresso, defina metas e alcance seus objetivos acadêmicos com facilidade.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Acompanhe seu Progresso</h3>
                  <p className="text-sm text-gray-400">Visualize suas estatísticas em tempo real</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Relatórios Detalhados</h3>
                  <p className="text-sm text-gray-400">Veja seu desempenho diário, semanal e mensal</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-3 rounded-xl">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Organize por Matérias</h3>
                  <p className="text-sm text-gray-400">Mantenha tudo organizado e acessível</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
                      <BookOpen className="text-white" size={40} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">
                    {isLogin ? 'Bem-vindo de volta!' : 'Comece agora'}
                  </h2>
                  <p className="text-gray-400">
                    {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta em segundos'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3 backdrop-blur-sm">
                    <AlertCircle className="text-red-400" size={20} />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Nome Completo</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                          placeholder="Seu nome completo"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm">Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                    {!isLogin && (
                      <p className="text-gray-400 text-xs mt-2">Mínimo de 6 caracteres</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processando...
                        </span>
                      ) : (
                        isLogin ? 'Entrar' : 'Criar Conta'
                      )}
                    </span>
                  </button>
                </form>

                {/* Toggle */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setFormData({ name: '', email: '', password: '' });
                    }}
                    className="text-purple-300 hover:text-purple-100 font-semibold transition-colors"
                  >
                    {isLogin ? (
                      <>Não tem conta? <span className="text-white">Criar conta</span></>
                    ) : (
                      <>Já tem conta? <span className="text-white">Fazer login</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white">1000+</p>
                  <p className="text-xs text-gray-400">Usuários</p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white">50k+</p>
                  <p className="text-xs text-gray-400">Horas</p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white">98%</p>
                  <p className="text-xs text-gray-400">Satisfação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
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