import React from 'react';
import { IoPulseOutline } from 'react-icons/io5';

interface CalorieMiniChartProps {
    last7DaysData: {
        dateStr: string;
        label: string;
        displayDate: string;
        calories: number;
    }[];
    maxCalIn7Days: number;
    calorieGoal: number;
    todayCalories: number;
    todayStr: string;
}

export const CalorieMiniChart: React.FC<CalorieMiniChartProps> = ({
    last7DaysData,
    maxCalIn7Days,
    calorieGoal,
    todayCalories,
    todayStr
}) => {
    return (
        <div className="card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IoPulseOutline style={{ color: '#db2777' }} /> So sánh 7 ngày qua
                </span>
                <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>
                    kcal
                </span>
            </div>
            
            <div style={{ position: 'relative', marginTop: '5px', display: 'flex', justifyContent: 'center' }}>
                <svg width="240" height="110" style={{ overflow: 'visible' }}>
                    {/* Y-axis gridlines */}
                    {[0.5, 1.0].map((ratio, i) => {
                        const yVal = 90 - ratio * 90;
                        const calLabel = Math.round(ratio * maxCalIn7Days);
                        return (
                            <g key={i}>
                                <line x1="0" y1={yVal} x2="240" y2={yVal} stroke="#e2e8f0" strokeDasharray="3 3" />
                                <text x="240" y={yVal - 3} fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="end">
                                    {calLabel}
                                </text>
                            </g>
                        );
                    })}

                    {/* Target Calorie Line */}
                    {(() => {
                        const targetY = 90 - (calorieGoal / maxCalIn7Days) * 90;
                        if (targetY >= 0 && targetY <= 90) {
                            return (
                                <g>
                                    <line x1="0" y1={targetY} x2="240" y2={targetY} stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 2" />
                                    <text x="5" y={targetY - 3} fill="#10b981" fontSize="8" fontWeight="800">
                                        Mục tiêu: {calorieGoal}
                                    </text>
                                </g>
                            );
                        }
                        return null;
                    })()}

                    {/* Bars */}
                    {last7DaysData.map((d, index) => {
                        const barWidth = 16;
                        const gap = 16;
                        const x = index * (barWidth + gap) + 10;
                        const barHeight = Math.max(3, (d.calories / maxCalIn7Days) * 90);
                        const y = 90 - barHeight;
                        
                        const isToday = d.dateStr === todayStr;
                        let barColor = 'rgba(148, 163, 184, 0.3)';
                        if (d.calories > 0) {
                            if (d.calories < 1500) barColor = 'rgba(245, 158, 11, 0.65)';
                            else if (d.calories > 2500) barColor = 'rgba(239, 68, 68, 0.65)';
                            else barColor = 'rgba(16, 185, 129, 0.7)';
                        }
                        if (isToday) {
                            barColor = d.calories > 0 ? (d.calories < 1500 ? '#f59e0b' : d.calories > 2500 ? '#ef4444' : '#10b981') : '#cbd5e1';
                        }

                        return (
                            <g key={index}>
                                <title>{`${d.displayDate} (${d.label}): ${d.calories} kcal`}</title>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx="4"
                                    ry="4"
                                    fill={barColor}
                                    style={{ transition: 'all 0.3s ease' }}
                                />
                                {isToday && (
                                    <circle cx={x + barWidth/2} cy={y - 5} r="2.5" fill="#db2777" />
                                )}
                                <text 
                                    x={x + barWidth / 2} 
                                    y="105" 
                                    fill={isToday ? '#db2777' : '#64748b'} 
                                    fontSize="8" 
                                    fontWeight={isToday ? '800' : '600'} 
                                    textAnchor="middle"
                                >
                                    {d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                <span>Hôm nay: <strong>{todayCalories} kcal</strong></span>
                <span>TB 7 ngày: <strong>{Math.round(last7DaysData.reduce((acc, curr) => acc + curr.calories, 0) / 7)} kcal</strong></span>
            </div>
        </div>
    );
};
