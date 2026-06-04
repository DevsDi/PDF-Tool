import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import * as path from 'path'

// 判断是否开发模式
const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'PDF全能箱',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })

  // 根据环境选择加载方式
  if (isDev) {
    // 开发模式：尝试多个Vite端口
    const tryPorts = [5173, 5174, 5175]
    for (const port of tryPorts) {
      try {
        await mainWindow.loadURL(`http://localhost:${port}`)
        console.log(`成功加载端口: ${port}`)
        break
      } catch {
        // 尝试下一个端口
      }
    }
  } else {
    // 生产模式：加载打包后的本地文件
    const indexPath = join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ===================== IPC 事件处理 =====================

ipcMain.handle('dialog:openFile', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', ...(options?.multiSelections ? ['multiSelections'] : [])],
    filters: [{ name: 'PDF文件', extensions: ['pdf'] }],
  })
  return result
})

ipcMain.handle('dialog:saveFile', async (_event, options) => {
  return await dialog.showSaveDialog(mainWindow!, options)
})

ipcMain.handle('pdf:merge', async (_event, filePaths, outputPath) => {
  return { success: true, data: outputPath }
})

ipcMain.handle('pdf:split', async (_event, filePath, options) => {
  return { success: true, data: [] }
})

ipcMain.handle('pdf:compress', async (_event, filePath, outputPath, quality) => {
  return { success: true, data: { originalSize: 0, compressedSize: 0, ratio: 1 } }
})

ipcMain.handle('pdf:watermark', async (_event, filePath, outputPath, options) => {
  return { success: true, data: outputPath }
})

ipcMain.handle('pdf:encrypt', async (_event, filePath, outputPath, password, permissions) => {
  return { success: true, data: outputPath }
})

ipcMain.handle('pdf:decrypt', async (_event, filePath, outputPath, password) => {
  return { success: true, data: outputPath }
})

ipcMain.handle('pdf:convert', async (_event, filePath, outputPath) => {
  return { success: true, data: outputPath }
})

ipcMain.handle('file:getInfo', async (_event, filePath) => {
  try {
    const stats = fs.statSync(filePath)
    return {
      success: true,
      data: {
        name: path.basename(filePath),
        size: stats.size,
        path: filePath,
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})