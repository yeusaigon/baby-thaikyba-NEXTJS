"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDataForWeek } from '@/lib/data';
import { 
    IoBookOutline, IoChevronBackOutline, IoChevronForwardOutline,
    IoBodyOutline, IoPersonAddOutline, IoMedkitOutline, IoCheckboxOutline,
    IoSparklesOutline
} from 'react-icons/io5';

type HandbookSectionProps = {
    profile: any;
};

const clampWeek = (week: number) => Math.max(1, Math.min(42, Math.round(week)));

export default function HandbookSection({ profile }: HandbookSectionProps) {
    const searchParams = useSearchParams();
    const queryWeek = Number(searchParams.get('week'));
    const initialWeek = Number.isFinite(queryWeek) && queryWeek > 0 ? clampWeek(queryWeek) : null;

    const [selectedWeek, setSelectedWeek] = useState<number | null>(initialWeek);
    const timelineRef = useRef<HTMLDivElement>(null);

    const currentWeekFromLmp = useMemo(() => {
        if (!profile?.lmp) return 4;
        const lmpDate = new Date(profile.lmp);
        if (Number.isNaN(lmpDate.getTime())) return 4;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffWeeks = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return clampWeek(diffWeeks || 1);
    }, [profile?.lmp]);

    const week = selectedWeek ?? currentWeekFromLmp;
    const weekData = getDataForWeek(week);

    const totalWeeks = 42;
    const progressPercent = Math.min(Math.max((week / totalWeeks) * 100, 0), 100);
    const remainingWeeks = totalWeeks - week;

    useEffect(() => {
        if (!timelineRef.current) return;
        const container = timelineRef.current;
        const activeItem = container.querySelector('.hb-week-chip.active') as HTMLElement | null;
        if (activeItem) {
            container.scrollTo({
                left: activeItem.offsetLeft - container.clientWidth / 2 + activeItem.clientWidth / 2,
                behavior: 'smooth'
            });
        }
    }, [week]);

    return (
        <div className="hb-wrap fade-in">
            <div className="hb-hero">
                <div className="hb-hero-row">
                    <div className="hb-hero-icon">
                        <IoBookOutline size={28} />
                    </div>
                    <div className="hb-hero-copy">
                        <div className="hb-kicker">Cẩm nang tuần thai</div>
                        <h3>Tuần {week}</h3>
                        <p>
                            Thông tin rút gọn theo từng tuần, đặt chung trong nhóm tab Hành trình 40 tuần để tránh mở thêm một app riêng.
                        </p>
                    </div>
                </div>

                <div className="hb-progress">
                    <div className="hb-progress-meta">
                        <span>Tuần {week} / 42</span>
                        <span>Còn {remainingWeeks} tuần đến ngày dự sinh</span>
                    </div>
                    <div className="hb-progress-track">
                        <div className="hb-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <div className="hb-controls">
                <button className="hb-nav-btn" onClick={() => setSelectedWeek((prev) => clampWeek((prev ?? currentWeekFromLmp) - 1))}>
                    <IoChevronBackOutline />
                </button>
                <div className="hb-week-strip" ref={timelineRef}>
                    {Array.from({ length: 42 }, (_, i) => i + 1).map((w) => (
                        <button
                            key={w}
                            onClick={() => setSelectedWeek(w)}
                            className={`hb-week-chip ${w === week ? 'active' : ''}`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
                <button className="hb-nav-btn" onClick={() => setSelectedWeek((prev) => clampWeek((prev ?? currentWeekFromLmp) + 1))}>
                    <IoChevronForwardOutline />
                </button>
            </div>

            <div className="hb-grid">
                <div className="hb-card hb-summary">
                    <div className="hb-summary-top">
                        <div className="hb-emoji">{weekData.emoji}</div>
                        <div>
                            <div className="hb-size-label">Kích thước bằng</div>
                            <div className="hb-size-value">{weekData.size}</div>
                            <div className="hb-weight-value">Ước lượng: {weekData.weight}</div>
                        </div>
                    </div>
                    <div className="hb-summary-lines">
                        <div className="hb-mini-line">
                            <IoBodyOutline size={16} />
                            <span>{weekData.baby}</span>
                        </div>
                        <div className="hb-mini-line">
                            <IoPersonAddOutline size={16} />
                            <span>{weekData.mom}</span>
                        </div>
                        <div className="hb-mini-line hb-primary">
                            <IoMedkitOutline size={16} />
                            <span>{weekData.advice}</span>
                        </div>
                    </div>
                </div>

                <div className="hb-stack">
                    {weekData.symptoms.length > 0 && (
                        <div className="hb-card">
                            <h4 className="hb-card-title"><IoSparklesOutline /> Triệu chứng thường gặp</h4>
                            <div className="hb-list">
                                {weekData.symptoms.map((item, index) => (
                                    <div key={index} className="hb-list-item">
                                        <span className="hb-dot" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {weekData.toDoList.length > 0 && (
                        <div className="hb-card">
                            <h4 className="hb-card-title"><IoCheckboxOutline /> Việc mẹ nên làm</h4>
                            <div className="hb-list">
                                {weekData.toDoList.map((item, index) => (
                                    <div key={index} className="hb-list-item">
                                        <span className="hb-dot hb-dot-alt" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {weekData.detail.length > 0 && (
                        <div className="hb-card hb-detail">
                            <h4 className="hb-card-title">Ghi chú tuần này</h4>
                            <div className="hb-list">
                                {weekData.detail.map((item, index) => (
                                    <div key={index} className="hb-list-item">
                                        <span className="hb-dot hb-dot-detail" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .hb-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .hb-hero,
                .hb-card {
                    background: rgba(255,255,255,0.74);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.55);
                    box-shadow: var(--shadow-soft);
                    border-radius: 24px;
                }

                .hb-hero {
                    padding: 22px;
                    color: white;
                    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #0ea5e9 100%);
                    box-shadow: 0 12px 30px rgba(13, 148, 136, 0.18);
                }

                .hb-hero-row {
                    display: flex;
                    gap: 14px;
                    align-items: flex-start;
                }

                .hb-hero-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.18);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .hb-kicker {
                    font-size: 0.72rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    opacity: 0.9;
                    margin-bottom: 4px;
                }

                .hb-hero-copy h3 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 900;
                    line-height: 1.2;
                }

                .hb-hero-copy p {
                    margin: 6px 0 0;
                    font-size: 0.88rem;
                    line-height: 1.55;
                    opacity: 0.92;
                    max-width: 720px;
                }

                .hb-progress {
                    margin-top: 16px;
                }

                .hb-progress-meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .hb-progress-track {
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.25);
                    overflow: hidden;
                }

                .hb-progress-fill {
                    height: 100%;
                    background: white;
                    border-radius: inherit;
                    transition: width 0.35s ease;
                }

                .hb-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .hb-nav-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 999px;
                    border: none;
                    background: rgba(255,255,255,0.8);
                    color: #0f766e;
                    box-shadow: var(--shadow-soft);
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .hb-week-strip {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 10px 0;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }

                .hb-week-strip::-webkit-scrollbar {
                    height: 4px;
                }

                .hb-week-strip::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }

                .hb-week-chip {
                    flex: 0 0 42px;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #334155;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .hb-week-chip.active {
                    background: #0f766e;
                    color: white;
                    border-color: #0f766e;
                    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.18);
                    transform: scale(1.08);
                }

                .hb-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 18px;
                }

                .hb-summary {
                    padding: 20px;
                }

                .hb-summary-top {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .hb-emoji {
                    width: 56px;
                    height: 56px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, #ecfeff 0%, #f5f3ff 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }

                .hb-size-label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #0f766e;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .hb-size-value {
                    font-size: 1.35rem;
                    font-weight: 900;
                    color: #0f172a;
                    line-height: 1.2;
                }

                .hb-weight-value {
                    font-size: 0.9rem;
                    color: #475569;
                    margin-top: 2px;
                    font-weight: 600;
                }

                .hb-summary-lines,
                .hb-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .hb-mini-line {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-size: 0.9rem;
                    color: #334155;
                    line-height: 1.55;
                }

                .hb-mini-line svg {
                    color: #0f766e;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .hb-mini-line.hb-primary {
                    color: #0f766e;
                    font-weight: 700;
                }

                .hb-card {
                    padding: 18px;
                }

                .hb-card-title {
                    margin: 0 0 12px;
                    font-size: 1rem;
                    font-weight: 900;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .hb-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .hb-list-item {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    font-size: 0.9rem;
                    color: #334155;
                    line-height: 1.55;
                }

                .hb-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 999px;
                    background: #0f766e;
                    margin-top: 8px;
                    flex-shrink: 0;
                }

                .hb-dot.hb-dot-alt {
                    background: #8b5cf6;
                }

                .hb-dot.hb-dot-detail {
                    background: #f59e0b;
                }

                .hb-detail {
                    border-left: 4px solid #f59e0b;
                }

                @media (min-width: 960px) {
                    .hb-grid {
                        grid-template-columns: 1.05fr 1fr;
                        align-items: start;
                    }
                }

                @media (max-width: 600px) {
                    .hb-controls {
                        gap: 8px;
                    }

                    .hb-week-chip {
                        flex-basis: 38px;
                        width: 38px;
                        height: 38px;
                    }
                }
            `}</style>
        </div>
    );
}
