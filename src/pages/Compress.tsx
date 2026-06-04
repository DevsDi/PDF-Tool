import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Radio, Slider } from 'antd'
import {
  CompressOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * 压缩级别类型
 */
type CompressLevel = 'low' | 'medium' | 'high'

/**
 * PDF压缩页面
 * 压缩PDF文件大小
 */
function Compress() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [compressLevel, setCompressLevel] = useState<CompressLevel>('medium')
  const [quality, setQuality] = useState(70)
  const [outputPath, setOutputPath] = useState('')
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number; ratio: number } | null>(null)

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

        // 清空输出和结果
        setOutputPath('')
        setResult(null)
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
        defaultPath: fileInfo?.name?.replace('.pdf', '_compressed.pdf') || 'compressed.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 压缩级别变化时更新质量值
   */
  const handleLevelChange = (level: CompressLevel) => {
    setCompressLevel(level)
    if (level === 'low') setQuality(90)
    else if (level === 'medium') setQuality(70)
    else setQuality(50)
  }

  /**
   * 处理PDF压缩
   */
  const handleCompress = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件进行压缩')
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

      // 调用压缩服务
      const response = await window.electronAPI?.compressPDF(filePath, outputPath, quality)

      if (response?.success) {
        message.success('压缩成功！')
        setProgress(100)
        if (response.data) {
          setResult(response.data)
        }
      } else {
        message.error('压缩失败：' + response?.error)
      }
    } catch (error) {
      message.error('压缩失败：' + (error as Error).message)
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
   * 压缩级别标签
   */
  const levelLabels: Record<CompressLevel, string> = {
    low: '低压缩（高质量，文件较大）',
    medium: '中压缩（推荐，平衡质量和大小）',
    high: '高压缩（低质量，文件最小）',
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <CompressOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF压缩</Title>
          <Text type="secondary">减小PDF文件大小，便于分享和存储</Text>
        </div>

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
                <Text type="secondary">原始大小：{formatSize(fileInfo.size)}</Text>
              </div>
              <Button
                type="text"
                onClick={() => {
                  setFilePath('')
                  setFileInfo(null)
                  setOutputPath('')
                  setResult(null)
                }}
              >
                重新选择
              </Button>
            </Space>
          </Card>
        )}

        {/* 压缩级别选择 */}
        {fileInfo && (
          <Card title="选择压缩级别">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio.Group
                value={compressLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="low">低压缩</Radio.Button>
                <Radio.Button value="medium">中压缩</Radio.Button>
                <Radio.Button value="high">高压缩</Radio.Button>
              </Radio.Group>

              <Text type="secondary">{levelLabels[compressLevel]}</Text>

              {/* 质量滑块 */}
              <div style={{ marginTop: 8 }}>
                <Text>图片质量：{quality}%</Text>
                <Slider
                  value={quality}
                  onChange={setQuality}
                  min={10}
                  max={100}
                  marks={{ 10: '低', 50: '中', 100: '高' }}
                />
              </div>
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
            <Text type="secondary">正在压缩文件...</Text>
          </div>
        )}

        {/* 压缩结果 */}
        {result && (
          <Card size="small" style={{ background: '#f6ffed' }}>
            <Space direction="vertical">
              <Text strong style={{ color: '#52c41a' }}>压缩完成！</Text>
              <Text>原始大小：{formatSize(result.originalSize)}</Text>
              <Text>压缩后大小：{formatSize(result.compressedSize)}</Text>
              <Text type="success" strong>
                减少：{(1 - result.ratio).toFixed(1) * 100}%
              </Text>
            </Space>
          </Card>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<CompressOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath}
              onClick={handleCompress}
            >
              开始压缩
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Compress