import { Progress, Typography, Space } from 'antd'

const { Text } = Typography

/**
 * 进度显示组件属性
 */
interface ProgressDisplayProps {
  /** 当前进度百分比 (0-100) */
  percent: number
  /** 进度状态文字 */
  statusText?: string
  /** 是否显示状态文字 */
  showStatus?: boolean
}

/**
 * 进度显示组件
 * 用于显示PDF处理进度
 */
function ProgressDisplay({
  percent,
  statusText = '处理中...',
  showStatus = true,
}: ProgressDisplayProps) {
  return (
    <div style={{
      background: '#fff',
      padding: 24,
      borderRadius: 8,
      textAlign: 'center'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Progress
          percent={percent}
          status={percent < 100 ? 'active' : 'success'}
          strokeColor={{
            '0%': '#1677ff',
            '100%': '#52c41a',
          }}
        />
        {showStatus && (
          <Text type="secondary">{statusText}</Text>
        )}
      </Space>
    </div>
  )
}

export default ProgressDisplay