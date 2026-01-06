import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CultivationIntroModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const text = 'War. War never changes. Since the dawn of human kind, when our ancestors first discovered the killing power of rock and bone, blood has been spilled in the name of everything: from God to justice to simple, psychotic rage. In the year 2077, after millennia of armed conflict, the destructive nature of man could sustain itself no longer. The world was plunged into an abyss of nuclear fire and radiation. But it was not, as some had predicted, the end of the world. Instead, the apocalypse was simply the prologue to another bloody chapter of human history. For man had succeeded in destroying the world - but war, war never changes.';

  // Split text by sentences (periods)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentIndex(0);
    } else {
      setIsVisible(false);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < sentences.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 2500); // Slower pacing for dramatic effect

    return () => clearInterval(timer);
  }, [isOpen, isVisible, sentences.length]);

  if (!isOpen || !isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 rounded-lg border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] max-w-3xl w-full p-6 md:p-8 relative font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-500 hover:text-green-400 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-green-500 tracking-widest border-b border-green-500/30 pb-4">
            ARCHIVE LOG 2077
          </h2>
        </div>

        {/* Content Area */}
        <div className="space-y-6 min-h-[300px]">
          {sentences.map((sentence, index) => {
            const shouldShow = index <= currentIndex;

            return (
              <div
                key={index}
                className={`transition-all duration-1000 ${shouldShow
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                  }`}
              >
                <p
                  className={`text-lg md:text-xl font-mono leading-relaxed ${shouldShow ? 'text-green-400' : 'text-green-900'
                    } drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]`}
                >
                  {sentence.trim()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {currentIndex >= sentences.length - 1 && (
          <div className="mt-8 text-center animate-pulse">
            <p className="text-green-600 text-sm">
              [ PRESS ANY KEY TO CONTINUE ]
            </p>
          </div>
        )}

        {/* Reference */}
        <div className="mt-4 text-right">
          <p className="text-green-800 text-xs">
            --- ROOT ACCESS GRANTED
          </p>
        </div>
      </div>
    </div>
  );
};

export default CultivationIntroModal;

