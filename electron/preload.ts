import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload script - expose safe APIs to renderer process
 */

console.log('[Preload] Loading preload script...')

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 打开文件选择对话框
   */
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),

  /**
   * 保存文件对话框
   */
  saveFile: (options?: any) => ipcRenderer.invoke('dialog:saveFile', options),

  /**
   * PDF合并
   */
  mergePDF: (filePaths: string[], outputPath: string) =>
    ipcRenderer.invoke('pdf:merge', filePaths, outputPath),

  /**
   * PDF拆分
   */
  splitPDF: (filePath: string, options: any) =>
    ipcRenderer.invoke('pdf:split', filePath, options),

  /**
   * PDF转Word
   */
  convertPDF: (filePath: string, outputPath: string) =>
    ipcRenderer.invoke('pdf:convert', filePath, outputPath),

  /**
   * PDF压缩
   */
  compressPDF: (filePath: string, outputPath: string, quality: number) =>
    ipcRenderer.invoke('pdf:compress', filePath, outputPath, quality),

  /**
   * PDF加水印
   */
  addWatermark: (filePath: string, outputPath: string, options: any) =>
    ipcRenderer.invoke('pdf:addWatermark', filePath, outputPath, options),

  /**
   * 列出目录内容（自定义文件浏览器）
   */
  listDir: (dirPath: string) =>
    ipcRenderer.invoke('fs:listDir', dirPath),

  /**
   * 列出可用盘符（Windows）
   */
  listDrives: () =>
    ipcRenderer.invoke('fs:listDrives'),

  /**
   * 获取文件信息（快速返回基本信息）
   */
  getFileInfo: (filePath: string) =>
    ipcRenderer.invoke('file:getInfo', filePath),

  /**
   * 获取PDF页数（按需调用）
   */
  getPageCount: (filePath: string) =>
    ipcRenderer.invoke('pdf:getPageCount', filePath),

  /**
   * PDF转Excel
   */
  convertToExcel: (filePath: string, outputPath: string) =>
    ipcRenderer.invoke('pdf:convertExcel', filePath, outputPath),

  /**
   * PDF页面排序
   */
  reorderPages: (filePath: string, outputPath: string, pageOrder: number[]) =>
    ipcRenderer.invoke('pdf:reorder', filePath, outputPath, pageOrder),

  /**
   * PDF页面删除
   */
  deletePages: (filePath: string, outputPath: string, pagesToDelete: number[]) =>
    ipcRenderer.invoke('pdf:deletePages', filePath, outputPath, pagesToDelete),

  /**
   * 获取PDF页面详细信息
   */
  getPageInfo: (filePath: string) =>
    ipcRenderer.invoke('pdf:getPageInfo', filePath),

  /**
   * 监听进度更新
   */
  onProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('progress', (_event, progress) => callback(progress))
  },

  /**
   * 移除进度监听
   */
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('progress')
  },
})

console.log('[Preload] electronAPI exposed successfully')