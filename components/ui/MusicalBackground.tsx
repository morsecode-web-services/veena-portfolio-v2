'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';

/**
 * Carnatic Swaras in three scripts
 */
const SWARAS = [
    { en: 'Sa', hi: 'सा', kn: 'ಸ' },
    { en: 'Re', hi: 'रे', kn: 'ರಿ' },
    { en: 'Ga', hi: 'गा', kn: 'ಗ' },
    { en: 'Ma', hi: 'मा', kn: 'ಮ' },
    { en: 'Pa', hi: 'पा', kn: 'ಪ' },
    { en: 'Dha', hi: 'धा', kn: 'ಧ' },
    { en: 'Ni', hi: 'नी', kn: 'ನಿ' },
];

interface FloatingSwara {
    id: string;
    text: string;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

/**
 * MusicalBackground component
 * Renders subtle floating musical swaras restricted to gutters
 * Configurable via site-config.json feature flags
 */
export default function MusicalBackground() {
    const [mounted, setMounted] = useState(false);
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [swaraElements, setSwaraElements] = useState<FloatingSwara[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadConfig().then(setConfig);

        // Simple mobile detection
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const elements: FloatingSwara[] = [];
        const count = 25;
        const slots = 13; // Vertical segments per side

        for (let i = 0; i < count; i++) {
            const swaraObj = SWARAS[Math.floor(Math.random() * SWARAS.length)];
            const scripts = ['en', 'hi', 'kn'] as const;
            const script = scripts[Math.floor(Math.random() * scripts.length)];

            // Use slots to prevent vertical overlap
            const isLeft = i < count / 2;
            const slotIndex = Math.floor(i % slots);
            const slotHeight = 100 / slots;

            // Randomize within the slot
            const x = isLeft
                ? 1 + Math.random() * 10 // 1-11%
                : 89 + Math.random() * 10; // 89-99%
            const y = (slotIndex * slotHeight) + (Math.random() * (slotHeight * 0.7));

            elements.push({
                id: `swara-${i}-${Math.random()}`,
                text: swaraObj[script],
                x,
                y,
                size: 16 + Math.random() * 24,
                duration: 12 + Math.random() * 13,
                delay: Math.random() * -25,
            });
        }
        setSwaraElements(elements);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Respect configuration flags
    const showOnDesktop = config?.features?.swaraAnimation?.desktop ?? true;
    const showOnMobile = config?.features?.swaraAnimation?.mobile ?? false;

    const isVisible = isMobile ? showOnMobile : showOnDesktop;

    if (!mounted || !isVisible) return null;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[60] select-none" aria-hidden="true">
            {swaraElements.map((swara) => (
                <motion.div
                    key={swara.id}
                    initial={{
                        opacity: 0,
                        scale: 0.8
                    }}
                    animate={{
                        opacity: [0, 0.22, 0.22, 0],
                        y: [0, -80],
                        scale: [0.8, 1.15],
                    }}
                    transition={{
                        duration: swara.duration,
                        repeat: Infinity,
                        delay: swara.delay,
                        ease: "linear"
                    }}
                    className="absolute font-serif font-bold text-gold-600/40"
                    style={{
                        fontSize: swara.size,
                        left: `${swara.x}%`,
                        top: `${swara.y}%`
                    }}
                >
                    {swara.text}
                </motion.div>
            ))}
        </div>
    );
}
