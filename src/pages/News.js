import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, MoreVertical, Edit, Trash2, Image as ImageIcon, Link as LinkIcon, ExternalLink, X } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingState, ConfirmDialog, Avatar, Dropdown, DropdownItem , GymRequired } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatRelativeDate } from '../utils/helpers';
import { compressAndConvertToBase64 } from '../utils/imageUtils';

const NewsContent = () => {
  const { userData, canManageNews } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canManageNews();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const q = query(collection(db, 'news'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setNews(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      const newsData = {
        title: data.title,
        body: data.body,
        link: data.link || null,
        linkText: data.linkText || null,
        imageBase64: data.imageBase64 || null,
        gymId: currentGym.id,
        authorId: userData.id,
        authorName: userData.name
      };

      if (selected?.id) {
        await updateDoc(doc(db, 'news', selected.id), { ...newsData, updatedAt: serverTimestamp() });
        success('Novedad actualizada');
      } else {
        await addDoc(collection(db, 'news'), { ...newsData, createdAt: serverTimestamp() });
        success('Novedad publicada');
      }

      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'news', selected.id));
      success('Novedad eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part}</a>;
      }
      return part;
    });
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Megaphone} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Novedades</h1>
          <p className="text-gray-400">{news.length} publicaciones</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nueva Publicación</Button>}
      </div>

      {news.length === 0 ? (
        <EmptyState icon={Megaphone} title="Sin novedades" description="Aún no hay publicaciones" action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Publicar</Button>} />
      ) : (
        <div className="space-y-4">
          {news.map(item => (
            <Card key={item.id}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={item.authorName} size="md" />
                  <div>
                    <p className="font-medium">{item.authorName}</p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(item.createdAt)}</p>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(item); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(item); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-300 whitespace-pre-wrap mb-3">{renderTextWithLinks(item.body)}</p>

              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-xl hover:bg-primary/30 transition-colors mb-3" style={{ color: 'rgba(var(--color-primary), 1)' }}>
                  <ExternalLink size={16} />
                  {item.linkText || 'Ver más'}
                </a>
              )}

              {item.imageBase64 && (
                <div className="rounded-xl overflow-hidden">
                  <img src={item.imageBase64} alt={item.title} className="w-full max-h-96 object-cover" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <NewsModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} news={selected} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar esta publicación?" confirmText="Eliminar" />
    </div>
  );
};

const NewsModal = ({ isOpen, onClose, onSave, news }) => {
  const [form, setForm] = useState({ title: '', body: '', link: '', linkText: '', imageBase64: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (news) {
      setForm({ title: news.title || '', body: news.body || '', link: news.link || '', linkText: news.linkText || '', imageBase64: news.imageBase64 || '' });
      setImagePreview(news.imageBase64 || null);
    } else {
      setForm({ title: '', body: '', link: '', linkText: '', imageBase64: '' });
      setImagePreview(null);
    }
  }, [news, isOpen]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes'); return; }

    setUploadingImage(true);
    try {
      const base64 = await compressAndConvertToBase64(file, 800, 0.8);
      setForm(prev => ({ ...prev, imageBase64: base64 }));
      setImagePreview(base64);
    } catch (err) {
      alert(err.message || 'Error al procesar imagen');
    }
    setUploadingImage(false);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, imageBase64: '' }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={news ? 'Editar Publicación' : 'Nueva Publicación'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título de la novedad" required />
        <Textarea label="Contenido *" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Escribe el contenido..." required />

        <div className="p-3 bg-gray-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <LinkIcon size={16} />
            <span>Enlace destacado (opcional)</span>
          </div>
          <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://ejemplo.com" />
          <Input value={form.linkText} onChange={e => setForm({ ...form, linkText: e.target.value })} placeholder="Texto del botón (ej: Inscribirse)" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imagen (opcional)</label>
          <div className="flex items-center gap-4">
            <label className={`flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl cursor-pointer transition-colors ${uploadingImage ? 'opacity-50' : ''}`}>
              <ImageIcon size={18} />
              <span>{uploadingImage ? 'Procesando...' : 'Subir imagen'}</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
            </label>
            {imagePreview && (
              <button type="button" onClick={removeImage} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                <X size={16} /> Quitar
              </button>
            )}
          </div>
          {imagePreview && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">📐 Resolución óptima: 800x600px o superior. Se redimensiona automáticamente.</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">{news ? 'Guardar' : 'Publicar'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const News = () => (<GymRequired><NewsContent /></GymRequired>);
export default News;
