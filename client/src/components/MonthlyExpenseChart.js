// MonthlyExpenseChart.js

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// '소비로그'에서 AI가 분석한 가상의 월별 소비 데이터
// 실제로는 백엔드 API로부터 이 데이터를 받아와야 합니다.
const data = [
  {
    name: '1월',
    지출액: 350000,
  },
  {
    name: '2월',
    지출액: 420000,
  },
  // ... (다른 월 데이터)
];

const MonthlyExpenseChart = ({ chartData }) => {
  // ⭐️⭐️⭐️ 이 부분을 추가해 주세요. ⭐️⭐️⭐️
  if (!chartData || chartData.length === 0) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData} // prop으로 받은 데이터를 사용하도록 수정
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="지출액" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyExpenseChart;