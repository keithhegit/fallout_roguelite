import React from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { ASSETS } from '../constants/assets';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = 'CONFIRM',
  onConfirm,
  showCancel = false,
  cancelText = 'CANCEL',
  onCancel,
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-ink-950',
          borderColor: 'border-emerald-900/50',
          titleColor: 'text-emerald-400',
          defaultTitle: 'SUCCESS',
          glowColor: 'shadow-emerald-500/20',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-ink-950',
          borderColor: 'border-red-900/50',
          titleColor: 'text-red-500',
          defaultTitle: 'SYSTEM ERROR',
          glowColor: 'shadow-red-500/20',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-ink-950',
          borderColor: 'border-yellow-900/50',
          titleColor: 'text-yellow-500',
          defaultTitle: 'WARNING',
          glowColor: 'shadow-yellow-500/20',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          bgColor: 'bg-ink-950',
          borderColor: 'border-blue-900/50',
          titleColor: 'text-blue-400',
          defaultTitle: 'INFORMATION',
          glowColor: 'shadow-blue-500/20',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm font-mono"
      onClick={onClose}
    >
      <div
        className={`bg-ink-950 rounded-none border-2 ${config.borderColor} shadow-2xl max-w-md w-full relative overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />

        {/* CRT 效果层 */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 crt-noise opacity-[0.02]"></div>
          <div className="absolute inset-0 scanline-overlay opacity-[0.04]"></div>
          <div className="absolute inset-0 crt-vignette"></div>
        </div>

        <div className="p-6 relative z-10">
          {/* 图标和标题 */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 bg-stone-900/40 border ${config.borderColor} rounded-none relative group/icon`}>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
              <Icon size={28} className={`${config.iconColor} flex-shrink-0 relative z-10`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-mono font-bold ${config.titleColor} mb-2 uppercase tracking-[0.2em]`}>
                [ {displayTitle} ]
              </h3>
              <div className={`h-[2px] w-full bg-gradient-to-r ${config.borderColor.replace('border-', 'from-')} to-transparent mb-4 opacity-30`}></div>
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line uppercase tracking-wider font-medium">
                {message}
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-4 mt-8">
            {showCancel && (
              <button
                onClick={handleCancel}
                className="group/btn relative px-8 py-3 bg-stone-900/40 hover:bg-stone-800 text-stone-500 border border-stone-800 rounded-none transition-all uppercase tracking-[0.2em] text-[10px] min-h-[44px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10">{cancelText}</span>
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`group/confirm relative px-8 py-3 rounded-none border transition-all uppercase tracking-[0.2em] text-[10px] font-bold min-h-[44px] overflow-hidden ${
                type === 'success'
                  ? 'bg-emerald-900/20 hover:bg-emerald-800/40 text-emerald-500 border-emerald-500/50 hover:border-emerald-400'
                  : type === 'error'
                    ? 'bg-red-900/20 hover:bg-red-800/40 text-red-500 border-red-500/50 hover:border-red-500'
                    : type === 'warning'
                      ? 'bg-yellow-900/20 hover:bg-yellow-800/40 text-yellow-500 border-yellow-500/50 hover:border-yellow-500'
                      : 'bg-blue-900/20 hover:bg-blue-800/40 text-blue-400 border-blue-400/50 hover:border-blue-400'
              }`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/confirm:opacity-100 transition-opacity" />
              <span className="relative z-10">{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

