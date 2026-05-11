'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Colores de marca CENEXPO by Grupo CASGO SAS
const CENEXPO_COLORS = ['#C9A227', '#1565C0', '#0D1B3E'];

function FluidPaths() {
    const paths = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        d: `M 0,${i * 25} Q 300,${i * 25 - 50} 600,${i * 25} T 1200,${i * 25}`,
        opacity: 0.15 + (i % 8) * 0.04,
        width: 2 + (i % 4) * 1.2,
        color: i < 20 ? CENEXPO_COLORS[0] : i < 40 ? CENEXPO_COLORS[1] : CENEXPO_COLORS[2],
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
                className="w-full h-full"
                viewBox="0 0 1200 1000"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
            >
                <title>Animated Background</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={path.opacity}
                        initial={{ pathLength: 0, opacity: path.opacity * 0.3 }}
                        animate={{
                            pathLength: 1,
                            opacity: [path.opacity * 0.3, path.opacity, path.opacity * 0.3],
                        }}
                        transition={{
                            duration: 15 + (path.id % 10),
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: path.id * 0.1,
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function Hero() {
    return (
        <section id="inicio" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #0f2456 40%, #1565C0 100%)' }}>
            <div className="absolute inset-0">
                <FluidPaths />
            </div>

            {/* Resplandor dorado sutil en el centro */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(201,162,39,0.12) 0%, transparent 70%)' }} />

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #C9A227 0%, #E8C84A 40%, #C9A227 80%, #1565C0 100%)' }}>
                            Centro de Exposiciones
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.80)' }}>
                        Espacios modernos para tus convenciones, ferias y eventos corporativos en Armenia, Quindío
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" style={{ background: 'linear-gradient(90deg, #C9A227, #D4A94F)', color: '#0D1B3E', fontWeight: 700, border: 'none' }}
                            className="hover:opacity-90 transition-opacity">
                            Reservar Ahora
                        </Button>
                        <Button size="lg" variant="outline" style={{ borderColor: 'rgba(201,162,39,0.6)', color: '#E8C84A', background: 'transparent' }}
                            className="hover:bg-white/10 transition-colors">
                            Ver Disponibilidad
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
