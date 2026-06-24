import React from 'react';

// Design tokens
const NAVY      = '#0f172a'; // slate-950
const GOLD      = '#c9922a'; // gold-600
const GOLD_LITE = '#e8c36a'; // lighter gold
const WHITE     = '#f8fafc'; // slate-50
const MUTED     = '#94a3b8'; // slate-400
const MUTED_DIM = '#475569'; // slate-600

export type TemplateFieldConfig = {
    id: string;
    type: 'dynamic' | 'static';
    content?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
};

export type CertificateImageProps = {
    /** Pre-trimmed, max 60 chars. Font size scales automatically. */
    studentName: string;
    /** Cohort title. */
    cohortTitle: string;
    /** e.g. "June 2026" */
    monthName: string;
    /** Max 3 items, each max 70 chars. Section is hidden if empty. */
    learningOutcomes: string[];
    /** e.g. "23 June 2026" */
    issuedDate: string;
    /** When true: renders signature image. When false (default): renders italic text placeholder. */
    useRealSignature?: boolean;
    /** Base64 PNG signature data or absolute signature file path. */
    signatureBase64?: string;
    /** URL for custom background template */
    backgroundUrl?: string;
    /** Array of field configurations for dynamic rendering */
    fieldsConfig?: TemplateFieldConfig[];
};

function getNameFontSize(name: string): number {
    const len = name.trim().length;
    if (len <= 20) return 46; // "Nagesh Kumar"
    if (len <= 30) return 38; // "Krishnapriya Venkataraman"
    if (len <= 40) return 30; // "Aishwarya Manikarnike Rao"
    return 24;                // very long names
}

export function ParticipationCertificateImage({
    studentName,
    cohortTitle,
    monthName,
    learningOutcomes,
    issuedDate,
    useRealSignature = false,
    signatureBase64,
    backgroundUrl,
    fieldsConfig,
}: CertificateImageProps) {
    const nameFontSize = getNameFontSize(studentName);
    const hasOutcomes  = learningOutcomes && learningOutcomes.length > 0;

    // ── 1. Dynamic Configurable Layout (if template provided) ─────────────
    if (backgroundUrl && fieldsConfig && fieldsConfig.length > 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    position: 'relative',
                    width: '800px',
                    height: '1000px',
                    overflow: 'hidden',
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={backgroundUrl} 
                    alt="Certificate Background" 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                {fieldsConfig.map((field, idx) => {
                    let text = '';
                    if (field.type === 'static') {
                        text = field.content || '';
                    } else {
                        switch (field.id) {
                            case 'student_name':
                                text = studentName;
                                break;
                            case 'cohort_title':
                                text = cohortTitle;
                                break;
                            case 'issued_date':
                                text = issuedDate;
                                break;
                            case 'month_name':
                                text = monthName;
                                break;
                            case 'learning_outcomes':
                                text = learningOutcomes.map(o => `• ${o}`).join('\n');
                                break;
                            default:
                                text = '';
                        }
                    }

                    // For fields that require custom font sizing if dynamic (e.g. student_name)
                    const finalFontSize = (field.type === 'dynamic' && field.id === 'student_name') 
                        ? getNameFontSize(text) // Optional: scale name size based on length even in dynamic layout
                        : field.fontSize;

                    return (
                        <div
                            key={field.id + idx}
                            style={{
                                position: 'absolute',
                                top: `${field.y}px`,
                                left: `${field.x}px`,
                                width: `${field.width}px`,
                                height: `${field.height}px`,
                                fontSize: `${finalFontSize}px`,
                                fontFamily: field.fontFamily || 'Playfair Display',
                                color: field.color,
                                textAlign: field.textAlign,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {text}
                        </div>
                    );
                })}
            </div>
        );
    }

    // ── 2. Fallback Hardcoded Layout ──────────────────────────────────────
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '800px',
                height: '1000px',
                backgroundColor: NAVY,
                padding: '60px 48px',
                fontFamily: 'Playfair Display',
                position: 'relative',
                boxSizing: 'border-box',
            }}
        >
            {/* Decorative corner brackets */}
            <div
                style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    width: '32px',
                    height: '32px',
                    borderTop: `2px solid ${GOLD}`,
                    borderRight: `2px solid ${GOLD}`,
                    opacity: 0.4,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    width: '32px',
                    height: '32px',
                    borderBottom: `2px solid ${GOLD}`,
                    borderLeft: `2px solid ${GOLD}`,
                    opacity: 0.4,
                }}
            />

            {/* Header row */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    width: '100%',
                }}
            >
                <span
                    style={{
                        color: GOLD,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                    }}
                >
                    AISHWARYA MANIKARNIKE
                </span>
                <span
                    style={{
                        color: MUTED_DIM,
                        fontSize: '11px',
                        letterSpacing: '1px',
                    }}
                >
                    aishwaryamanikarnike.com
                </span>
            </div>

            {/* Gold divider line */}
            <div
                style={{
                    height: '1px',
                    backgroundColor: GOLD,
                    margin: '24px 0',
                    opacity: 0.6,
                    width: '100%',
                }}
            />

            {/* Main Body content */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    width: '100%',
                }}
            >
                <span
                    style={{
                        color: GOLD,
                        fontSize: '12px',
                        letterSpacing: '4px',
                        fontFamily: 'Inter',
                        textTransform: 'uppercase',
                        marginBottom: '32px',
                    }}
                >
                    Certificate of Participation
                </span>

                <span
                    style={{
                        color: MUTED,
                        fontSize: '14px',
                        fontStyle: 'italic',
                        marginBottom: '20px',
                    }}
                >
                    This is to certify that
                </span>

                <span
                    style={{
                        color: WHITE,
                        fontSize: `${nameFontSize}px`,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '24px',
                        letterSpacing: '1px',
                    }}
                >
                    {studentName}
                </span>

                <span
                    style={{
                        color: MUTED,
                        fontSize: '14px',
                        marginBottom: '16px',
                    }}
                >
                    has actively participated in the
                </span>

                <span
                    style={{
                        color: WHITE,
                        fontSize: '24px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '8px',
                        letterSpacing: '0.5px',
                    }}
                >
                    {cohortTitle}
                </span>

                <span
                    style={{
                        color: GOLD_LITE,
                        fontSize: '16px',
                        fontStyle: 'italic',
                        marginBottom: '36px',
                    }}
                >
                    {monthName} Cohort
                </span>

                {/* Outcomes strip/bullet points */}
                {hasOutcomes && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                height: '1px',
                                backgroundColor: GOLD,
                                margin: '0 0 24px 0',
                                opacity: 0.3,
                                width: '80%',
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '12px',
                                paddingLeft: '40px',
                                paddingRight: '40px',
                            }}
                        >
                            {learningOutcomes.map((outcome, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: GOLD,
                                            fontSize: '14px',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        •
                                    </span>
                                    <span
                                        style={{
                                            color: MUTED,
                                            fontSize: '13px',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {outcome}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Gold divider line */}
            <div
                style={{
                    height: '1px',
                    backgroundColor: GOLD,
                    margin: '24px 0',
                    opacity: 0.6,
                    width: '100%',
                }}
            />

            {/* Footer row */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                    }}
                >
                    <span
                        style={{
                            color: MUTED_DIM,
                            fontSize: '9px',
                            fontFamily: 'Inter',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Issued
                    </span>
                    <span
                        style={{
                            color: MUTED,
                            fontSize: '13px',
                        }}
                    >
                        {issuedDate}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '3px',
                    }}
                >
                    {useRealSignature && signatureBase64 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={signatureBase64}
                            alt="Aishwarya Signature"
                            style={{
                                width: '120px',
                                height: '40px',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                color: GOLD_LITE,
                                fontSize: '20px',
                                fontStyle: 'italic',
                                paddingRight: '10px',
                            }}
                        >
                            Aishwarya Manikarnike
                        </span>
                    )}
                    <div
                        style={{
                            height: '1px',
                            backgroundColor: MUTED_DIM,
                            width: '180px',
                            margin: '4px 0',
                        }}
                    />
                    <span
                        style={{
                            color: MUTED_DIM,
                            fontSize: '9px',
                            fontFamily: 'Inter',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Authorised Signature
                    </span>
                </div>
            </div>
        </div>
    );
}
