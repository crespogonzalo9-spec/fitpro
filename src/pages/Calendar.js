import React, { useState, useEffect } from 'react';
import { Plus, CalendarDays, ChevronLeft, ChevronRight, Clock, MoreVertical, Edit, Trash2, MapPin } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, Select, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const CalendarContent = () => {
  const { canManageCalendar } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const canEdit = canManageCalendar();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }
    const q = query(collection(db, 'events'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentGym]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = startingDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    while (days.length < 42) {
      const nextDay = days.length - lastDay.getDate() - startingDay + 1;
      days.push({ date: new Date(year, month + 1, nextDay), isCurrentMonth: false });
    }
    return days;
  };

  const getEventsForDate = (date) => events.filter(e => {
    const eventDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
    return eventDate.toDateString() === date.toDateString();
  });

  const handleSave = async (data) => {
    try {
      const eventData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };
      if (selected?.id) {
        await updateDoc(doc(db, 'events', selected.id), eventData);
        success('Evento actualizado');
      } else {
        await addDoc(collection(db, 'events'), { ...eventData, createdAt: serverTimestamp() });
        success('Evento creado');
      }
      setShowModal(false);
      setSelected(null);
      setSelectedDate(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'events', selected.id));
      success('Evento eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const handleDayClick = (day) => {
    if (!canEdit) return;
    setSelectedDate(day.date);
    setSelected(null);
    setShowModal(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelected(event);
    if (canEdit) setShowModal(true);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getEventColor = (type) => {
    const colors = { competition: 'bg-red-500/20 text-red-400 border-red-500/30', special: 'bg-purple-500/20 text-purple-400 border-purple-500/30', holiday: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    return colors[type] || 'bg-primary-20 text-primary border-primary-30';
  };

  const upcomingEvents = events.filter(e => { const d = e.date?.toDate ? e.date.toDate() : new Date(e.date); return d >= new Date(); }).sort((a, b) => { const da = a.date?.toDate ? a.date.toDate() : new Date(a.date); const db = b.date?.toDate ? b.date.toDate() : new Date(b.date); return da - db; }).slice(0, 5);

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={CalendarDays} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-gray-400">Eventos y actividades del gimnasio</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setSelectedDate(new Date()); setShowModal(true); }}>Nuevo Evento</Button>}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-gray-700 rounded-lg"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-gray-700 rounded-lg"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            return (
              <div key={idx} onClick={() => handleDayClick(day)} className={`min-h-20 sm:min-h-24 p-1 sm:p-2 rounded-lg border transition-colors ${day.isCurrentMonth ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-900/30 border-gray-800 text-gray-600'} ${canEdit ? 'cursor-pointer hover:border-gray-600' : ''} ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : ''}`}>
                <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>{day.date.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div key={event.id} onClick={(e) => handleEventClick(e, event)} className={`text-xs p-1 rounded truncate cursor-pointer border ${getEventColor(event.type)}`}>{event.title}</div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 2} más</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Próximos Eventos</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getEventColor(event.type)}`}><CalendarDays size={24} /></div>
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{formatDate(event.date)}</span>
                      {event.time && <span className="flex items-center gap-1"><Clock size={12} />{event.time}</span>}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(event); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(event); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <EventModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); setSelectedDate(null); }} onSave={handleSave} event={selected} defaultDate={selectedDate} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar Evento" message={`¿Eliminar "${selected?.title}"?`} confirmText="Eliminar" />
    </div>
  );
};

const EventModal = ({ isOpen, onClose, onSave, event, defaultDate }) => {
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', location: '', type: 'class' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      setForm({ title: event.title || '', description: event.description || '', date: eventDate.toISOString().split('T')[0], time: event.time || '', location: event.location || '', type: event.type || 'class' });
    } else if (defaultDate) {
      setForm({ title: '', description: '', date: defaultDate.toISOString().split('T')[0], time: '', location: '', type: 'class' });
    }
  }, [event, defaultDate, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setLoading(true);
    await onSave({ ...form, date: new Date(form.date + 'T12:00:00') });
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'Editar Evento' : 'Nuevo Evento'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nombre del evento" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          <Input label="Hora" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
        </div>
        <Select label="Tipo de evento" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={[{ value: 'class', label: '📅 Clase Especial' }, { value: 'competition', label: '🏆 Competencia' }, { value: 'special', label: '⭐ Evento Especial' }, { value: 'holiday', label: '🚫 Feriado / Cierre' }]} />
        <Input label="Ubicación" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ej: Sala principal" />
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const Calendar = () => (<GymRequired><CalendarContent /></GymRequired>);
export default Calendar;
