'use client';

import { useState, useEffect } from 'react';
import {
  HomeIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const slides = [
  {
    id: 1,
    icon: SparklesIcon,
    title: 'Bem-vindo ao FinanX!',
    description: 'Seu novo app para organizar suas finanças de forma simples e intuitiva.',
    color: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    id: 2,
    icon: HomeIcon,
    title: 'Dashboard Completo',
    description: 'Visualize seu saldo, entradas e despesas do mês em um único lugar. Acompanhe suas finanças em tempo real.',
    color: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    id: 3,
    icon: PlusCircleIcon,
    title: 'Adicione Transações',
    description: 'Registre suas entradas e despesas facilmente. Clique no botão + para adicionar uma nova transação.',
    color: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-500',
  },
  {
    id: 4,
    icon: CheckCircleIcon,
    title: 'Marque como Pago',
    description: 'Controle suas despesas marcando-as como pagas. Veja o resumo de pagas vs pendentes.',
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
  },
  {
    id: 5,
    icon: CalendarDaysIcon,
    title: 'Parcelamentos e Recorrentes',
    description: 'Cadastre despesas parceladas ou recorrentes. O app cria automaticamente as parcelas futuras.',
    color: 'from-purple-500 to-violet-500',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
  },
  {
    id: 6,
    icon: ArrowDownTrayIcon,
    title: 'Instale o App',
    description: 'Adicione o FinanX à sua tela inicial para acesso rápido. É um PWA que funciona offline!',
    color: 'from-cyan-500 to-teal-500',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-500',
  },
];

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} transition-all duration-500`} />
      
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-white/5 blur-xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-0 right-0 -mt-16 text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          Pular
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${slide.iconBg} flex items-center justify-center transition-all duration-300`}>
            <Icon className={`w-10 h-10 ${slide.iconColor}`} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {slide.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-2 bg-gradient-to-r ' + slide.color
                    : 'w-2 h-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Anterior
              </button>
            )}
            <button
              onClick={nextSlide}
              className={`flex-1 py-3 px-6 rounded-xl text-white font-semibold transition-all bg-gradient-to-r ${slide.color} hover:opacity-90 shadow-lg`}
            >
              {isLastSlide ? 'Começar!' : 'Próximo'}
            </button>
          </div>
        </div>

        {/* Slide counter */}
        <p className="text-center text-white/60 mt-6 text-sm">
          {currentSlide + 1} de {slides.length}
        </p>
      </div>
    </div>
  );
}

