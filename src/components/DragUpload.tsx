import { useState, useCallback } from 'react'
import { Space, Typography, Button, message } from 'antd'
import { FilePdfOutlined, InboxOutlined, FolderOpenOutlined } from '@ant-design/icons'

const { Text } = Typography

/**
 * 拖拽上传组件属性
 */
interface DragUploadProps {
  /** 上传回调 */
  onFilesSelected: (files: string[]) => void
  /** 是否允许多选 */
  multiSelections?: boolean
  /** 提示文字 */
  hint?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 文件上传卡片组件
 * 支持拖拽文件和点击选择文件
 */
function DragUpload({ onFilesSelected, multiSelections = false, hint, disabled = false }: DragUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * 处理拖拽放置
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

    // 使用 Electron 的 webUtils 获取完整文件路径
    if (window.electronAPI?.getPathForFile) {
      try {
        const filePaths = pdfFiles.map(file => window.electronAPI.getPathForFile(file))
        onFilesSelected(filePaths)
      } catch (error) {
        // 如果 webUtils 失败，回退到对话框
        console.error('Failed to get file paths from drag:', error)
        handleClick()
      }
    } else {
      // 如果没有 getPathForFile，回退到对话框
      handleClick()
    }
  }, [onFilesSelected, disabled])

  /**
   * 点击选择文件
   */
  const handleClick = useCallback(async () => {
    if (disabled) return

    if (window.electronAPI) {
      const result = await window.electronAPI.openFile({ multiSelections })
      if (!result.canceled && result.filePaths.length > 0) {
        onFilesSelected(result.filePaths)
      }
    }
  }, [onFilesSelected, multiSelections, disabled])

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        border: disabled ? '2px dashed #d9d9d9' : (isDragging ? '2px solid #1677ff' : '2px dashed #d9d9d9'),
        background: disabled ? '#f5f5f5' : (isDragging ? '#e6f7ff' : '#fafafa'),
        borderRadius: 12,
        transition: 'all 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <InboxOutlined
          style={{
            fontSize: 56,
            color: disabled ? '#999' : (isDragging ? '#1677ff' : '#666'),
            transition: 'color 0.2s ease'
          }}
        />
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
            {isDragging ? '释放文件' : (disabled ? '处理中...' : '拖拽或点击选择PDF文件')}
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
          disabled={disabled}
          style={{ minWidth: 160 }}
        >
          点击选择文件
        </Button>
        <Space style={{ opacity: 0.7 }}>
          <FilePdfOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <Text type="secondary">支持 .pdf 格式文件</Text>
        </Space>
      </Space>
    </div>
  )
}

export default DragUpload