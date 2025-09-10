from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sqlite3
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

def get_db_connection():
    conn = sqlite3.connect('expense_data.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/expenses', methods=['POST'])
@cross_origin()
def add_expense():
    data = request.json
    item = data.get('item')
    brand = data.get('brand')
    amount = data.get('amount')
    date = data.get('date')
    category = data.get('category')
    
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            brand TEXT,
            amount INTEGER NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL
        );
    ''')
    conn.execute("INSERT INTO expenses (item, brand, amount, date, category) VALUES (?, ?, ?, ?, ?)", (item, brand, amount, date, category))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "지출 내역이 성공적으로 저장되었습니다."}), 201

@app.route('/api/expenses', methods=['GET'])
@cross_origin()
def get_expenses():
    conn = get_db_connection()
    expenses = conn.execute("SELECT * FROM expenses ORDER BY date DESC").fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in expenses])

@app.route('/api/expenses/clear', methods=['DELETE'])
@cross_origin()
def clear_expenses():
    if os.path.exists('expense_data.db'):
        os.remove('expense_data.db')
        return jsonify({'message': '데이터가 성공적으로 초기화되었습니다.'}), 200
    else:
        return jsonify({'message': '초기화할 데이터가 없습니다.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
