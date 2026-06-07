import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Merge from './pages/Merge'
import Split from './pages/Split'
import Convert from './pages/Convert'
import Compress from './pages/Compress'
import WatermarkAdd from './pages/WatermarkAdd'
import PageReorder from './pages/PageReorder'

/**
 * 主应用组件
 * 配置路由和页面布局
 */
function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* 默认跳转到合并页面 */}
          <Route path="/" element={<Navigate to="/merge" replace />} />
          {/* PDF合并 */}
          <Route path="/merge" element={<Merge />} />
          {/* PDF拆分 */}
          <Route path="/split" element={<Split />} />
          {/* PDF转换 */}
          <Route path="/convert" element={<Convert />} />
          {/* PDF压缩 */}
          <Route path="/compress" element={<Compress />} />
          {/* PDF加水印 */}
          <Route path="/watermark-add" element={<WatermarkAdd />} />
          {/* 页面排序 */}
          <Route path="/reorder" element={<PageReorder />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App