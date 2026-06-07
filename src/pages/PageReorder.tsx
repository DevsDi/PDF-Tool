import { useState, useEffect } from 'react'
import { Button, Card, message, Progress, Space, Typography, List, InputNumber, Checkbox } from 'antd'
import {
  OrderedListOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import DragUpload from '../components/DragUpload'

const { Title, Text } = Typography

/**
 * PDF页面排序页面
 * 支持页面重新排序、删除等操作
 */
function PageReorder() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [pageOrder, setPageOrder] = useState<number[]>([])

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

      // 获取页数
      const pageCountResult = await window.electronAPI!.getPageCount(path)
      if (pageCountResult.success) {
        const count = pageCountResult.data as number
        setPageCount(count)
        // 初始化页面顺序和选中状态
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1))
        setSelectedPages(Array.from({ length: count }, (_, i) => i + 1))
      }

      // 自动设置输出路径
      const dir = path.substring(0, path.lastIndexOf('\\') || path.lastIndexOf('/'))
      const baseName = info.data.name.replace('.pdf', '')
      setOutputPath(dir + '\\' + baseName + '_reordered.pdf')
    }
  }

  /**
   * 选择输出路径
   */
  const handleSelectOutput = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        defaultPath: fileInfo?.name?.replace('.pdf', '_reordered.pdf') || 'reordered.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理页面排序
   */
  const handleReorder = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    if (selectedPages.length === 0) {
      message.warning('请至少选择一个页面')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 按选中顺序导出
      const result = await window.electronAPI?.reorderPages(filePath, outputPath, selectedPages)

      if (result?.success) {
        message.success('页面排序成功！')
        setProgress(100)
      } else {
        message.error('处理失败：' + result?.error)
      }
    } catch (error) {
      message.error('处理失败：' + (error as Error).message)
    } finally {
      setLoading(false)
      window.electronAPI?.removeProgressListener()
    }
  }

  /**
   * 删除选中的页面
   */
  const handleDeletePages = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    // 计算要删除的页面（未被选中的）
    const pagesToDelete = pageOrder.filter(p => !selectedPages.includes(p))
    if (pagesToDelete.length === 0) {
      message.warning('没有页面被删除')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      window.electronAPI?.onProgress((p) => setProgress(p))

      const result = await window.electronAPI?.deletePages(filePath, outputPath, pagesToDelete)

      if (result?.success) {
        message.success(`已删除 ${pagesToDelete.length} 个页面！`)
        setProgress(100)

        // 更新状态
        const newOrder = pageOrder.filter(p => selectedPages.includes(p))
        setPageOrder(newOrder)
        setSelectedPages(newOrder)
        setPageCount(newOrder.length)
      } else {
        message.error('删除失败：' + result?.error)
      }
    } catch (error) {
      message.error('删除失败：' + (error as Error).message)
    } finally {
      setLoading(false)
      window.electronAPI?.removeProgressListener()
    }
  }

  /**
   * 移动页面位置
   */
  const movePage = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...selectedPages]
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    }
    setSelectedPages(newOrder)
  }

  /**
   * 全选/取消全选
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages([...pageOrder])
    } else {
      setSelectedPages([])
    }
  }

  /**
   * 切换页面选中状态
   */
  const togglePage = (pageNum: number) => {
    if (selectedPages.includes(pageNum)) {
      setSelectedPages(selectedPages.filter(p => p !== pageNum))
    } else {
      // 添加到末尾
      setSelectedPages([...selectedPages, pageNum])
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
          <OrderedListOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>页面排序</Title>
          <Text type="secondary">调整PDF页面顺序或删除不需要的页面</Text>
        </div>

        {/* 文件选择区域 */}
        {!fileInfo ? (
          <DragUpload
            onFilesSelected={handleFilesSelected}
            multiSelections={false}
            hint="选择PDF文件后可以调整页面顺序"
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
                  <Text type="secondary">共 {pageCount} 页 | 大小：{formatSize(fileInfo.size)}</Text>
                </div>
              </Space>
              <Button
                type="text"
                onClick={() => {
                  setFilePath('')
                  setFileInfo(null)
                  setOutputPath('')
                  setPageCount(0)
                  setPageOrder([])
                  setSelectedPages([])
                }}
              >
                重新选择
              </Button>
            </Space>
          </Card>
        )}

        {/* 页面列表 */}
        {fileInfo && pageCount > 0 && (
          <Card title="页面列表（拖拽调整顺序）">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 全选控制 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox
                  checked={selectedPages.length === pageOrder.length}
                  indeterminate={selectedPages.length > 0 && selectedPages.length < pageOrder.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  全选 ({selectedPages.length}/{pageOrder.length} 页)
                </Checkbox>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={selectedPages.length === pageOrder.length}
                  onClick={handleDeletePages}
                >
                  删除未选中页面
                </Button>
              </div>

              {/* 页面列表 */}
              <List
                dataSource={selectedPages}
                renderItem={(pageNum, index) => (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 6,
                      marginBottom: 8,
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fff'
                    }}
                  >
                    <Space>
                      <Checkbox
                        checked={true}
                        onChange={() => togglePage(pageNum)}
                      />
                      <FilePdfOutlined style={{ color: '#1677ff' }} />
                      <Text strong>第 {pageNum} 页</Text>
                      <Text type="secondary">（顺序：{index + 1}）</Text>
                    </Space>
                    <Space>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => movePage(index, 'up')}
                      />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === selectedPages.length - 1}
                        onClick={() => movePage(index, 'down')}
                      />
                    </Space>
                  </div>
                )}
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
            <Text type="secondary">正在处理文件...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<OrderedListOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath || selectedPages.length === 0}
              onClick={handleReorder}
            >
              保存排序结果
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default PageReorder