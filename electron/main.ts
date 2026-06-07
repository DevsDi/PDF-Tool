import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'

// 导入PDF服务
import { mergePDF, getPDFInfo, getPageCount } from './services/pdf-merge'
import { splitPDF } from './services/pdf-split'
import { compressPDF } from './services/pdf-compress'
import { reorderPages, deletePages, getPageInfo } from './services/pdf-reorder'

// 单实例检测
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果获取不到锁，说明已有实例运行，退出当前实例
  app.quit()
} else {
  // 当第二个实例启动时，聚焦到已有的主窗口
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// 判断是否开发模式
const isDev = !app.isPackaged

// Python解释器路径
const pythonExe = 'python'

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
      webSecurity: isDev,  // Disable webSecurity for packaged app (file:// needs it for ES modules)
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })

  if (isDev) {
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
    const indexPath = join(__dirname, 'dist/index.html')
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

function sendProgress(progress: number): void {
  mainWindow?.webContents.send('progress', progress)
}

// 打开文件对话框
ipcMain.handle('dialog:openFile', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', ...(options?.multiSelections ? ['multiSelections'] : [])],
    filters: [{ name: 'PDF文件', extensions: ['pdf'] }],
  })
  return result
})

// 保存文件对话框
ipcMain.handle('dialog:saveFile', async (_event, options) => {
  return await dialog.showSaveDialog(mainWindow!, options)
})

// PDF合并
ipcMain.handle('pdf:merge', async (_event, filePaths: string[], outputPath: string) => {
  try {
    sendProgress(10)
    const result = await mergePDF(filePaths, outputPath)
    sendProgress(100)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// PDF拆分
ipcMain.handle('pdf:split', async (_event, filePath: string, options: any) => {
  try {
    sendProgress(10)
    const outputDir = path.dirname(filePath)
    const result = await splitPDF(filePath, outputDir, options)
    sendProgress(100)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// PDF压缩
ipcMain.handle('pdf:compress', async (_event, filePath: string, outputPath: string, quality: number) => {
  try {
    sendProgress(10)
    const result = await compressPDF(filePath, outputPath, quality)
    sendProgress(100)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// PDF转Word - 调用Python脚本
ipcMain.handle('pdf:convert', async (_event, filePath: string, outputPath: string) => {
  try {
    sendProgress(10)

    // 脚本路径（构建后在dist-electron目录）
    const scriptPath = join(__dirname, 'portable-python/scripts/pdf2word.py')

    sendProgress(30)

    await runPythonScript(pythonExe, scriptPath, filePath, outputPath)
    sendProgress(100)
    return { success: true, data: outputPath }
  } catch (error) {
    const msg = (error as Error).message
    if (msg.includes('pdf2docx')) {
      return { success: false, error: '请先安装pdf2docx库: pip install pdf2docx' }
    }
    return { success: false, error: msg }
  }
})

// PDF加水印 - 调用Python脚本
ipcMain.handle('pdf:addWatermark', async (_event, filePath: string, outputPath: string, options: any) => {
  try {
    sendProgress(10)

    // 脚本路径
    const scriptPath = join(__dirname, 'portable-python/scripts/pdf-watermark-add.py')

    // 选项JSON字符串
    const optionsJson = JSON.stringify(options)

    sendProgress(30)

    await runPythonScriptWithArgs(pythonExe, scriptPath, [filePath, outputPath, optionsJson])
    sendProgress(100)
    return { success: true, data: outputPath }
  } catch (error) {
    const msg = (error as Error).message
    if (msg.includes('reportlab') || msg.includes('PyPDF2')) {
      return { success: false, error: '请先安装依赖库: pip install PyPDF2 reportlab' }
    }
    return { success: false, error: msg }
  }
})

// 运行Python脚本
function runPythonScript(pythonExe: string, scriptPath: string, filePath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonExe, [scriptPath, filePath, outputPath])
    let stderr = ''

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(stderr || '转换失败'))
      }
    })

    proc.on('error', reject)
  })
}

// 运行Python脚本（带参数）
function runPythonScriptWithArgs(pythonExe: string, scriptPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonExe, [scriptPath, ...args])
    let stderr = ''

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(stderr || '处理失败'))
      }
    })

    proc.on('error', reject)
  })
}

// 运行Python脚本并获取标准输出
function runPythonScriptWithOutput(pythonExe: string, scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonExe, [scriptPath, ...args])
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(stderr || '处理失败'))
      }
    })

    proc.on('error', reject)
  })
}

// 获取文件信息（快速返回基本信息）
ipcMain.handle('file:getInfo', async (_event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath)

    // 快速返回基本信息，不等待页数
    return {
      success: true,
      data: {
        name: path.basename(filePath),
        size: stats.size,
        path: filePath,
        pageCount: undefined, // 页数由前端异步请求
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// 获取PDF页数（单独接口，按需调用）
ipcMain.handle('pdf:getPageCount', async (_event, filePath: string) => {
  try {
    const pageCount = await getPageCount(filePath)
    return { success: true, data: pageCount }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// PDF转Excel - 调用Python脚本
ipcMain.handle('pdf:convertExcel', async (_event, filePath: string, outputPath: string) => {
  try {
    sendProgress(10)

    // 脚本路径
    const scriptPath = join(__dirname, 'portable-python/scripts/pdf2excel.py')

    sendProgress(30)

    await runPythonScript(pythonExe, scriptPath, filePath, outputPath)
    sendProgress(100)
    return { success: true, data: outputPath }
  } catch (error) {
    const msg = (error as Error).message
    if (msg.includes('pdfplumber')) {
      return { success: false, error: '请先安装依赖库: pip install pdfplumber pandas openpyxl' }
    }
    return { success: false, error: msg }
  }
})

// PDF页面排序
ipcMain.handle('pdf:reorder', async (_event, filePath: string, outputPath: string, pageOrder: number[]) => {
  try {
    sendProgress(10)
    const result = await reorderPages(filePath, outputPath, pageOrder)
    sendProgress(100)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// PDF页面删除
ipcMain.handle('pdf:deletePages', async (_event, filePath: string, outputPath: string, pagesToDelete: number[]) => {
  try {
    sendProgress(10)
    const result = await deletePages(filePath, outputPath, pagesToDelete)
    sendProgress(100)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// 获取PDF页面详细信息
ipcMain.handle('pdf:getPageInfo', async (_event, filePath: string) => {
  try {
    const pageInfo = await getPageInfo(filePath)
    return { success: true, data: pageInfo }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})