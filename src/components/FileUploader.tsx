import { useState, useCallback } from 'react'
import { Upload, message, Button, List, Space } from 'antd'
import {
  InboxOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  DragOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'

const { Dragger } = Upload

/**
 * 文件上传组件属性
 */
interface FileUploaderProps {
  /** 是否支持多文件上传 */
  multiple?: boolean
  /** 文件类型限制 */
  accept?: string
  /** 上传提示文字 */
  hint?: string
  /** 文件列表变化回调 */
  onFilesChange?: (files: File[]) => void
  /** 最大文件数量 */
  maxCount?: number
}

/**
 * 文件上传组件
 * 支持拖拽上传、文件列表显示、删除和排序
 */
function FileUploader({
  multiple = false,
  accept = '.pdf',
  hint = '点击或拖拽PDF文件到此区域',
  onFilesChange,
  maxCount,
}: FileUploaderProps) {
  const [fileList, setFileList] = useState<File[]>([])

  /**
   * 处理文件上传
   */
  const handleUpload = useCallback((files: File[]) => {
    if (maxCount && files.length > maxCount) {
      message.warning(`最多只能上传 ${maxCount} 个文件`)
      files = files.slice(0, maxCount)
    }

    setFileList(files)
    onFilesChange?.(files)
  }, [maxCount, onFilesChange])

  /**
   * 删除文件
   * @param index 文件索引
   */
  const handleRemove = (index: number) => {
    const newFiles = fileList.filter((_, i) => i !== index)
    setFileList(newFiles)
    onFilesChange?.(newFiles)
  }

  /**
   * 清空所有文件
   */
  const handleClear = () => {
    setFileList([])
    onFilesChange?.([])
  }

  const draggerProps = {
    name: 'file',
    multiple,
    accept,
    showUploadList: false,
    beforeUpload: (file: UploadFile) => {
      // 检查文件类型
      if (!file.name.endsWith('.pdf')) {
        message.error('只能上传PDF文件！')
        return false
      }

      const newFiles = multiple
        ? [...fileList, file as unknown as File]
        : [file as unknown as File]

      handleUpload(newFiles)
      return false // 阻止自动上传
    },
    onDrop: (e: React.DragEvent) => {
      const files = Array.from(e.dataTransfer.files)
      handleUpload(multiple ? [...fileList, ...files] : files)
    },
  }

  return (
    <div>
      {/* 拖拽上传区域 */}
      <Dragger {...draggerProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        </p>
        <p className="ant-upload-text">{hint}</p>
        <p className="ant-upload-hint">
          支持 {multiple ? '多个' : '单个'} PDF文件上传
        </p>
      </Dragger>

      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <span>已选择 {fileList.length} 个文件</span>
            <Button size="small" danger onClick={handleClear}>
              清空全部
            </Button>
          </div>

          <List
            dataSource={fileList}
            renderItem={(file, index) => (
              <List.Item
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <Space>
                  <DragOutlined style={{ cursor: 'grab' }} />
                  <FilePdfOutlined style={{ color: '#1677ff' }} />
                  <span>{file.name}</span>
                  <span style={{ color: '#999' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(index)}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  )
}

export default FileUploader