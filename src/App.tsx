import { useState } from 'react'
import './App.css'
import { Route,  Routes,BrowserRouter as Router } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen'
import RoomScreen from './screens/RoomScreen'
import Login from './screens/Login'
import Signup from './screens/SignupScreen'
import socketIO from 'socket.io-client';
const socket = socketIO.connect('http://localhost:3000',{
  
});

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomeScreen socket={socket} />}  />
        <Route path='/login' element={<Login/>}  />
        <Route path='/signup' element={<Signup/>}  />
        <Route path='/room/:roomId' element={<RoomScreen socket={socket} />}  />
      </Routes>
    </Router>
  )
}

export default App
