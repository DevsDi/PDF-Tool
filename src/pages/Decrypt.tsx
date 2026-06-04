import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Input } from 'antd'
import {
  UnlockOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * PDF解密页面
 * 移除PDF文件的密码保护
 */
function Decrypt() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [password, setPassword] = useState('')
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
        defaultPath: fileInfo?.name?.replace('.pdf', '_decrypted.pdf') || 'decrypted.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理PDF解密
   */
  const handleDecrypt = async () => {
    if (!filePath) {
      message.warning('请选择一个加密的PDF文件进行解密')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    if (!password) {
      message.warning('请输入密码')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 调用解密服务
      const result = await window.electronAPI?.decryptPDF(filePath, outputPath, password)

      if (result?.success) {
        message.success('解密成功！')
        setProgress(100)
      } else {
        // 检查是否是密码错误
        if (result?.error?.includes('password')) {
          message.error('密码错误，请检查后重试')
        } else {
          message.error('解密失败：' + result?.error)
        }
      }
    } catch (error) {
      message.error('解密失败：' + (error as Error).message)
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
          <UnlockOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF解密</Title>
          <Text type="secondary">移除PDF文件的密码保护</Text>
        </div>

        {/* 功能说明 */}
        <Card size="small" style={{ background: '#fff7e6' }}>
          <Space direction="vertical">
            <Text type="warning">注意：</Text>
            <Text>解密需要提供正确的密码</Text>
            <Text>如果文件未加密，则无需使用此功能</Text>
            <Text>解密后的文件将不再需要密码打开</Text>
          </Space>
        </Card>

        {/* 文件选择区域 */}
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" onClick={handleSelectFile}>
            选择加密PDF文件
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

        {/* 密码输入 */}
        {fileInfo && (
          <Card title="输入密码">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>PDF打开密码：</Text>
                <Input.Password
                  placeholder="输入PDF打开密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ marginTop: 8 }}
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
            <Text type="secondary">正在解密文件...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<UnlockOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath || !password}
              onClick={handleDecrypt}
            >
              开始解密
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Decrypt