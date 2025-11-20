import React, { useState, useEffect, useRef } from 'react';
import { CookingMethod, Tool } from '../types';
import { Scissors, Flame, Waves, Droplets, Utensils, CircleDashed } from 'lucide-react';

interface GameProps {
  difficulty: number;
  tool: Tool; // For prep/plating stages, we might use a generic tool or the main tool
  onComplete: (score: number) => void; // Score 0-1
}

// --- PREP: WASHING GAME (Rub to clean) ---
export const WashingGame: React.FC<GameProps> = ({ difficulty, onComplete }) => {
  const [cleanliness, setCleanliness] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cleanliness >= 100) {
        onComplete(1);
        return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onComplete(cleanliness / 100);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [cleanliness, onComplete]);

  const handleMove = () => {
    if (cleanliness >= 100) return;
    // Faster cleaning on lower difficulty
    setCleanliness(prev => Math.min(100, prev + (2.5 - difficulty * 0.3)));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 select-none">
      <div className="text-2xl font-bold text-blue-600">清洗食材！</div>
      <div className="text-stone-500 text-sm">在区域内快速移动鼠标/手指来清洗</div>
      
      <div 
        ref={areaRef}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        className="relative w-64 h-64 bg-stone-200 rounded-xl overflow-hidden cursor-pointer border-4 border-blue-200 shadow-inner"
      >
        {/* Dirt Overlay */}
        <div 
            className="absolute inset-0 bg-stone-600 transition-opacity duration-100 pointer-events-none flex items-center justify-center"
            style={{ opacity: 1 - (cleanliness / 100) }}
        >
            <span className="text-white font-bold text-xl opacity-80">脏</span>
        </div>
        
        {/* Clean content underneath */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Droplets size={64} className="text-blue-500" />
        </div>
      </div>

      <div className="w-64 h-4 bg-stone-300 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${cleanliness}%` }} />
      </div>
      <div className="font-mono text-red-500">{timeLeft.toFixed(1)}s</div>
    </div>
  );
};

// --- SERVE: PLATING GAME (Timing) ---
export const PlatingGame: React.FC<GameProps> = ({ difficulty, onComplete }) => {
    const [targetScale, setTargetScale] = useState(1); // The shrinking ring
    const [score, setScore] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const maxRounds = 3;
    
    // Speed based on difficulty
    const speed = 0.01 + (difficulty * 0.005);

    useEffect(() => {
        if (rounds >= maxRounds) {
            onComplete(score / maxRounds);
            return;
        }

        let animationFrame: number;
        if (isActive) {
            const animate = () => {
                setTargetScale(prev => {
                    if (prev <= 0) {
                        // Missed
                        setIsActive(false);
                        setRounds(r => r + 1);
                        return 1;
                    }
                    return prev - speed;
                });
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        } else {
            // Start delay
            const timeout = setTimeout(() => {
                setTargetScale(1);
                setIsActive(true);
            }, 1000);
            return () => clearTimeout(timeout);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [isActive, rounds, score, onComplete, speed]);

    const handleClick = () => {
        if (!isActive) return;
        
        // Check precision (Target is around 0.3 scale)
        // Let's say optimal is 0.2 to 0.4
        const diff = Math.abs(targetScale - 0.3);
        let points = 0;
        if (diff < 0.1) points = 1; // Perfect
        else if (diff < 0.2) points = 0.5; // Okay
        
        setScore(s => s + points);
        setIsActive(false);
        setRounds(r => r + 1);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6" onClick={handleClick}>
            <div className="text-2xl font-bold text-purple-700">摆盘艺术</div>
            <div className="text-stone-500 text-sm">当圆圈缩小到目标大小时点击！</div>

            <div className="relative w-48 h-48 flex items-center justify-center cursor-pointer">
                 {/* Static Target Ring */}
                 <div className="absolute w-full h-full border-4 border-stone-200 rounded-full transform scale-[0.3] flex items-center justify-center">
                    <div className="w-2 h-2 bg-stone-800 rounded-full"></div>
                 </div>
                 
                 {/* Shrinking Ring */}
                 {isActive && (
                     <div 
                        className="absolute w-full h-full border-4 border-purple-500 rounded-full"
                        style={{ transform: `scale(${targetScale})` }}
                     />
                 )}
                 
                 {!isActive && rounds < maxRounds && (
                     <div className="absolute text-xl font-bold text-stone-400">准备...</div>
                 )}
                 
                 {!isActive && rounds >= maxRounds && (
                     <div className="absolute text-xl font-bold text-green-600">完成!</div>
                 )}
            </div>

            <div className="flex gap-2">
                {[...Array(maxRounds)].map((_, i) => (
                    <CircleDashed key={i} className={`transition-colors ${i < rounds ? 'text-purple-600' : 'text-stone-300'}`} />
                ))}
            </div>
        </div>
    );
};

// --- EXISTING GAMES (Optimized imports) ---

export const CuttingGame: React.FC<GameProps> = ({ difficulty, tool, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10 - difficulty);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsFinished(true);
          onComplete(progress / 100);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isFinished, onComplete, progress]);

  const handleClick = () => {
    if (isFinished) return;
    const increment = 5 * (tool?.multiplier || 1);
    const newProgress = Math.min(100, progress + increment);
    setProgress(newProgress);
    if (newProgress >= 100) {
      setIsFinished(true);
      onComplete(1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="text-2xl font-bold text-stone-800">切切切！</div>
      <div className="w-64 h-6 bg-stone-300 rounded-full overflow-hidden border-2 border-stone-500">
        <div className="h-full bg-green-500 transition-all duration-75 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-red-600 font-mono text-xl">{timeLeft.toFixed(1)}s</div>
      <button onClick={handleClick} className="active:scale-95 transform transition bg-stone-100 border-4 border-stone-400 rounded-full p-8 hover:bg-stone-200 shadow-lg">
        <Scissors className="w-12 h-12 text-stone-700" />
      </button>
    </div>
  );
};

export const FryingGame: React.FC<GameProps> = ({ difficulty, tool, onComplete }) => {
  const [temp, setTemp] = useState(0);
  const [isHeating, setIsHeating] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [goodTime, setGoodTime] = useState(0);
  const requiredTime = 3 + difficulty;
  const zoneStart = 40;
  const zoneEnd = 70;

  useEffect(() => {
    if (goodTime >= requiredTime) { onComplete(1); return; }
    if (gameTime > 15) { onComplete(goodTime / requiredTime); return; }
    const interval = setInterval(() => {
      setGameTime(t => t + 0.1);
      setTemp(current => {
        let change = isHeating ? 1.5 * (tool?.multiplier || 1) : -1.0;
        let newTemp = Math.max(0, Math.min(100, current + change));
        return newTemp;
      });
      if (temp >= zoneStart && temp <= zoneEnd) setGoodTime(t => t + 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, [isHeating, temp, gameTime, goodTime, requiredTime, tool, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 select-none">
      <div className="text-2xl font-bold text-orange-800">保持火候！</div>
      <div className="relative w-16 h-64 bg-stone-200 rounded-full border-2 border-stone-400 overflow-hidden">
        <div className="absolute left-0 w-full bg-green-300 opacity-50 border-y border-green-600" style={{ bottom: `${zoneStart}%`, height: `${zoneEnd - zoneStart}%` }} />
        <div className="absolute bottom-0 w-full bg-red-500 transition-all duration-75 ease-linear" style={{ height: `${temp}%` }} />
      </div>
      <div className="w-64 h-4 bg-stone-300 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${(goodTime / requiredTime) * 100}%` }} />
      </div>
      <button
        onMouseDown={() => setIsHeating(true)}
        onMouseUp={() => setIsHeating(false)}
        onMouseLeave={() => setIsHeating(false)}
        onTouchStart={() => setIsHeating(true)}
        onTouchEnd={() => setIsHeating(false)}
        className={`p-6 rounded-full shadow-xl transition-colors ${isHeating ? 'bg-red-600 scale-95' : 'bg-red-500 hover:bg-red-400'}`}
      >
        <Flame className="w-8 h-8 text-white" />
      </button>
    </div>
  );
};

export const StewGame: React.FC<GameProps> = ({ difficulty, tool, onComplete }) => {
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);
  const targetScore = 5 + difficulty * 2;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const spawnRate = 1000 / (1 + (difficulty * 0.2));
    const spawner = setInterval(() => {
      if (bubbles.length < 5) {
        const id = Date.now() + Math.random();
        setBubbles(prev => [...prev, { id, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }]);
        setTimeout(() => { setBubbles(prev => prev.filter(b => b.id !== id)); }, 2000 * (tool?.multiplier || 1));
      }
    }, spawnRate);
    timerRef.current = spawner;
    return () => clearInterval(spawner);
  }, [difficulty, bubbles.length, tool]);

  useEffect(() => {
    if (score >= targetScore) {
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete(1);
    }
  }, [score, targetScore, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 w-full">
        <div className="text-2xl font-bold text-blue-800">消除气泡！</div>
        <div className="text-blue-600 font-medium">{score} / {targetScore}</div>
        <div className="relative w-full max-w-xs h-64 bg-blue-100 rounded-full border-4 border-stone-400 overflow-hidden shadow-inner">
            {bubbles.map(b => (
                <button
                    key={b.id}
                    onClick={() => { setBubbles(prev => prev.filter(x => x.id !== b.id)); setScore(s => s + 1); }}
                    className="absolute w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-300 animate-pulse shadow-md"
                    style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <Waves size={20} />
                </button>
            ))}
        </div>
    </div>
  );
}

// Main Router Component not strictly needed if we compose in App, 
// but useful for the "Cook" stage dynamic rendering
export const MiniGameRouter: React.FC<GameProps & { method: CookingMethod }> = (props) => {
  switch (props.method) {
    case CookingMethod.CUT: return <CuttingGame {...props} />;
    case CookingMethod.FRY: return <FryingGame {...props} />;
    case CookingMethod.STEW: return <StewGame {...props} />;
    case CookingMethod.BAKE: return <FryingGame {...props} />; // Reuse fry logic for bake for now
    default: return <div onClick={() => props.onComplete(1)}>点击烹饪（占位符）</div>;
  }
};