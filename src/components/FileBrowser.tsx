import { useState, useEffect, useCallback } from 'react'
import { Modal, List, Breadcrumb, Button, Space, Typography, message } from 'antd'
import {
  FolderOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from '@ant-design/icons'

const { Text } = Typography

/**
 * FileBrowser props
 */
interface FileBrowserProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Close callback */
  onClose: () => void
  /** File selection callback */
  onSelect: (filePaths: string[]) => void
  /** Whether to allow multi-select */
  multiSelections?: boolean
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * In-app file browser modal
 * Supports drive switching, directory navigation, and PDF file selection
 */
function FileBrowser({ visible, onClose, onSelect, multiSelections = false }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState('')
  const [dirs, setDirs] = useState<string[]>([])
  const [files, setFiles] = useState<{ name: string; path: string; size: number }[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [drives, setDrives] = useState<string[]>([])

  /**
   * Load directory contents
   */
  const loadDir = useCallback(async (dirPath: string) => {
    if (!window.electronAPI) return

    setLoading(true)
    try {
      const result = await window.electronAPI.listDir(dirPath)
      if (result.success && result.data) {
        setCurrentPath(result.data.currentPath)
        setParentPath(result.data.parentPath)
        setDirs(result.data.dirs)
        setFiles(result.data.files)
        setSelectedFiles(new Set())
      } else {
        message.error('无法读取目录: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      message.error('读取目录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load available drives on Windows
   */
  const loadDrives = useCallback(async () => {
    if (!window.electronAPI?.listDrives) return
    try {
      const result = await window.electronAPI.listDrives()
      if (result.success && result.data) {
        setDrives(result.data)
      }
    } catch {
      // Silently fail — drive listing is optional
    }
  }, [])

  /**
   * Initialize when modal opens
   */
  useEffect(() => {
    if (visible) {
      loadDrives()
      if (!currentPath) {
        loadDir('') // Empty string = default (Documents)
      }
    }
  }, [visible, currentPath, loadDir, loadDrives])

  /**
   * Navigate to a subdirectory
   */
  const handleDirClick = useCallback((dirName: string) => {
    const newPath = currentPath + '\\' + dirName
    loadDir(newPath)
  }, [currentPath, loadDir])

  /**
   * Navigate to parent directory
   */
  const handleGoUp = useCallback(() => {
    if (parentPath) {
      loadDir(parentPath)
    }
  }, [parentPath, loadDir])

  /**
   * Navigate to home directory
   */
  const handleGoHome = useCallback(() => {
    loadDir('')
  }, [loadDir])

  /**
   * Navigate to a specific drive root
   */
  const handleDriveClick = useCallback((driveRoot: string) => {
    loadDir(driveRoot)
  }, [loadDir])

  /**
   * Toggle file selection
   */
  const handleFileClick = useCallback((filePath: string) => {
    if (!multiSelections) {
      setSelectedFiles(new Set([filePath]))
      return
    }
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(filePath)) next.delete(filePath)
      else next.add(filePath)
      return next
    })
  }, [multiSelections])

  /**
   * Double-click to select and confirm
   */
  const handleFileDoubleClick = useCallback((filePath: string) => {
    onSelect([filePath])
    onClose()
  }, [onSelect, onClose])

  /**
   * Confirm selection
   */
  const handleConfirm = useCallback(() => {
    if (selectedFiles.size === 0) {
      message.warning('请选择一个PDF文件')
      return
    }
    onSelect(Array.from(selectedFiles))
    onClose()
  }, [selectedFiles, onSelect, onClose])

  /**
   * Build breadcrumb from path
   */
  const buildBreadcrumb = useCallback(() => {
    if (!currentPath) return null
    const parts = currentPath.replace(/\//g, '\\').split('\\').filter(Boolean)
    return (
      <Breadcrumb
        items={[
          { title: <a onClick={handleGoHome}><HomeOutlined /> 主目录</a> },
          ...parts.map((part, index) => ({
            title: index === parts.length - 1
              ? <Text strong>{part}</Text>
              : <a onClick={() => {
                  const partialPath = parts.slice(0, index + 1).join('\\')
                  loadDir(partialPath)
                }}>{part}</a>
          })),
        ]}
      />
    )
  }, [currentPath, handleGoHome, loadDir])

  /**
   * Extract current drive letter from path
   */
  const currentDrive = currentPath ? currentPath.substring(0, 2) + '\\' : ''

  return (
    <Modal
      title="选择PDF文件"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={selectedFiles.size === 0}
          onClick={handleConfirm}
        >
          选择 {selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''}
        </Button>,
      ]}
    >
      {/* Drive selector */}
      {drives.length > 1 && (
        <div style={{
          marginBottom: 12,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}>
          {drives.map(drive => {
            const isActive = drive === currentDrive
            return (
              <Button
                key={drive}
                size="small"
                type={isActive ? 'primary' : 'default'}
                onClick={() => handleDriveClick(drive)}
                style={{ minWidth: 48 }}
              >
                {drive.replace('\\', '')}
              </Button>
            )
          })}
        </div>
      )}

      {/* Breadcrumb path */}
      <div style={{ marginBottom: 12 }}>
        {buildBreadcrumb()}
      </div>

      {/* Up button */}
      <div style={{ marginBottom: 8 }}>
        <Button
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={handleGoUp}
          disabled={!parentPath}
        >
          上一级
        </Button>
      </div>

      {/* File list */}
      <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
        <List
          size="small"
          loading={loading}
          dataSource={[
            ...dirs.map(d => ({ type: 'dir' as const, name: d, path: '', size: 0 })),
            ...files.map(f => ({ type: 'file' as const, name: f.name, path: f.path, size: f.size })),
          ]}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: item.type === 'file' && selectedFiles.has(item.path) ? '#e6f7ff' : 'transparent',
              }}
              onClick={() => {
                if (item.type === 'dir') handleDirClick(item.name)
                else handleFileClick(item.path)
              }}
              onDoubleClick={() => {
                if (item.type === 'file') handleFileDoubleClick(item.path)
              }}
            >
              <Space>
                {item.type === 'dir'
                  ? <FolderOutlined style={{ color: '#faad14', fontSize: 18 }} />
                  : <FilePdfOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                }
                <span>{item.name}</span>
                {item.type === 'file' && (
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatSize(item.size)}</Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  )
}

export default FileBrowser
