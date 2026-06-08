/**
 * Electron API 类型定义
 */

interface ElectronAPI {
  /** 打开文件选择对话框 */
  openFile: (options?: OpenFileOptions) => Promise<DialogResult>
  /** 保存文件对话框 */
  saveFile: (options?: SaveFileOptions) => Promise<DialogResult>
  /** PDF合并 */
  mergePDF: (filePaths: string[], outputPath: string) => Promise<ProcessResult>
  /** PDF拆分 */
  splitPDF: (filePath: string, options: SplitOptions) => Promise<ProcessResult>
  /** PDF转Word */
  convertPDF: (filePath: string, outputPath: string) => Promise<ProcessResult>
  /** PDF转Excel */
  convertToExcel: (filePath: string, outputPath: string) => Promise<ProcessResult>
  /** PDF压缩 */
  compressPDF: (filePath: string, outputPath: string, quality: number) => Promise<ProcessResult>
  /** PDF加水印 */
  addWatermark: (filePath: string, outputPath: string, options: AddWatermarkOptions) => Promise<ProcessResult>
  /** PDF页面排序 */
  reorderPages: (filePath: string, outputPath: string, pageOrder: number[]) => Promise<ProcessResult>
  /** PDF页面删除 */
  deletePages: (filePath: string, outputPath: string, pagesToDelete: number[]) => Promise<ProcessResult>
  /** 获取文件信息 */
  getFileInfo: (filePath: string) => Promise<FileInfoResult>
  /** 获取PDF页数 */
  getPageCount: (filePath: string) => Promise<ProcessResult>
  /** 获取PDF页面详细信息 */
  getPageInfo: (filePath: string) => Promise<ProcessResult>
  /** 列出目录内容（自定义文件浏览器） */
  listDir: (dirPath: string) => Promise<ListDirResult>
  /** 列出可用盘符（Windows） */
  listDrives: () => Promise<ListDrivesResult>
  /** 监听进度更新 */
  onProgress: (callback: (progress: number) => void) => void
  /** 移除进度监听 */
  removeProgressListener: () => void
}

interface OpenFileOptions {
  /** 是否允许多选 */
  multiSelections?: boolean
  /** 文件类型过滤器 */
  filters?: FileFilter[]
}

interface SaveFileOptions {
  /** 默认文件名 */
  defaultPath?: string
  /** 文件类型过滤器 */
  filters?: FileFilter[]
}

interface FileFilter {
  /** 过滤器名称 */
  name: string
  /** 扩展名数组 */
  extensions: string[]
}

interface DialogResult {
  /** 是否取消 */
  canceled: boolean
  /** 选中的文件路径 */
  filePaths: string[]
  /** 选中的文件路径（带书签） */
  bookmarks?: string[]
}

interface ProcessResult {
  /** 是否成功 */
  success: boolean
  /** 返回数据 */
  data?: any
  /** 错误信息 */
  error?: string
}

interface FileInfoResult {
  /** 是否成功 */
  success: boolean
  /** 文件信息 */
  data?: FileInfo
  /** 错误信息 */
  error?: string
}

interface FileInfo {
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 文件路径 */
  path: string
  /** 页数 */
  pageCount?: number
}

interface SplitOptions {
  /** 拆分方式 */
  mode: 'pageCount' | 'range' | 'extract'
  /** 每个文件的页数 */
  pageCount?: number
  /** 页面范围 */
  ranges?: string
  /** 提取的页码 */
  pages?: number[]
}

interface AddWatermarkOptions {
  /** 水印文字 */
  text: string
  /** 字体大小 */
  fontSize?: number
  /** 透明度 (0-1) */
  opacity?: number
  /** 旋转角度 */
  rotation?: number
  /** 水印位置 */
  position?: 'center' | 'diagonal' | 'tile' | 'bottom' | 'top'
  /** 水印颜色 (hex格式) */
  color?: string
}

interface ListDirResult {
  /** 是否成功 */
  success: boolean
  /** 目录内容 */
  data?: {
    /** 当前路径 */
    currentPath: string
    /** 上级路径（盘符根目录时为空） */
    parentPath: string
    /** 子目录列表 */
    dirs: string[]
    /** PDF文件列表 */
    files: { name: string; path: string; size: number }[]
  }
  /** 错误信息 */
  error?: string
}

interface ListDrivesResult {
  /** 是否成功 */
  success: boolean
  /** 可用盘符列表，如 ["C:\\", "D:\\"] */
  data?: string[]
  /** 错误信息 */
  error?: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}