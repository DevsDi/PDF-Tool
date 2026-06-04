import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Layout as AntLayout, Typography } from 'antd'
import {
  MergeCellsOutlined,
  ScissorOutlined,
  FileWordOutlined,
  CompressOutlined,
  StopOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Sider, Content, Header } = AntLayout
const { Title } = Typography

/**
 * 侧边栏菜单项配置
 */
const menuItems: MenuProps['items'] = [
  {
    key: '/merge',
    icon: <MergeCellsOutlined />,
    label: 'PDF合并',
  },
  {
    key: '/split',
    icon: <ScissorOutlined />,
    label: 'PDF拆分',
  },
  {
    key: '/convert',
    icon: <FileWordOutlined />,
    label: '转Word',
  },
  {
    key: '/compress',
    icon: <CompressOutlined />,
    label: 'PDF压缩',
  },
  {
    key: '/watermark',
    icon: <StopOutlined />,
    label: '去水印',
  },
  {
    key: '/encrypt',
    icon: <LockOutlined />,
    label: 'PDF加密',
  },
  {
    key: '/decrypt',
    icon: <UnlockOutlined />,
    label: 'PDF解密',
  },
]

/**
 * 主布局组件
 * 包含侧边栏导航和内容区域
 */
interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * 处理菜单点击事件
   */
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 顶部标题栏 */}
      <Header style={{
        background: '#1677ff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          PDF全能箱
        </Title>
      </Header>

      <AntLayout>
        {/* 侧边栏导航 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </Sider>

        {/* 内容区域 */}
        <Content style={{
          padding: '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout