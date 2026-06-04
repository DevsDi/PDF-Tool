import { useState } from 'react'
import { Button, Card, message, Progress, Space, Typography, Input, Checkbox } from 'antd'
import {
  LockOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * PDF加密页面
 * 为PDF文件添加密码保护
 */
function Encrypt() {
  const [filePath, setFilePath] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [openPassword, setOpenPassword] = useState('')
  const [permissionPassword, setPermissionPassword] = useState('')
  const [permissions, setPermissions] = useState({
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
  })
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
        defaultPath: fileInfo?.name?.replace('.pdf', '_encrypted.pdf') || 'encrypted.pdf',
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }]
      })
      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath)
      }
    }
  }

  /**
   * 处理PDF加密
   */
  const handleEncrypt = async () => {
    if (!filePath) {
      message.warning('请选择一个PDF文件进行加密')
      return
    }

    if (!outputPath) {
      message.warning('请选择输出保存路径')
      return
    }

    if (!openPassword) {
      message.warning('请设置打开密码')
      return
    }

    if (openPassword.length < 4) {
      message.warning('密码长度至少为4位')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 监听进度更新
      window.electronAPI?.onProgress((p) => setProgress(p))

      // 调用加密服务
      const result = await window.electronAPI?.encryptPDF(
        filePath,
        outputPath,
        openPassword,
        permissions
      )

      if (result?.success) {
        message.success('加密成功！')
        setProgress(100)
      } else {
        message.error('加密失败：' + result?.error)
      }
    } catch (error) {
      message.error('加密失败：' + (error as Error).message)
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
          <LockOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16 }}>PDF加密</Title>
          <Text type="secondary">为PDF文件添加密码保护，防止未经授权访问</Text>
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

        {/* 密码设置 */}
        {fileInfo && (
          <Card title="设置密码">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 打开密码 */}
              <div>
                <Text strong>打开密码（必填）：</Text>
                <Input.Password
                  placeholder="输入打开PDF所需的密码"
                  value={openPassword}
                  onChange={(e) => setOpenPassword(e.target.value)}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  打开PDF文件时需要输入此密码
                </Text>
              </div>

              {/* 权限密码 */}
              <div>
                <Text strong>权限密码（可选）：</Text>
                <Input.Password
                  placeholder="输入修改权限所需的密码"
                  value={permissionPassword}
                  onChange={(e) => setPermissionPassword(e.target.value)}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  修改PDF权限设置时需要输入此密码
                </Text>
              </div>

              {/* 权限设置 */}
              <div>
                <Text strong>权限设置：</Text>
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical">
                    <Checkbox
                      checked={permissions.allowPrinting}
                      onChange={(e) => setPermissions({
                        ...permissions,
                        allowPrinting: e.target.checked
                      })}
                    >
                      允许打印
                    </Checkbox>
                    <Checkbox
                      checked={permissions.allowCopying}
                      onChange={(e) => setPermissions({
                        ...permissions,
                        allowCopying: e.target.checked
                      })}
                    >
                      允许复制文本
                    </Checkbox>
                    <Checkbox
                      checked={permissions.allowModifying}
                      onChange={(e) => setPermissions({
                        ...permissions,
                        allowModifying: e.target.checked
                      })}
                    >
                      允许修改内容
                    </Checkbox>
                  </Space>
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
            <Text type="secondary">正在加密文件...</Text>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<LockOutlined />}
              loading={loading}
              disabled={!fileInfo || !outputPath || !openPassword}
              onClick={handleEncrypt}
            >
              开始加密
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default Encrypt