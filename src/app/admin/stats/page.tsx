// src/app/admin/stats/page.tsx
import React from 'react';
import Link from 'next/link';
import { Breadcrumbs, Card, CardContent, Grid, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

// Mock data - replace with real API call
const mockStats = [
  { date: '2024-01-01', exam: 'Toán', score: 85 },
  { date: '2024-02-15', exam: 'Vật lý', score: 78 },
  { date: '2024-03-10', exam: 'Hóa học', score: 92 },
];

export default function AdminStatsPage() {
  return (
    <Paper sx={{ p: 4, backgroundColor: '#f5f9fd' }} elevation={0}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link href="/admin">Quản trị</Link>
        <Typography color="text.primary">Lịch sử coi thi</Typography>
      </Breadcrumbs>
      <Typography variant="h4" gutterBottom component="h1" sx={{ fontWeight: '600', color: '#202124' }}>
        Lịch sử coi thi
      </Typography>
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Kết quả thi gần đây
          </Typography>
          <Table component={Paper} sx={{ minWidth: 650 }} aria-label="exam history table">
            <TableHead>
              <TableRow>
                <TableCell>Ngày thi</TableCell>
                <TableCell>Môn thi</TableCell>
                <TableCell align="right">Điểm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStats.map((row) => (
                <TableRow key={row.date + row.exam} hover>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.exam}</TableCell>
                  <TableCell align="right">{row.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Paper>
  );
}
