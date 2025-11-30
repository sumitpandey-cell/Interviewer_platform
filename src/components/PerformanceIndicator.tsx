/**
 * Performance Indicator Component
 * 
 * Displays subtle performance metrics during the interview (optional)
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DifficultyLevel } from '@/lib/performance-tracker';

interface PerformanceIndicatorProps {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    difficulty: DifficultyLevel;
    visible?: boolean;
}

export function PerformanceIndicator({
    currentScore,
    trend,
    difficulty,
    visible = false
}: PerformanceIndicatorProps) {
    if (!visible) return null;

    const getTrendIcon = () => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declining':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Minus className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getDifficultyColor = () => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-500/20 text-green-400';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'hard':
                return 'bg-orange-500/20 text-orange-400';
            case 'expert':
                return 'bg-red-500/20 text-red-400';
        }
    };

    return (
        <Card className="bg-black/60 backdrop-blur-md border-white/10 p-3 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {getTrendIcon()}
                    <span className="text-xs text-white/80">
                        Score: {currentScore}
                    </span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor()}`}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </div>
            </div>
        </Card>
    );
}
