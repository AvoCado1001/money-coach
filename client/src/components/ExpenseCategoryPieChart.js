import React, { useState } from 'react';

function ExpenseForm({ onExpenseAdded }) {
  const [formData, setFormData] = useState({
    item: '',
    brand: '',
    amount: '',
    date: '',
    category: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 서버로 데이터 전송
    fetch('http://127.0.0.1:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert('지출 내역이 성공적으로 추가되었습니다!');
      setFormData({ item: '', brand: '', amount: '', date: '', category: '' });
      onExpenseAdded();
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('지출 추가에 실패했습니다.');
    });
  };

  // 새로운 초기화 함수
  const handleClear = () => {
    fetch('http://127.0.0.1:5000/api/expenses/clear', {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        onExpenseAdded();
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('데이터 초기화에 실패했습니다.');
    });
  };

  return (
    <div className="card">
      <h2>새로운 지출 입력</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="item">구매 품목</label>
          <input type="text" id="item" value={formData.item} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="brand">브랜드</label>
          <input type="text" id="brand" value={formData.brand} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="amount">금액 (원)</label>
          <input type="number" id="amount" value={formData.amount} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="date">구매 날짜</label>
          <input type="date" id="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="category">카테고리</label>
          <select id="category" value={formData.category} onChange={handleChange} required>
            <option value="">선택</option>
            <option value="식비">식비</option>
            <option value="교통">교통</option>
            <option value="쇼핑">쇼핑</option>
            <option value="문화생활">문화생활</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <button type="submit" className="submit-button">지출 추가</button>
      </form>
      {/* 초기화 버튼은 폼 아래에 위치시킵니다. */}
      <button type="button" onClick={handleClear} className="clear-button">초기화</button>
    </div>
  );
}

export default ExpenseForm;