import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import './index.css'; // 이 부분이 있어야 디자인이 적용됩니다.

function App() {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = () => {
    fetch('http://127.0.0.1:5000/api/expenses')
      .then(response => response.json())
      .then(data => setExpenses(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="App">
      <header className="header">
        <div className="logo">AI 소비 코치</div>
      </header>
      
      <main>
        {/* Dashboard 컴포넌트를 화면에 표시합니다. */}
        <Dashboard expenses={expenses} />
        
        {/* ExpenseForm 컴포넌트를 화면에 표시합니다. */}
        <ExpenseForm onExpenseAdded={fetchExpenses} />
      </main>
    </div>
  );
}

export default App;