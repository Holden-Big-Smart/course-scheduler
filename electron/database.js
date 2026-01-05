import Database from 'better-sqlite3';
import path from 'path';

let db;

/**
 * 初始化数据库
 * @param {string} userDataPath - 系统的 UserData 路径，确保有读写权限
 */
export function initDB(userDataPath) {
  // 将数据库文件存放在用户的 AppData 目录下，避免安装到 C:\Program Files 后无法写入
  const dbPath = path.join(userDataPath, 'holidays.db');
  
  // verbose: console.log 可以让你在终端看到每一次执行的 SQL 语句，方便调试
  db = new Database(dbPath, { verbose: console.log });
  
  // 创建节假日表 (如果不存在)
  const createTable = `
    CREATE TABLE IF NOT EXISTS holidays (
      date TEXT PRIMARY KEY
    )
  `;
  db.exec(createTable);
  console.log('✅ 数据库已连接:', dbPath);
}

/**
 * 获取所有节假日
 * @returns {string[]} 日期字符串数组 ['2025-01-01', ...]
 */
export function getAllHolidays() {
  const stmt = db.prepare('SELECT date FROM holidays');
  const rows = stmt.all();
  return rows.map(row => row.date);
}

/**
 * 添加节假日 (如果已存在则忽略)
 * @param {string} date - 'YYYY-MM-DD'
 */
export function addHoliday(date) {
  const stmt = db.prepare('INSERT OR IGNORE INTO holidays (date) VALUES (?)');
  stmt.run(date);
}

/**
 * 移除节假日
 * @param {string} date - 'YYYY-MM-DD'
 */
export function removeHoliday(date) {
  const stmt = db.prepare('DELETE FROM holidays WHERE date = ?');
  stmt.run(date);
}