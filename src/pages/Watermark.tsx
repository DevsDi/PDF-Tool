import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Radio, Switch, Input } from 'antd'
import {
  StopOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * 去水印方式类型
 */
type WatermarkMode = 'auto' | 'manual'

/**
 * PDF去水印页面
 * 去除PDF文件中的水印
 */
function Watermark() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>('auto')
  const [watermarkText, setWatermarkText] = useState('')
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
        defaultPath: fileInfo?.name?.replace('.pdf', '_no_watermark.pdf') || 'no_watermark.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理PDF去水印
   */
  const handleRemoveWatermark = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件进行去水印')
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

      // 准备去水印选项
      const options = {
        mode: watermarkMode,
        watermarkText: watermarkMode === 'auto' ? watermarkText : undefined,
      }

      // 调用去水印服务
      const result = await window.electronAPI?.removeWatermark(filePath, outputPath, options)

      if (result?.success) {
        message.success('去水印成功！')
        setProgress(100)
      } else {
        message.error('去水印失败：' + result?.error)
      }
    } catch (error) {
      message.error('去水印失败：' + (error as Error).message)
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
          <StopOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF去水印</Title>
          <Text type="secondary">去除PDF文件中的水印文字或图片</Text>
        </div>

        {/* 功能说明 */}
        <Card size="small" style={{ background: '#fff7e6' }}>
          <Space direction="vertical">
            <Text type="warning">注意：</Text>
            <Text>自动检测水印可能无法完美识别所有水印</Text>
            <Text>如自动检测效果不佳，可尝试手动选择水印区域</Text>
            <Text>水印文字功能需要输入水印的具体文本内容</Text>
          </Space>
        </Card>

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

        {/* 去水印方式选择 */}
        {fileInfo && (
          <Card title="选择去水印方式">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio.Group
                value={watermarkMode}
                onChange={(e) => setWatermarkMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="auto">自动检测</Radio.Button>
                <Radio.Button value="manual">手动选择</Radio.Button>
              </Radio.Group>

              {watermarkMode === 'auto' && (
                <div>
                  <Text>水印文字（可选，用于精确匹配）：</Text>
                  <Input
                    placeholder="输入水印文字内容"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}

              {watermarkMode === 'manual' && (
                <Text type="secondary">
                  手动模式需要在PDF预览中选择水印区域（开发中）
                </Text>
              )}
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
            <Text type="secondary">正在处理水印...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<StopOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath}
              onClick={handleRemoveWatermark}
            >
              开始去水印
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Watermark