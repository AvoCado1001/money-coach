import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import './index.css';

function App() {
  const [expenses, setExpenses] = useState([]);

  // 백엔드 서버에서 지출 내역을 가져오는 함수
  const fetchExpenses = () => {
    fetch('http://127.0.0.1:5000/api/expenses')
      .then(response => response.json())
      .then(data => setExpenses(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  // 컴포넌트가 처음 로드될 때만 데이터를 가져옵니다.
  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="App">
      <header className="header">
        <div className="logo">AI 소비 코치</div>
      </header>
      
      <main>
        {/* 대시보드 컴포넌트: 지출 데이터를 보여줍니다. */}
        <Dashboard expenses={expenses} />
        
        {/* 지출 입력 폼 컴포넌트: 새로운 데이터를 입력합니다. */}
        <ExpenseForm onExpenseAdded={fetchExpenses} />
      </main>
    </div>
  );
}

export default App;