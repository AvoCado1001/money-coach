import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc } from 'firebase/firestore';

// eslint-disable-next-line no-undef
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// eslint-disable-next-line no-undef
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyA5Xwd9rMFhVrOuGiqczhO5dQF9kZA7bIY",
  authDomain: "money-coach-39f81.firebaseapp.com",
  projectId: "money-coach-39f81",
  storageBucket: "money-coach-39f81.firebasestorage.app",
  messagingSenderId: "184506512651",
  appId: "1:184506512651:web:3f2f1c688bbf6b2b765e0e",
  measurementId: "G-2XW0CLFVW8"
};

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Chart data constants
const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'];

// AI Coaching Messages (Korean)
const coachingMessages = {
  highSpending: [
    "오늘 지출이 평소보다 많아요! 목표를 다시 한번 확인해 보세요.",
    "소비를 조금 줄여보는 건 어떨까요? 작은 변화가 큰 차이를 만듭니다.",
    "충동적인 소비를 막기 위해 잠시 멈추고 다시 생각해 보세요.",
  ],
  positive: [
    "이번 주 소비가 아주 안정적입니다! 좋은 습관을 유지하세요.",
    "훌륭해요! 목표를 향해 잘 나아가고 있습니다.",
    "소비 패턴이 긍정적으로 바뀌고 있어요! 계속해서 도전해 보세요.",
  ],
  overCategory: (category) => [
    `${category} 지출이 평균보다 높습니다. 해당 카테고리 소비를 줄여보는 것은 어떨까요?`,
    `혹시 ${category}에서 불필요한 지출이 있었나요? 습관을 점검해 보세요.`,
  ],
  specificItem: (item) => [
    `${item} 구매가 잦아 보입니다. 혹시 대체 가능한 방법이 있을까요?`,
    `습관적으로 ${item}을(를) 구매하고 있지는 않나요? 한 번 돌아보는 시간을 가져보세요.`,
  ]
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });
  const [error, setError] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [aiCoaching, setAiCoaching] = useState('데이터를 입력하여 소비 습관을 분석해 보세요!');
  const [dataForCharts, setDataForCharts] = useState({ category: [], daily: [] });

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieContainerRef = useRef(null);
  const barContainerRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  // --- Effect for Authentication State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- Effect for Fetching Firestore Data and Processing for Charts ---
  useEffect(() => {
    if (user) {
      const purchaseCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'purchases');
      const unsubscribe = onSnapshot(purchaseCollectionRef, (snapshot) => {
        const purchaseHistory = snapshot.docs.map(doc => doc.data());
        setPurchases(purchaseHistory);
        processChartData(purchaseHistory);
        analyzeAndCoach(purchaseHistory);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // --- Effect for Drawing Charts ---
  useEffect(() => {
    const drawCharts = () => {
      if (dataForCharts.category.length > 0 && pieChartRef.current && pieContainerRef.current) {
        const container = pieContainerRef.current;
        const canvas = pieChartRef.current;
        const size = Math.min(container.offsetWidth, container.offsetHeight) * 0.9;
        canvas.width = container.offsetWidth;
        canvas.height = size;
        drawPieChart(canvas, dataForCharts.category);
      }
      if (dataForCharts.daily.length > 0 && barChartRef.current && barContainerRef.current) {
        const container = barContainerRef.current;
        const canvas = barChartRef.current;
        canvas.width = container.offsetWidth * 0.9;
        canvas.height = container.offsetHeight * 0.9;
        drawBarChart(canvas, dataForCharts.daily);
      }
    };

    drawCharts();
    window.addEventListener('resize', drawCharts);
    return () => window.removeEventListener('resize', drawCharts);

  }, [dataForCharts]);
  
  // --- Data Processing for Charts ---
  const processChartData = (data) => {
    const categoryData = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + parseFloat(item.amount);
      return acc;
    }, {});
    
    const dailyData = data.reduce((acc, item) => {
      acc[item.date] = (acc[item.date] || 0) + parseFloat(item.amount);
      return acc;
    }, {});
    const sortedDates = Object.keys(dailyData).sort();

    const categoryChartData = Object.keys(categoryData).map(category => ({
      name: category,
      value: categoryData[category]
    }));

    const dailyChartData = sortedDates.map(date => ({
      date: date,
      amount: dailyData[date]
    }));

    setDataForCharts({
      category: categoryChartData,
      daily: dailyChartData
    });
  };

  // --- Chart Drawing Functions using Canvas API ---
  const drawPieChart = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let lastAngle = 0;
    const centerX = canvas.width * 0.25; // 중앙을 왼쪽으로 이동
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3; // 반지름을 더 작게 조정

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 원형 차트 그리기
    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * 2 * Math.PI;
      const endAngle = lastAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, lastAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      
      lastAngle = endAngle;
    });

    // 범례 그리기
    const legendX = centerX + radius + 40; // 범례 위치를 차트 오른쪽으로 조정
    const legendYStart = centerY - (data.length * 15 / 2); // 범례를 세로 중앙에 위치

    data.forEach((d, i) => {
      const legendY = legendYStart + (i * 20);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(legendX, legendY, 10, 10);
      ctx.fillStyle = 'black';
      ctx.font = '12px Noto Sans KR';
      ctx.fillText(`${d.name}: ${d.value.toLocaleString()}원`, legendX + 15, legendY + 10);
    });
  };

  const drawBarChart = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 30;
    const chartWidth = canvas.width - (2 * margin);
    const chartHeight = canvas.height - (2 * margin);
    const maxAmount = Math.max(...data.map(d => d.amount));
    const barWidth = chartWidth / data.length;

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, chartHeight + margin);
    ctx.lineTo(chartWidth + margin, chartHeight + margin);
    ctx.stroke();

    // Draw bars
    data.forEach((d, i) => {
      const barHeight = (d.amount / maxAmount) * chartHeight;
      const x = margin + (i * barWidth) + (barWidth / 4);
      const y = (chartHeight + margin) - barHeight;
      const width = barWidth / 2;

      ctx.fillStyle = '#36A2EB';
      ctx.fillRect(x, y, width, barHeight);

      // Draw labels
      ctx.fillStyle = 'black';
      ctx.font = '10px Noto Sans KR';
      ctx.textAlign = 'center';
      ctx.fillText(d.date, x + width / 2, chartHeight + margin + 15);
      ctx.fillText(d.amount.toLocaleString(), x + width / 2, y - 5);
    });
  };

  // --- AI Coaching Logic ---
  const analyzeAndCoach = (data) => {
    if (data.length === 0) {
      setAiCoaching('데이터를 입력하여 소비 습관을 분석해 보세요!');
      return;
    }
    const totalExpense = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const dailyExpenses = data.reduce((acc, item) => {
      acc[item.date] = (acc[item.date] || 0) + parseFloat(item.amount);
      return acc;
    }, {});
    const avgDailyExpense = totalExpense / Object.keys(dailyExpenses).length;
    const todayExpense = dailyExpenses[today] || 0;
    const categoryData = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + parseFloat(item.amount);
      return acc;
    }, {});
    const maxCategory = Object.keys(categoryData).reduce((a, b) => categoryData[a] > categoryData[b] ? a : b, '');
    const specificItems = ['커피', '배달', '택시'];
    const highFrequencyItem = specificItems.find(item => data.filter(d => d.item.includes(item)).length > 3);

    let newFeedback = '';
    if (todayExpense > avgDailyExpense * 1.5) {
      newFeedback = coachingMessages.highSpending[Math.floor(Math.random() * coachingMessages.highSpending.length)];
    } else if (categoryData[maxCategory] / totalExpense > 0.4) {
      newFeedback = coachingMessages.overCategory(maxCategory)[Math.floor(Math.random() * coachingMessages.overCategory(maxCategory).length)];
    } else if (highFrequencyItem) {
      newFeedback = coachingMessages.specificItem(highFrequencyItem)[Math.floor(Math.random() * coachingMessages.specificItem(highFrequencyItem).length)];
    } else {
      newFeedback = coachingMessages.positive[Math.floor(Math.random() * coachingMessages.positive.length)];
    }
    setAiCoaching(newFeedback);
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    setAuthMessage({ text: '', type: '' });

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthMessage({ text: '로그인 성공!', type: 'success' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'data'), { email: userCredential.user.email });
        setAuthMessage({ text: '회원가입 성공!', type: 'success' });
      }
    } catch (error) {
      setAuthMessage({ text: `인증 실패: ${error.message}`, type: 'error' });
      console.error("Auth error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // --- Purchase Handler ---
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const purchaseData = {
      item: e.target.item.value,
      brand: e.target.brand.value,
      amount: parseFloat(e.target.amount.value),
      date: e.target.date.value,
      category: e.target.category.value,
      userId: user.uid,
    };

    if (!purchaseData.item || !purchaseData.amount || !purchaseData.date) {
      setError("모든 필수 필드를 채워주세요.");
      return;
    }
    
    try {
      const purchaseCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'purchases');
      await addDoc(purchaseCollectionRef, purchaseData);
      e.target.reset();
    } catch (error) {
      console.error("문서 추가 오류:", error);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-8 min-h-screen text-base sm:text-lg">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
          body {
            font-family: 'Noto Sans KR', sans-serif;
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transform transition duration-500 hover:scale-105 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-2 drop-shadow-sm">소비로그</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">AI와 함께하는 스마트한 소비 습관 만들기</p>
          {user && (
            <div id="auth-status" className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              사용자 ID: <span id="user-id" className="font-mono text-base text-gray-700 dark:text-gray-300 font-bold">{user.uid}</span>
            </div>
          )}
          {user && (
            <button onClick={handleLogout} className="mt-4 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300">
              로그아웃
            </button>
          )}
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Authentication Form */}
          {!user && (
            <div className="md:col-span-2 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6">{isLoginMode ? '로그인' : '회원가입'}</h2>
                {authMessage.text && (
                  <div className={`w-full max-w-sm rounded-xl p-4 mb-4 text-center text-white font-medium ${authMessage.type === 'success' ? 'bg-blue-500' : 'bg-red-500'}`}>
                    {authMessage.text}
                  </div>
                )}
                <form onSubmit={handleAuthSubmit} className="space-y-6 w-full text-lg">
                  <div>
                    <label htmlFor="email" className="block font-medium text-gray-700 dark:text-gray-300">이메일</label>
                    <input type="email" id="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-200 p-3" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
                    <input type="password" id="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-200 p-3" />
                  </div>
                  <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300">
                    {isLoginMode ? '로그인' : '회원가입'}
                  </button>
                  <div className="mt-4 text-center">
                    <p className="text-base text-gray-600 dark:text-gray-400">{isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}</p>
                    <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none transition duration-300">
                      {isLoginMode ? '회원가입하기' : '로그인하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Left Column - Data Input Form */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 h-fit transition duration-300 hover:shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b-2 border-indigo-200 dark:border-indigo-700 pb-2">새로운 소비 기록</h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md dark:bg-red-900 dark:border-red-600 dark:text-red-300 mb-4" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-base">
                <div>
                  <label htmlFor="item" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">구매 품목</label>
                  <input type="text" id="item" placeholder="예: 커피" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-4" />
                </div>
                <div>
                  <label htmlFor="brand" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">브랜드/회사</label>
                  <input type="text" id="brand" placeholder="예: 스타벅스" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-4" />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">금액 (원)</label>
                  <input type="number" id="amount" placeholder="예: 5000" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-4" />
                </div>
                <div>
                  <label htmlFor="date" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">구매 날짜</label>
                  <input type="date" id="date" required max={today} defaultValue={today} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-4" />
                </div>
                <div>
                  <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">카테고리</label>
                  <select id="category" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-4">
                    <option value="식비">식비</option>
                    <option value="교통">교통</option>
                    <option value="생활용품">생활용품</option>
                    <option value="취미/여가">취미/여가</option>
                    <option value="의류">의류</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition duration-300 text-lg">
                  지출 추가하기
                </button>
              </form>
            </div>
          )}

          {/* Right Column - Data Analysis & Charts */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition duration-300 hover:shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b-2 border-indigo-200 dark:border-indigo-700 pb-2">소비 분석 리포트</h2>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 text-indigo-700 p-4 rounded-r-lg shadow-inner dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-200 mb-8 text-base">
                <p className="font-bold">AI 코칭</p>
                <p>{aiCoaching}</p>
              </div>

              {purchases.length > 0 ? (
                <div id="chart-section" className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4" ref={pieContainerRef}>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">카테고리별 지출 비중</h3>
                    <canvas ref={pieChartRef} className="w-full h-auto"></canvas>
                  </div>
                  
                  <div className="flex-1 space-y-4" ref={barContainerRef}>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">일별 지출 추이</h3>
                    <canvas ref={barChartRef} className="w-full h-auto"></canvas>
                  </div>
                </div>
              ) : (
                <div id="no-data-message" className="text-center text-gray-500 dark:text-gray-400 p-8 text-base">
                  <p>지출 기록을 추가하면 여기에 전문적인 소비 리포트가 표시됩니다.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
