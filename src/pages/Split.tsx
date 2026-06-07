import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Radio, InputNumber, List } from 'antd'
import {
  ScissorOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import DragUpload from '../components/DragUpload'

const { Title, Text } = Typography

/**
 * 拆分方式类型
 */
type SplitMode = 'pageCount' | 'range' | 'extract'

/**
 * PDF拆分页面
 * 支持按页数、按范围、提取指定页面拆分PDF
 */
function Split() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string; pageCount?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [splitMode, setSplitMode] = useState<SplitMode>('pageCount')
  const [pageCount, setPageCount] = useState(5)
  const [pageRange, setPageRange] = useState('1-5, 6-10')
  const [extractPages, setExtractPages] = useState('1, 3, 5-7')
  const [outputFiles, setOutputFiles] = useState<string[]>([])
  const [outputPath, setOutputPath] = useState('')

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
    }

    // 自动设置输出路径为源文件同目录
    const dir = path.substring(0, path.lastIndexOf('\\') || path.lastIndexOf('/'))
    setOutputPath(dir)

    // 清空之前的输出
    setOutputFiles([])
  }

  // 注意：setOutputPath 在上面使用但没有在 state 中定义，需要添加

  /**
   * 处理文件拆分
   */
  const handleSplit = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件进行拆分')
      return
    }

    setLoading(true)
    setProgress(0)
    setOutputFiles([])

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 准备拆分选项
      const options = {
        mode: splitMode,
        pageCount: splitMode === 'pageCount' ? pageCount : undefined,
        ranges: splitMode === 'range' ? pageRange : undefined,
        pages: splitMode === 'extract' ? parsePages(extractPages) : undefined,
      }

      // 调用拆分服务
      const result = await window.electronAPI?.splitPDF(filePath, options)

      if (result?.success) {
        message.success('拆分成功！')
        setProgress(100)
        if (Array.isArray(result.data)) {
          setOutputFiles(result.data)
        }
      } else {
        message.error('拆分失败：' + result?.error)
      }
    } catch (error) {
      message.error('拆分失败：' + (error as Error).message)
    } finally {
      setLoading(false)
      window.electronAPI?.removeProgressListener()
    }
  }

  /**
   * 解析页码字符串
   */
  const parsePages = (str: string): number[] => {
    const pages: number[] = []
    const parts = str.split(',').map(s => s.trim())

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
      } else {
        pages.push(Number(part))
      }
    }

    return pages.filter(p => p > 0)
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
          <ScissorOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF拆分</Title>
          <Text type="secondary">将一个PDF文件拆分为多个文件</Text>
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
                <Text type="secondary">
                  大小：{formatSize(fileInfo.size)}
                  {fileInfo.pageCount && ` | 页数：${fileInfo.pageCount}页`}
                </Text>
              </div>
              <Button
                type="text"
                onClick={() => {
                  setFilePath('')
                  setFileInfo(null)
                  setOutputFiles([])
                }}
              >
                重新选择
              </Button>
            </Space>
          </Card>
        )}

        {/* 拆分方式选择 */}
        {fileInfo && (
          <Card title="选择拆分方式">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio.Group
                value={splitMode}
                onChange={(e) => setSplitMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="pageCount">按页数拆分</Radio.Button>
                <Radio.Button value="range">按范围拆分</Radio.Button>
                <Radio.Button value="extract">提取指定页面</Radio.Button>
              </Radio.Group>

              {/* 按页数拆分 */}
              {splitMode === 'pageCount' && (
                <div>
                  <Space>
                    <Text>每</Text>
                    <InputNumber
                      min={1}
                      max={100}
                      value={pageCount}
                      onChange={(v) => setPageCount(v || 5)}
                    />
                    <Text>页为一个文件</Text>
                  </Space>
                  <br />
                  <Text type="secondary" style={{ marginTop: 8 }}>
                    例如：一个20页的PDF，按每5页拆分，将生成4个文件
                  </Text>
                </div>
              )}

              {/* 按范围拆分 */}
              {splitMode === 'range' && (
                <div>
                  <Text>页面范围（多个范围用逗号分隔）：</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    value={pageRange}
                    onChange={(v) => setPageRange(String(v))}
                  />
                  <Text type="secondary" style={{ marginTop: 8 }}>
                    例如：1-5, 6-10, 11-15 将生成3个文件
                  </Text>
                </div>
              )}

              {/* 提取指定页面 */}
              {splitMode === 'extract' && (
                <div>
                  <Text>提取页码（用逗号分隔，支持范围）：</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    value={extractPages}
                    onChange={(v) => setExtractPages(String(v))}
                  />
                  <Text type="secondary" style={{ marginTop: 8 }}>
                    例如：1, 3, 5-7 将提取第1、3、5、6、7页为一个新PDF
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* 进度显示 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Progress percent={progress} status="active" />
            <Text type="secondary">正在拆分文件...</Text>
          </div>
        )}

        {/* 拆分结果 */}
        {outputFiles.length > 0 && (
          <Card title="拆分结果" style={{ background: '#f6ffed' }}>
            <List
              dataSource={outputFiles}
              renderItem={(file, index) => (
                <List.Item>
                  <Space>
                    <FilePdfOutlined style={{ color: '#52c41a' }} />
                    <Text>文件 {index + 1}：{file.split('/').pop() || file.split('\\').pop()}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<ScissorOutlined />}
              loading={loading}
              disabled={!fileInfo}
              onClick={handleSplit}
            >
              开始拆分
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Split