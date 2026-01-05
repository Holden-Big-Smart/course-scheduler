import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './database.js';

// ESM 环境下模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 加载预加载脚本
      preload: path.join(__dirname, 'preload.js'),
      // 安全设置：禁止渲染进程直接使用 Node.js API
      contextIsolation: true,
      nodeIntegration: false,
    },
    // 开发环境显示图标，生产环境图标由打包工具配置
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  // 判断运行环境
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // 开发模式：加载 Vite 本地服务
    mainWindow.loadURL('http://localhost:5173');
    // 自动打开开发者工具 (F12)
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// --- 应用生命周期 ---

app.whenReady().then(() => {
  // 1. 初始化数据库 (传入 UserData 路径以确保持久化存储)
  const userDataPath = app.getPath('userData');
  db.initDB(userDataPath);

  // 2. 注册 IPC 监听器 (处理 React 发来的请求)
  // 获取所有节假日
  ipcMain.handle('db:get-holidays', () => {
    return db.getAllHolidays();
  });

  // 添加节假日
  ipcMain.handle('db:add-holiday', (event, date) => {
    db.addHoliday(date);
    return true;
  });

  // 移除节假日
  ipcMain.handle('db:remove-holiday', (event, date) => {
    db.removeHoliday(date);
    return true;
  });

  // 3. 创建窗口
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});