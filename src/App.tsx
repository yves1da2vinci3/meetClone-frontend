import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Route,  Routes,BrowserRouter as Router } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomeScreen/>}  />
      </Routes>
    </Router>
  )
}

export default App
