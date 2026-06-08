import { useState, useCallback } from 'react'
import { Space, Typography, Button, message, Spin } from 'antd'
import { FilePdfOutlined, InboxOutlined, FolderOpenOutlined } from '@ant-design/icons'
import FileBrowser from './FileBrowser'

const { Text } = Typography

/**
 * DragUpload props
 */
interface DragUploadProps {
  /** Upload callback */
  onFilesSelected: (files: string[]) => void
  /** Allow multi-select */
  multiSelections?: boolean
  /** Hint text */
  hint?: string
  /** Disabled state */
  disabled?: boolean
}

/**
 * File upload component
 * Supports drag-drop (instant) and in-app file browser (no Windows Shell delay)
 */
function DragUpload({ onFilesSelected, multiSelections = false, hint, disabled = false }: DragUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [browserVisible, setBrowserVisible] = useState(false)

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * Handle drop
   */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'))

    if (pdfFiles.length === 0) {
      message.warning('请拖拽PDF文件')
      return
    }

    try {
      // Method 1: File.path property (available in Electron renderer, works in Electron 28)
      // Method 2: Fallback to file browser
      let filePaths: string[] = []

      if ((pdfFiles[0] as any).path) {
        filePaths = pdfFiles.map(file => (file as any).path).filter(Boolean)
      }

      if (filePaths.length > 0) {
        onFilesSelected(filePaths)
      } else {
        message.info('请使用"点击选择文件"按钮浏览文件')
        setBrowserVisible(true)
      }
    } catch (error) {
      console.error('Failed to get file paths from drag:', error)
      message.info('请使用"点击选择文件"按钮浏览文件')
      setBrowserVisible(true)
    }
  }, [onFilesSelected, disabled])

  /**
   * Handle file browser selection
   */
  const handleBrowserSelect = useCallback((filePaths: string[]) => {
    onFilesSelected(filePaths)
  }, [onFilesSelected])

  return (
    <>
      <div
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          border: disabled || loading ? '2px dashed #d9d9d9' : (isDragging ? '2px solid #1677ff' : '2px dashed #d9d9d9'),
          background: disabled || loading ? '#f5f5f5' : (isDragging ? '#e6f7ff' : '#fafafa'),
          borderRadius: 12,
          transition: 'all 0.2s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {loading ? <Spin size="large" /> : <InboxOutlined
            style={{
              fontSize: 56,
              color: disabled ? '#999' : (isDragging ? '#1677ff' : '#666'),
              transition: 'color 0.2s ease'
            }}
          />}
          <div>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: disabled ? '#999' : (isDragging ? '#1677ff' : '#333'),
                display: 'block',
                marginBottom: 8
              }}
            >
              {loading ? '正在处理...' : (isDragging ? '释放文件' : (disabled ? '处理中...' : '拖拽或点击选择PDF文件'))}
            </Text>
            {hint && (
              <Text type="secondary" style={{ fontSize: 14 }}>
                {hint}
              </Text>
            )}
          </div>
          <Button
            type="primary"
            size="large"
            icon={<FolderOpenOutlined />}
            disabled={disabled || loading}
            style={{ minWidth: 160 }}
            onClick={(e) => {
              e.stopPropagation()
              setBrowserVisible(true)
            }}
          >
            点击选择文件
          </Button>
          <Space style={{ opacity: 0.7 }}>
            <FilePdfOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <Text type="secondary">支持 .pdf 格式文件</Text>
          </Space>
        </Space>
      </div>

      <FileBrowser
        visible={browserVisible}
        onClose={() => setBrowserVisible(false)}
        onSelect={handleBrowserSelect}
        multiSelections={multiSelections}
      />
    </>
  )
}

export default DragUpload
