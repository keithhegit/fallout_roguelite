import React from 'react';

/**
 * CRTOverlay Component
 * Provides a retro CRT monitor effect with scanlines, flickers, and vignette.
 */
export const CRTOverlay: React.FC = () => {
    return (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden pointer-events-none">
            {/* Scanlines Effect */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Moving Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pip-green/5 to-transparent animate-scan-line" />

            {/* Screen Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.4)_150%)]" />

            {/* Subtle Screen Flicker */}
            <div className="absolute inset-0 bg-pip-green/2 mix-blend-overlay animate-pulse pointer-events-none opacity-20" />
        </div>
    );
};
