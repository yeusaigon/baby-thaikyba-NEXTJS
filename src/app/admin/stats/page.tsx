// src/app/admin/stats/page.tsx
import React from 'react';
import Link from 'next/link';

// Mock data - replace with real API call
const mockStats = [
  { date: '2024-01-01', exam: 'Toán', score: 85 },
  { date: '2024-02-15', exam: 'Vật lý', score: 78 },
  { date: '2024-03-10', exam: 'Hóa học', score: 92 },
];

export default function AdminStatsPage() {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', fontSize: '0.88rem', color: '#64748b' }}>
        <Link href="/admin" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Quản trị</Link>
        <span>/</span>
        <span style={{ color: '#64748b' }}>Lịch sử coi thi</span>
      </div>
      
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
        Lịch sử coi thi
      </h1>
      
      <div className="card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
          Kết quả thi gần đây
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Ngày thi</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Môn thi</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', textAlign: 'right' }}>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {mockStats.map((row, index) => (
                <tr key={row.date + row.exam} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{row.date}</td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{row.exam}</td>
                  <td style={{ padding: '12px 16px', color: '#334155', textAlign: 'right', fontWeight: '700' }}>{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
