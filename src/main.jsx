import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="wrap">
      <div className="card">
        <p className="eyebrow">GitHub Pages React Test</p>
        <h1>Hello World</h1>
        <p>OpenClaw가 GitHub에 업로드하고 배포한 React 테스트 페이지입니다.</p>
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
