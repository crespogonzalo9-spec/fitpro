import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronDown, Loader2 } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

// Button con color dinámico
export const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, loading, disabled, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm gap-1.5', md: 'px-4 py-2.5 gap-2', lg: 'px-6 py-3 text-lg gap-2' };
  const variants = {
    primary: 'btn-primary text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-700 text-gray-300'
  };
  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} /> : Icon && <Icon size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
};

// Input
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <input className={`w-full px-4 py-2.5 bg-input border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors`} {...props} />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Textarea
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <textarea className={`w-full px-4 py-2.5 bg-input border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors resize-none`} {...props} />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Select
export const Select = ({ label, options = [], placeholder, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <select className={`w-full px-4 py-2.5 bg-input border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white focus:outline-none transition-colors appearance-none`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// Checkbox
export const Checkbox = ({ label, className = '', ...props }) => (
  <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
    <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-primary bg-input focus:ring-primary" {...props} />
    {label && <span className="text-sm text-gray-300">{label}</span>}
  </label>
);

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-card border border-gray-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// Card
export const Card = ({ children, className = '', hover, onClick }) => (
  <div onClick={onClick} className={`bg-card border border-gray-700/50 rounded-2xl p-4 ${hover ? 'hover:border-primary-30 cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

// Badge con variantes
export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-gray-500/20 text-gray-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/20 text-red-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400'
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] || ''} ${className}`}>{children}</span>;
};

// Avatar
export const Avatar = ({ name, src, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-medium text-white`} style={{ backgroundColor: 'rgba(var(--color-primary), 1)' }}>
      {getInitials(name)}
    </div>
  );
};

// Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <div className={`${sizes[size]} border-2 border-gray-700 border-t-primary rounded-full animate-spin`} style={{ borderTopColor: 'rgba(var(--color-primary), 1)' }} />;
};

// LoadingState
export const LoadingState = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-12"><Spinner size="lg" /><p className="mt-4 text-gray-400">{message}</p></div>
);

// EmptyState
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {Icon && <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4"><Icon className="text-gray-500" size={32} /></div>}
    <h3 className="text-lg font-medium text-gray-300">{title}</h3>
    {description && <p className="text-gray-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// SearchInput
export const SearchInput = ({ value, onChange, placeholder = 'Buscar...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-4 py-2.5 bg-input border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors" />
  </div>
);

// Autocomplete
export const Autocomplete = ({ value, onChange, options = [], placeholder = 'Buscar...', className = '', displayField = 'label', valueField = 'value', error }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    // Sincronizar el input con el valor seleccionado
    const selected = options.find(opt => opt[valueField] === value);
    if (selected) {
      setInputValue(selected[displayField]);
    } else if (!value) {
      setInputValue('');
    }
  }, [value, options, valueField, displayField]);

  const filteredOptions = inputValue
    ? options.filter(opt => opt[displayField].toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
    if (!newValue) {
      onChange('');
    }
  };

  const handleSelect = (option) => {
    setInputValue(option[displayField]);
    onChange(option[valueField]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 bg-input border ${error ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors`}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <button
              key={option[valueField]}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors ${
                idx === selectedIndex ? 'bg-gray-700' : ''
              } ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === filteredOptions.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              {option[displayField]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Tabs
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1 bg-card rounded-xl">
    {tabs.map(tab => (
      <button type="button" key={tab.id} onClick={() => onChange(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`} style={activeTab === tab.id ? { backgroundColor: 'rgba(var(--color-primary), 1)' } : {}}>
        {tab.icon && <tab.icon size={16} />}{tab.label}
      </button>
    ))}
  </div>
);

// ConfirmDialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', confirmVariant = 'danger' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-300 mb-6">{message}</p>
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onClose} className="flex-1">{cancelText}</Button>
      <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">{confirmText}</Button>
    </div>
  </Modal>
);

// Dropdown
export const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) {
        return; // Click en el trigger, no hacer nada
      }
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return; // Click en el menu, no hacer nada
      }
      setIsOpen(false);
    };

    // Usar capture phase para asegurar que se ejecute primero
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Actualizar posición cuando se abre o cuando se hace scroll
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 192; // 12rem = 192px

        setPosition({
          top: rect.bottom + 4,
          left: Math.max(8, rect.right - menuWidth) // Evitar que se salga por la izquierda
        });
      }
    };

    updatePosition();

    // Actualizar posición al hacer scroll
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  // Clone children to add close functionality
  const childrenWithClose = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onClickWrapper: (originalOnClick) => (e) => {
          setIsOpen(false);
          if (originalOnClick) originalOnClick(e);
        }
      });
    }
    return child;
  });

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} style={{ display: 'inline-block' }}>
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-card border border-gray-700 rounded-xl shadow-2xl py-1"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {childrenWithClose}
        </div>,
        document.body
      )}
    </>
  );
};

// DropdownItem
export const DropdownItem = ({ icon: Icon, children, danger, onClick, onClickWrapper }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClickWrapper) {
      onClickWrapper(onClick)(e);
    } else if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <button 
      onClick={handleClick} 
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300'}`}
    >
      {Icon && <Icon size={16} />}{children}
    </button>
  );
};

// StatCard
export const StatCard = ({ icon: Icon, label, value, color = 'emerald' }) => {
  const colors = { emerald: 'bg-emerald-500/20 text-emerald-500', blue: 'bg-blue-500/20 text-blue-500', purple: 'bg-purple-500/20 text-purple-500', orange: 'bg-orange-500/20 text-orange-500', red: 'bg-red-500/20 text-red-500' };
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon size={24} /></div>
        <div><p className="text-gray-400 text-sm">{label}</p><p className="text-2xl font-bold">{value}</p></div>
      </div>
    </Card>
  );
};

// Re-export GymRequired, SuspendedGymScreen and ProgressChart
export { default as GymRequired } from './GymRequired';
export { default as SuspendedGymScreen } from './SuspendedGymScreen';
export { default as ProgressChart } from './ProgressChart';
