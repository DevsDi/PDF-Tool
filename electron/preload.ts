import { contextBridge, ipcRenderer } from 'electron'

/**
 * 预加载脚本
 * 为渲染进程提供安全的API接口
 */

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
   * PDF去水印
   */
  removeWatermark: (filePath: string, outputPath: string, options: any) =>
    ipcRenderer.invoke('pdf:watermark', filePath, outputPath, options),

  /**
   * PDF加密
   */
  encryptPDF: (filePath: string, outputPath: string, password: string, permissions: any) =>
    ipcRenderer.invoke('pdf:encrypt', filePath, outputPath, password, permissions),

  /**
   * PDF解密
   */
  decryptPDF: (filePath: string, outputPath: string, password: string) =>
    ipcRenderer.invoke('pdf:decrypt', filePath, outputPath, password),

  /**
   * 获取文件信息
   */
  getFileInfo: (filePath: string) =>
    ipcRenderer.invoke('file:getInfo', filePath),

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