'use client';

export default function ComingSoonPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a1428 0%, #14213d 50%, #0a1428 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background subtle radial glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Decorative top line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
            }} />

            {/* Content */}
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                maxWidth: '560px',
                zIndex: 1,
            }}>
                {/* Veena symbol / decorative motif */}
                <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1.5rem',
                    opacity: 0.7,
                    letterSpacing: '0.3em',
                    color: '#b8860b',
                }}>
                    ♩ ♪ ♫
                </div>

                {/* Artist name */}
                <h1 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 400,
                    color: '#f5f2ed',
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                }}>
                    Aishwarya Manikarnike
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.05rem',
                    fontStyle: 'italic',
                    color: '#b8860b',
                    margin: '0 0 2rem 0',
                    letterSpacing: '0.05em',
                }}>
                    Veena Artist & Vocalist
                </p>

                {/* Gold divider */}
                <div style={{
                    width: '60px',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
                    margin: '0 auto 2rem',
                }} />

                {/* Tagline */}
                <p style={{
                    fontSize: '0.95rem',
                    fontWeight: 300,
                    color: 'rgba(240, 235, 227, 0.55)',
                    margin: '0 0 2.5rem 0',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                }}>
                    Something beautiful is on its way
                </p>

                {/* Social links */}
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <a
                        href="https://www.instagram.com/aishwaryamanikarnike"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'rgba(240, 235, 227, 0.4)',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            transition: 'color 0.2s',
                            borderBottom: '1px solid rgba(184,134,11,0.3)',
                            paddingBottom: '2px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#b8860b')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240, 235, 227, 0.4)')}
                    >
                        Instagram
                    </a>
                    <a
                        href="https://www.youtube.com/@AishwaryaManikarnike"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'rgba(240, 235, 227, 0.4)',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            transition: 'color 0.2s',
                            borderBottom: '1px solid rgba(184,134,11,0.3)',
                            paddingBottom: '2px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#b8860b')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240, 235, 227, 0.4)')}
                    >
                        YouTube
                    </a>
                </div>
            </div>

            {/* Decorative bottom line */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
            }} />
        </div>
    );
}
