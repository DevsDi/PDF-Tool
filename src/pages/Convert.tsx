import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Alert } from 'antd'
import {
  FileWordOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * PDF转Word页面
 * 将PDF文件转换为Word文档
 */
function Convert() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')

  /**
   * 选择PDF文件
   */
  const handleSelectFile = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile({ multiSelections: false })
      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0]
        setFilePath(path)

        // 获取文件信息
        const info = await window.electronAPI.getFileInfo(path)
        if (info.success) {
          setFileInfo(info.data)
        }

        // 清空输出
        setOutputPath('')
      }
    } else {
      message.warning('请在Electron应用中使用此功能')
    }
  }

  /**
   * 选择输出路径
   */
  const handleSelectOutput = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        defaultPath: fileInfo?.name?.replace('.pdf', '.docx') || 'converted.docx',
        filters: [{ name: 'Word文件', extensions: ['docx'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理PDF转Word
   */
  const handleConvert = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件进行转换')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 调用转换服务
      const result = await window.electronAPI?.convertPDF(filePath, outputPath)

      if (result?.success) {
        message.success('转换成功！')
        setProgress(100)
      } else {
        message.error('转换失败：' + result?.error)
      }
    } catch (error) {
      message.error('转换失败：' + (error as Error).message)
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

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <FileWordOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF转Word</Title>
          <Text type="secondary">将PDF文件转换为可编辑的Word文档</Text>
        </div>

        {/* 功能说明 */}
        <Alert
          type="info"
          showIcon
          message="转换说明"
          description="本功能使用pdf2docx库进行转换，会尽力保留原文档的格式、表格、图片等内容。转换效果取决于PDF的复杂程度。转换过程可能需要几分钟，请耐心等待。"
        />

        {/* 文件选择区域 */}
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" onClick={handleSelectFile}>
            选择PDF文件
          </Button>
        </div>

        {/* 文件信息 */}
        {fileInfo && (
          <Card size="small">
            <Space>
              <FilePdfOutlined style={{ color: '#1677ff', fontSize: 24 }} />
              <div>
                <Text strong>{fileInfo.name}</Text>
                <br />
                <Text type="secondary">大小：{formatSize(fileInfo.size)}</Text>
              </div>
              <Button
                type="text"
                onClick={() => {
                  setFilePath('')
                  setFileInfo(null)
                  setOutputPath('')
                }}
              >
                重新选择
              </Button>
            </Space>
          </Card>
        )}

        {/* 输出路径选择 */}
        {fileInfo && (
          <div>
            <Space>
              <Text strong>输出路径：</Text>
              <Text type="secondary">{outputPath || '未选择'}</Text>
              <Button size="small" onClick={handleSelectOutput}>
                选择保存位置
              </Button>
            </Space>
          </div>
        )}

        {/* 进度显示 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Progress percent={progress} status="active" />
            <Text type="secondary">正在转换文件，请耐心等待...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<FileWordOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath}
              onClick={handleConvert}
            >
              开始转换
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Convert