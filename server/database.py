import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # expenses 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            amount INTEGER NOT NULL,
            date TEXT,
            category TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("데이터베이스 초기화 완료: 'database.db' 파일이 생성되었습니다.")

if __name__ == '__main__':
    init_db()