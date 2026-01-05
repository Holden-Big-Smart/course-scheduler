const { contextBridge, ipcRenderer } = require('electron');

// 将特定的 API 暴露给渲染进程 (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取节假日列表 (返回 Promise)
  getHolidays: () => ipcRenderer.invoke('db:get-holidays'),
  
  // 添加节假日
  addHoliday: (date) => ipcRenderer.invoke('db:add-holiday', date),
  
  // 移除节假日
  removeHoliday: (date) => ipcRenderer.invoke('db:remove-holiday', date)
});