from flask import Flask, request, jsonify
from flask_cors import CORS  # 이 줄을 추가합니다.
import sqlite3

app = Flask(__name__)
CORS(app)  # 이 줄을 추가하여 CORS 문제를 해결합니다.

# 데이터베이스와 연결
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# API 엔드포인트: 지출 내역을 받아 저장
@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    item = data.get('item')
    amount = data.get('amount')
    
    conn = get_db_connection()
    conn.execute("INSERT INTO expenses (item, amount) VALUES (?, ?)", (item, amount))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "지출 내역이 성공적으로 저장되었습니다."}), 201

# API 엔드포인트: 지출 내역을 가져오기
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    conn = get_db_connection()
    expenses = conn.execute("SELECT * FROM expenses").fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in expenses])

if __name__ == '__main__':
    app.run(debug=True)