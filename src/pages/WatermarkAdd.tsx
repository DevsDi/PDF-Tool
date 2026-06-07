import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Input, Slider, Select, InputNumber, ColorPicker } from 'antd'
import {
  HighlightOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import DragUpload from '../components/DragUpload'

const { Title, Text } = Typography

/**
 * 水印位置类型
 */
type WatermarkPosition = 'center' | 'diagonal' | 'tile' | 'bottom' | 'top'

/**
 * PDF加水印页面
 * 为PDF文件添加自定义水印
 */
function WatermarkAdd() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')

  // 水印选项
  const [watermarkText, setWatermarkText] = useState('内部资料')
  const [fontSize, setFontSize] = useState(40)
  const [opacity, setOpacity] = useState(0.3)
  const [rotation, setRotation] = useState(45)
  const [position, setPosition] = useState<WatermarkPosition>('diagonal')
  const [color, setColor] = useState<string>('#808080')

  /**
   * 处理选中的文件
   */
  const handleFilesSelected = async (selectedFiles: string[]) => {
    const path = selectedFiles[0]
    setFilePath(path)

    // 获取文件信息
    const info = await window.electronAPI!.getFileInfo(path)
    if (info.success) {
      setFileInfo(info.data)
      // 自动设置输出路径为源文件同目录
      const dir = path.substring(0, path.lastIndexOf('\\') || path.lastIndexOf('/'))
      const baseName = info.data.name.replace('.pdf', '')
      setOutputPath(dir + '\\' + baseName + '_watermarked.pdf')
    }
  }

  /**
   * 选择输出路径
   */
  const handleSelectOutput = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        defaultPath: fileInfo?.name?.replace('.pdf', '_watermarked.pdf') || 'watermarked.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理添加水印
   */
  const handleAddWatermark = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    if (!watermarkText.trim()) {
      message.warning('请输入水印文字')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 准备水印选项
      const options = {
        text: watermarkText,
        fontSize,
        opacity,
        rotation: position === 'diagonal' ? rotation : 0,
        position,
        color,
      }

      // 调用加水印服务
      const result = await window.electronAPI?.addWatermark(filePath, outputPath, options)

      if (result?.success) {
        message.success('添加水印成功！')
        setProgress(100)
      } else {
        message.error('添加水印失败：' + result?.error)
      }
    } catch (error) {
      message.error('添加水印失败：' + (error as Error).message)
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
   * 位置选项
   */
  const positionOptions = [
    { value: 'diagonal', label: '斜向平铺（推荐）' },
    { value: 'tile', label: '平铺水印' },
    { value: 'center', label: '居中单个' },
    { value: 'top', label: '顶部水印' },
    { value: 'bottom', label: '底部水印' },
  ]

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <HighlightOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF加水印</Title>
          <Text type="secondary">为PDF文件添加自定义水印，保护文档版权</Text>
        </div>

        {/* 文件选择区域 */}
        {!fileInfo ? (
          <DragUpload
            onFilesSelected={handleFilesSelected}
            multiSelections={false}
          />
        ) : null}

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

        {/* 水印设置 */}
        {fileInfo && (
          <Card title="水印设置">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 水印文字 */}
              <div>
                <Text strong>水印文字：</Text>
                <Input
                  placeholder="输入水印文字内容"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* 水印位置 */}
              <div>
                <Text strong>水印位置：</Text>
                <Select
                  value={position}
                  onChange={setPosition}
                  options={positionOptions}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>

              {/* 字体大小 */}
              <div>
                <Text strong>字体大小：{fontSize}px</Text>
                <Slider
                  value={fontSize}
                  onChange={setFontSize}
                  min={20}
                  max={100}
                  marks={{ 20: '小', 40: '中', 60: '大', 100: '特大' }}
                />
              </div>

              {/* 透明度 */}
              <div>
                <Text strong>透明度：{Math.round(opacity * 100)}%</Text>
                <Slider
                  value={opacity}
                  onChange={setOpacity}
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  marks={{ 0.1: '淡', 0.3: '中', 0.5: '深', 0.9: '很深' }}
                />
              </div>

              {/* 旋转角度（斜向平铺时有效） */}
              {position === 'diagonal' && (
                <div>
                  <Text strong>旋转角度：{rotation}°</Text>
                  <Slider
                    value={rotation}
                    onChange={setRotation}
                    min={-90}
                    max={90}
                    marks={{ '-45': '-45°', 0: '0°', 45: '45°' }}
                  />
                </div>
              )}

              {/* 水印颜色 */}
              <div>
                <Text strong>水印颜色：</Text>
                <div style={{ marginTop: 8 }}>
                  <ColorPicker
                    value={color}
                    onChange={(c) => setColor(c.toHexString())}
                    showText
                  />
                </div>
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
            <Text type="secondary">正在添加水印...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<HighlightOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath || !watermarkText.trim()}
              onClick={handleAddWatermark}
            >
              添加水印
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default WatermarkAdd