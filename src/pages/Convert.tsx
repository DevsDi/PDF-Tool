import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Alert, Radio } from 'antd'
import {
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import DragUpload from '../components/DragUpload'

const { Title, Text } = Typography

/**
 * 转换格式类型
 */
type ConvertFormat = 'word' | 'excel'

/**
 * PDF转换页面
 * 支持转换为Word、Excel、PPT
 */
function Convert() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')
  const [format, setFormat] = useState<ConvertFormat>('word')

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
      // 自动设置输出路径
      updateOutputPath(path, info.data.name, format)
    }
  }

  /**
   * 更新输出路径
   */
  const updateOutputPath = (path: string, name: string, targetFormat: ConvertFormat) => {
    const dir = path.substring(0, path.lastIndexOf('\\') || path.lastIndexOf('/'))
    const baseName = name.replace('.pdf', '')
    const ext = targetFormat === 'word' ? '.docx' : '.xlsx'
    setOutputPath(dir + '\\' + baseName + ext)
  }

  /**
   * 格式变化时更新输出路径
   */
  const handleFormatChange = (newFormat: ConvertFormat) => {
    setFormat(newFormat)
    if (fileInfo) {
      updateOutputPath(filePath, fileInfo.name, newFormat)
    }
  }

  /**
   * 选择输出路径
   */
  const handleSelectOutput = async () => {
    const ext = format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : 'pptx'
    const filterName = format === 'word' ? 'Word文件' : format === 'excel' ? 'Excel文件' : 'PPT文件'

    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        defaultPath: fileInfo?.name?.replace('.pdf', '.' + ext) || 'converted.' + ext,
        filters: [{ name: filterName, extensions: [ext] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理转换
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

      let result

      if (format === 'word') {
        result = await window.electronAPI?.convertPDF(filePath, outputPath)
      } else if (format === 'excel') {
        result = await window.electronAPI?.convertToExcel(filePath, outputPath)
      }

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

  /**
   * 格式选项
   */
  const formatOptions = [
    { value: 'word', label: 'Word (.docx)', icon: <FileWordOutlined /> },
    { value: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
  ]

  /**
   * 格式说明
   */
  const formatDescriptions: Record<ConvertFormat, string> = {
    word: '转换为可编辑的Word文档，保留原文档的格式、表格、图片等',
    excel: '提取PDF中的表格数据并转换为Excel表格',
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <FileWordOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF转换</Title>
          <Text type="secondary">将PDF文件转换为Word、Excel、PPT格式</Text>
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
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <FilePdfOutlined style={{ color: '#1677ff', fontSize: 24 }} />
                <div>
                  <Text strong>{fileInfo.name}</Text>
                  <br />
                  <Text type="secondary">大小：{formatSize(fileInfo.size)}</Text>
                </div>
              </Space>
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

        {/* 格式选择 */}
        {fileInfo && (
          <Card title="选择转换格式">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio.Group
                value={format}
                onChange={(e) => handleFormatChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="large"
              >
                {formatOptions.map(opt => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    <Space>
                      {opt.icon}
                      {opt.label}
                    </Space>
                  </Radio.Button>
                ))}
              </Radio.Group>

              <Alert
                type="info"
                showIcon
                message={formatDescriptions[format]}
              />
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
              icon={format === 'word' ? <FileWordOutlined /> : <FileExcelOutlined />}
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