import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Story from './pages/Story'
import Atmosphere from './pages/Atmosphere'
import FirstVisit from './pages/FirstVisit'
import Access from './pages/Access'
import Review from './pages/Review'
import Faq from './pages/Faq'
import Contact from './pages/Contact'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/story" element={<Story />} />
        <Route path="/atmosphere" element={<Atmosphere />} />
        <Route path="/first-visit" element={<FirstVisit />} />
        <Route path="/access" element={<Access />} />
        <Route path="/review" element={<Review />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}

export default App
