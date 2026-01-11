import React from 'react';

export interface VisualEffect {
  id: string;
  type: 'damage' | 'heal' | 'slash' | 'alchemy' | 'crit' | 'miss';
  value?: string;
  color?: string;
  isPlayer?: boolean; // To distinguish who is taking damage/healing
}

interface Props {
  effects: VisualEffect[];
}

const CombatVisuals: React.FC<Props> = ({ effects }) => {
  if (effects.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
      {effects.map((effect) => {
        if (effect.type === 'slash') {
          return (
            <div
              key={effect.id}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-slash opacity-0 rotate-45"
            />
          );
        }

        if (effect.type === 'crit') {
          return (
            <div
              key={effect.id}
              className={`
                absolute left-1/2 -translate-x-1/2 -translate-y-1/2
                text-4xl md:text-6xl font-black font-serif italic animate-crit-pop
                text-yellow-500 stroke-red-800
              `}
              style={{
                textShadow: '0 0 10px rgba(234, 179, 8, 0.8), 3px 3px 0px #7f1d1d',
                left: `${50 + (Math.random() * 30 - 15)}%`,
                top: effect.isPlayer ? `${70 + (Math.random() * 10 - 5)}%` : `${30 + (Math.random() * 10 - 5)}%`,
                zIndex: 10000,
              }}
            >
              {effect.value || 'CRITICAL!'}
            </div>
          );
        }

        if (effect.type === 'miss') {
          return (
            <div
              key={effect.id}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-stone-500 animate-float-up opacity-80"
              style={{
                left: `${50 + (Math.random() * 20 - 10)}%`,
                top: effect.isPlayer ? `${70 + (Math.random() * 10 - 5)}%` : `${30 + (Math.random() * 10 - 5)}%`,
              }}
            >
              MISS
            </div>
          );
        }

        if (effect.type === 'alchemy') {
          const isCrafting = effect.value?.includes('CRAFTING');
          return (
            <div key={effect.id} className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
              {/* Crafting progress/success text */}
              {effect.value && (
                <div
                  className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    ${isCrafting ? 'text-3xl' : 'text-5xl'} font-bold font-terminal animate-float-up
                    ${effect.color || 'text-amber-400'}
                    text-shadow-outline z-10
                  `}
                  style={{
                    textShadow: isCrafting
                      ? '0 0 30px rgba(245, 158, 11, 0.6), 0 2px 4px rgba(0,0,0,0.8)'
                      : '0 0 40px rgba(245, 158, 11, 1), 0 0 60px rgba(245, 158, 11, 0.6), 0 2px 4px rgba(0,0,0,0.8)',
                    animationDuration: isCrafting ? '1.5s' : '2.5s',
                    filter: isCrafting ? 'none' : 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))',
                  }}
                >
                  {effect.value}
                </div>
              )}
              {/* Crafting spark effects */}
              {[...Array(isCrafting ? 12 : 16)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-1/2 left-1/2 rounded-full bg-amber-500 animate-float-up ${
                    isCrafting ? 'w-1.5 h-1.5 opacity-60' : 'w-3 h-3 opacity-90'
                  }`}
                  style={{
                    left: `${50 + Math.cos((i * Math.PI * 2) / (isCrafting ? 12 : 16)) * (isCrafting ? 25 : 40)}%`,
                    top: `${50 + Math.sin((i * Math.PI * 2) / (isCrafting ? 12 : 16)) * (isCrafting ? 25 : 40)}%`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: isCrafting ? '1.5s' : '2.5s',
                    boxShadow: isCrafting
                      ? '0 0 8px rgba(245, 158, 11, 0.6)'
                      : '0 0 15px rgba(245, 158, 11, 1), 0 0 25px rgba(245, 158, 11, 0.6)',
                  }}
                />
              ))}
              {/* Chemical smoke effect */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-toxic-500/30 animate-float-up blur-2xl ${
                  isCrafting ? 'w-40 h-40' : 'w-48 h-48'
                }`}
                style={{
                  animationDuration: isCrafting ? '1.5s' : '2.5s',
                  background: isCrafting
                    ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(34, 197, 94, 0.3) 50%, transparent 70%)',
                }}
              />
              {/* Success Glow Effect */}
              {!isCrafting && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 animate-glow-pulse blur-3xl"
                  style={{
                    animationDuration: '2s',
                  }}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={effect.id}
            className={`
              absolute left-1/2 -translate-x-1/2 -translate-y-1/2
              text-3xl font-bold font-terminal animate-float-up
              ${effect.color || 'text-white'}
              text-shadow-outline
            `}
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              left: `${50 + (Math.random() * 20 - 10)}%`, // Slight random X offset
              top: effect.isPlayer ? `${70 + (Math.random() * 10 - 5)}%` : `${30 + (Math.random() * 10 - 5)}%`, // Position based on target
            }}
          >
            {effect.value}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(CombatVisuals);
