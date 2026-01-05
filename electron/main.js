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
      // 指向 .cjs 文件，确保沙箱环境能正确加载
      preload: path.join(__dirname, 'preload.cjs'),
      // 安全设置：禁止渲染进程直接使用 Node.js API
      contextIsolation: true,
      nodeIntegration: false,
    },
    // 开发环境显示图标，生产环境图标由打包工具配置
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  // --- 1. 移除顶部菜单栏 (关键修改) ---
  // 这会隐藏 Windows 上的 "File", "View" 等标准菜单
  mainWindow.setMenu(null);

  // 判断运行环境
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // 开发模式：加载 Vite 本地服务
    mainWindow.loadURL('http://localhost:5173');
    
    // 开发模式下：我们保留 F12 和调试工具，方便你开发调试
    // 如果你连开发时都不想看到它，可以注释掉下面这行
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    // --- 2. 生产模式下：拦截 F12 和调试快捷键 (关键修改) ---
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // 屏蔽 F12, Ctrl+Shift+I, Ctrl+Shift+R
      if (
        input.key === 'F12' || 
        (input.control && input.shift && input.key === 'I') ||
        (input.control && input.shift && input.key === 'R')
      ) {
        event.preventDefault(); // 阻止默认行为
      }
    });
  }
}

// --- 应用生命周期 ---

app.whenReady().then(() => {
  // 1. 初始化数据库
  const userDataPath = app.getPath('userData');
  db.initDB(userDataPath);

  // 2. 注册 IPC 监听器
  ipcMain.handle('db:get-holidays', () => db.getAllHolidays());
  
  ipcMain.handle('db:add-holiday', (event, date) => {
    db.addHoliday(date);
    return true;
  });
  
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