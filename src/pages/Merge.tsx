import { useState, useEffect } from 'react'
import { Button, Card, message, Progress, Space, Typography, List } from 'antd'
import {
  MergeCellsOutlined,
  ArrowDownOutlined,
  DragOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import DragUpload from '../components/DragUpload'

const { Title, Text } = Typography

/**
 * PDF合并页面
 * 支持多个PDF文件合并为一个
 */
function Merge() {
  const [files, setFiles] = useState<string[]>([])
  const [fileInfos, setFileInfos] = useState<Array<{ name: string; size: number; path: string }>>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  /**
   * 处理选中的文件（来自DragUpload或按钮）
   */
  const handleFilesSelected = async (selectedFiles: string[]) => {
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)

    // 获取文件信息
    const infos = await Promise.all(
      selectedFiles.map(async (filePath) => {
        const info = await window.electronAPI!.getFileInfo(filePath)
        return info.success ? info.data : { name: filePath, size: 0, path: filePath }
      })
    )
    setFileInfos([...fileInfos, ...infos])

    // 自动设置输出路径为第一个文件所在目录
    if (files.length === 0 && selectedFiles.length > 0) {
      const firstPath = selectedFiles[0]
      const dir = firstPath.substring(0, firstPath.lastIndexOf('\\') || firstPath.lastIndexOf('/'))
      setOutputPath(dir + '\\merged.pdf')
    }
  }

  /**
   * 选择PDF文件（添加更多）
   */
  const handleSelectFiles = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile({ multiSelections: true })
      if (!result.canceled && result.filePaths.length > 0) {
        handleFilesSelected(result.filePaths)
      }
    } else {
      message.warning('请在Electron应用中使用此功能')
    }
  }

  /**
   * 删除文件
   */
  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newInfos = fileInfos.filter((_, i) => i !== index)
    setFiles(newFiles)
    setFileInfos(newInfos)
  }

  /**
   * 清空所有文件
   */
  const handleClearFiles = () => {
    setFiles([])
    setFileInfos([])
    setOutputPath('')
  }

  /**
   * 处理拖拽排序
   */
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      const newFiles = [...files]
      const newInfos = [...fileInfos]

      // 交换位置
      const draggedFile = newFiles[dragIndex]
      const draggedInfo = newInfos[dragIndex]

      newFiles.splice(dragIndex, 1)
      newInfos.splice(dragIndex, 1)
      newFiles.splice(index, 0, draggedFile)
      newInfos.splice(index, 0, draggedInfo)

      setFiles(newFiles)
      setFileInfos(newInfos)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  /**
   * 选择输出路径
   */
  const handleSelectOutput = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        defaultPath: 'merged.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理文件合并
   */
  const handleMerge = async () => {
    if (files.length < 2) {
      message.warning('请至少选择2个PDF文件进行合并')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出文件路径')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 调用合并服务
      const result = await window.electronAPI?.mergePDF(files, outputPath)

      if (result?.success) {
        message.success('合并成功！')
        setProgress(100)
      } else {
        message.error('合并失败：' + result?.error)
      }
    } catch (error) {
      message.error('合并失败：' + (error as Error).message)
    } finally {
      setLoading(false)
      window.electronAPI?.removeProgressListener()
    }
  }

  /**
   * 格式化文件大小
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  /**
   * 计算总大小
   */
  const totalSize = fileInfos.reduce((sum, f) => sum + f.size, 0)

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <MergeCellsOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF合并</Title>
          <Text type="secondary">将多个PDF文件合并为一个文件</Text>
        </div>

        {/* 操作提示 */}
        <Card size="small" style={{ background: '#e6f4ff' }}>
          <Space direction="vertical">
            <Text>
              <ArrowDownOutlined /> 操作步骤：
            </Text>
            <Text>1. 点击"选择文件"添加PDF文件</Text>
            <Text>2. 拖拽调整文件顺序</Text>
            <Text>3. 选择输出保存路径</Text>
            <Text>4. 点击"开始合并"按钮</Text>
          </Space>
        </Card>

        {/* 文件选择区域 */}
        {fileInfos.length === 0 ? (
          <DragUpload
            onFilesSelected={handleFilesSelected}
            multiSelections={true}
            hint="可同时选择多个文件进行合并"
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Button icon={<PlusOutlined />} onClick={handleSelectFiles}>
              添加更多文件
            </Button>
          </div>
        )}

        {/* 文件列表 */}
        {fileInfos.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <Text strong>已选择 {files.length} 个文件（可拖拽调整顺序）</Text>
              <Button size="small" danger onClick={handleClearFiles}>
                清空全部
              </Button>
            </div>

            <List
              dataSource={fileInfos}
              renderItem={(file, index) => (
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: dragIndex === index ? '#e6f4ff' : '#fff',
                    padding: '12px 16px',
                    borderRadius: 6,
                    marginBottom: 8,
                    border: '1px solid #f0f0f0',
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Space>
                    <DragOutlined style={{ color: '#999' }} />
                    <FilePdfOutlined style={{ color: '#1677ff' }} />
                    <Text>{file.name}</Text>
                    <Text type="secondary">{formatSize(file.size)}</Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFile(index)}
                  />
                </div>
              )}
            />

            {/* 输出路径选择 */}
            <div style={{ marginTop: 16 }}>
              <Space>
                <Text strong>输出路径：</Text>
                <Text type="secondary">{outputPath || '未选择'}</Text>
                <Button size="small" onClick={handleSelectOutput}>
                  选择保存位置
                </Button>
              </Space>
            </div>

            {/* 文件信息 */}
            <Card size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Text strong>文件信息：</Text>
                <Text>共 {files.length} 个文件</Text>
                <Text>总大小：{formatSize(totalSize)}</Text>
              </Space>
            </Card>
          </div>
        )}

        {/* 进度显示 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Progress percent={progress} status="active" />
            <Text type="secondary">正在合并文件...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<MergeCellsOutlined />}
              loading={loading}
              disabled={files.length < 2 || !outputPath}
              onClick={handleMerge}
            >
              开始合并
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Merge