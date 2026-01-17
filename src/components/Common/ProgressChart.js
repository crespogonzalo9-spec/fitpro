import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Button } from './index';
import { Activity, Clock, Dumbbell, TrendingUp, Calendar, Award, Zap } from 'lucide-react';

const ProgressChart = ({ sessions, exercises }) => {
  const [metricType, setMetricType] = useState('routines'); // routines, time, exercises, weight, reps, sets, skipped
  const [chartType, setChartType] = useState('line'); // line, bar
  const [timeRange, setTimeRange] = useState(7); // días

  // Filtrar sesiones por rango de tiempo
  const filterSessionsByTimeRange = (sessions, days) => {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    return sessions.filter(s => {
      const sessionDate = s.completedAt?.toDate ? s.completedAt.toDate() : new Date(s.completedAt);
      return sessionDate >= cutoffDate;
    });
  };

  const filteredSessions = filterSessionsByTimeRange(sessions, timeRange);

  // Agrupar sesiones por día
  const groupSessionsByDay = (sessions) => {
    const grouped = {};
    sessions.forEach(session => {
      const date = session.completedAt?.toDate ? session.completedAt.toDate() : new Date(session.completedAt);
      const dateKey = date.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  };

  // Preparar datos según la métrica seleccionada
  const prepareChartData = () => {
    const groupedSessions = groupSessionsByDay(filteredSessions);
    const sortedDates = Object.keys(groupedSessions).sort();

    // Llenar días faltantes con 0
    const allDates = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    for (let i = 0; i <= timeRange; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      allDates.push(dateKey);
    }

    return allDates.map(dateKey => {
      const daySessions = groupedSessions[dateKey] || [];
      const date = new Date(dateKey);
      const dayLabel = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

      let value = 0;
      let label = '';

      switch (metricType) {
        case 'routines':
          value = daySessions.length;
          label = 'Rutinas';
          break;

        case 'time':
          value = Math.round(daySessions.reduce((sum, s) => sum + (s.totalTimeInSeconds || 0), 0) / 60);
          label = 'Minutos';
          break;

        case 'exercises':
          value = daySessions.reduce((sum, s) => {
            const completedExercises = (s.elementTimes || []).filter(et =>
              et.type === 'exercise' && !et.skipped && (et.timeInSeconds || 0) > 0
            ).length;
            return sum + completedExercises;
          }, 0);
          label = 'Ejercicios';
          break;

        case 'weight':
          // Calcular peso total levantado (estimación basada en ejercicios con peso)
          value = daySessions.reduce((sum, s) => {
            const weightExercises = (s.elementTimes || []).filter(et =>
              et.type === 'exercise' && !et.skipped
            );
            // Estimación simple: asumimos un peso promedio por ejercicio completado
            return sum + (weightExercises.length * 50); // 50kg promedio
          }, 0);
          label = 'Kg (estimado)';
          break;

        case 'reps':
          value = daySessions.reduce((sum, s) => {
            const totalSets = (s.elementTimes || []).reduce((setSum, et) => {
              if (et.type === 'exercise' && !et.skipped && et.completedSets) {
                return setSum + et.completedSets.length;
              }
              return setSum;
            }, 0);
            return sum + totalSets * 10; // Asumimos 10 reps promedio por set
          }, 0);
          label = 'Repeticiones';
          break;

        case 'sets':
          value = daySessions.reduce((sum, s) => {
            const totalSets = (s.elementTimes || []).reduce((setSum, et) => {
              if (et.type === 'exercise' && !et.skipped && et.completedSets) {
                return setSum + et.completedSets.length;
              }
              return setSum;
            }, 0);
            return sum + totalSets;
          }, 0);
          label = 'Series';
          break;

        case 'skipped':
          value = daySessions.reduce((sum, s) => sum + (s.skippedCount || 0), 0);
          label = 'Ejercicios salteados';
          break;

        default:
          value = 0;
          label = '';
      }

      return {
        date: dayLabel,
        value,
        label
      };
    });
  };

  const chartData = prepareChartData();

  // Calcular estadísticas generales
  const calculateStats = () => {
    const totalRoutines = filteredSessions.length;
    const totalTime = Math.round(filteredSessions.reduce((sum, s) => sum + (s.totalTimeInSeconds || 0), 0) / 60);
    const totalExercises = filteredSessions.reduce((sum, s) => {
      return sum + (s.completedCount || 0);
    }, 0);
    const totalSkipped = filteredSessions.reduce((sum, s) => sum + (s.skippedCount || 0), 0);
    const avgTimePerRoutine = totalRoutines > 0 ? Math.round(totalTime / totalRoutines) : 0;

    return {
      totalRoutines,
      totalTime,
      totalExercises,
      totalSkipped,
      avgTimePerRoutine
    };
  };

  const stats = calculateStats();

  const metricOptions = [
    { value: 'routines', label: 'Rutinas completadas', icon: Award },
    { value: 'time', label: 'Tiempo de entrenamiento', icon: Clock },
    { value: 'exercises', label: 'Ejercicios realizados', icon: Dumbbell },
    { value: 'sets', label: 'Series completadas', icon: Activity },
    { value: 'reps', label: 'Repeticiones totales', icon: TrendingUp },
    { value: 'weight', label: 'Peso levantado (est.)', icon: Zap },
    { value: 'skipped', label: 'Ejercicios salteados', icon: Activity }
  ];

  const timeRangeOptions = [
    { value: 7, label: 'Última semana' },
    { value: 14, label: 'Últimas 2 semanas' },
    { value: 30, label: 'Último mes' },
    { value: 90, label: 'Últimos 3 meses' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-400">{payload[0].payload.date}</p>
          <p className="text-lg font-bold text-primary">
            {payload[0].value} {payload[0].payload.label}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Award className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRoutines}</p>
              <p className="text-xs text-gray-400">Rutinas</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTime}</p>
              <p className="text-xs text-gray-400">Minutos</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Dumbbell className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalExercises}</p>
              <p className="text-xs text-gray-400">Ejercicios</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgTimePerRoutine}</p>
              <p className="text-xs text-gray-400">Min/rutina</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Activity className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSkipped}</p>
              <p className="text-xs text-gray-400">Salteados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controles del gráfico */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Métrica
              </label>
              <div className="flex flex-wrap gap-2">
                {metricOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setMetricType(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        metricType === option.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={16} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Período
              </label>
              <div className="flex gap-2">
                {timeRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeRange === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Tipo de gráfico
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    chartType === 'line'
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Línea
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    chartType === 'bar'
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Barras
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Gráfico */}
      <Card>
        <h3 className="text-lg font-bold mb-4">
          {metricOptions.find(m => m.value === metricType)?.label || 'Progreso'}
        </h3>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No hay datos para mostrar en este período</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProgressChart;
