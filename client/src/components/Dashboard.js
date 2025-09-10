import React from 'react';
import Chart from 'chart.js/auto'; // 차트 라이브러리 불러오기
import { useEffect, useRef } from 'react';

// 차트 색상 팔레트
const chartColors = ['#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#0D388E'];

function Dashboard({ expenses }) {
  const categoryChartRef = useRef(null);
  const monthlyChartRef = useRef(null);

  useEffect(() => {
    // 카테고리별 지출 데이터 준비
    const categoryData = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    const categoryLabels = Object.keys(categoryData);
    const categoryValues = Object.values(categoryData);

    // 월별 지출 데이터 준비
    const monthlyData = expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).getMonth() + 1;
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => a - b);
    const monthlyLabels = sortedMonths.map(month => `${month}월`);
    const monthlyValues = sortedMonths.map(month => monthlyData[month]);

    // 카테고리 차트 렌더링
    if (categoryChartRef.current) {
      if (window.categoryChart) window.categoryChart.destroy();
      window.categoryChart = new Chart(categoryChartRef.current, {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryValues,
            backgroundColor: chartColors,
            borderColor: '#121212',
            borderWidth: 2,
          }]
        },
        options: { plugins: { legend: { position: 'right', labels: { color: '#e0e0e0' } } } }
      });
    }

    // 월별 차트 렌더링
    if (monthlyChartRef.current) {
      if (window.monthlyChart) window.monthlyChart.destroy();
      window.monthlyChart = new Chart(monthlyChartRef.current, {
        type: 'line',
        data: {
          labels: monthlyLabels,
          datasets: [{
            label: '월별 지출',
            data: monthlyValues,
            borderColor: '#2196F3',
            tension: 0.4,
            pointBackgroundColor: '#2196F3',
            pointBorderColor: '#121212',
          }]
        },
        options: {
          scales: {
            x: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            y: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
          }
        }
      });
    }
  }, [expenses]);

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const largestExpense = expenses.reduce((max, item) => (item.amount > max ? item.amount : max), 0);
  const categoryCounts = expenses.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const mostFrequentCategory = Object.keys(categoryCounts).reduce((a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b), '없음');

  return (
    <div>
      <div className="ai-coach-chat card">
        <p className="chat-message">안녕하세요! 스마트한 소비 습관을 만들어볼까요?</p>
      </div>
      <div className="summary-cards">
        <div className="summary-card card">
          <h3>총 지출 금액</h3>
          <p className="amount-display">{totalAmount.toLocaleString()}<span>원</span></p>
        </div>
        <div className="summary-card card">
          <h3>가장 큰 지출</h3>
          <p className="amount-display">{largestExpense.toLocaleString()}<span>원</span></p>
        </div>
        <div className="summary-card card">
          <h3>가장 많은 카테고리</h3>
          <p className="category-display">{mostFrequentCategory}</p>
        </div>
      </div>
      <div className="chart-area card">
        <h3>카테고리별 지출</h3>
        <canvas ref={categoryChartRef}></canvas>
      </div>
      <div className="chart-area card">
        <h3>월별 지출 추이</h3>
        <canvas ref={monthlyChartRef}></canvas>
      </div>
    </div>
  );
}

export default Dashboard;