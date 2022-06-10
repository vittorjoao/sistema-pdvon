import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/home';
import Stock from '../pages/stock';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/inicio" element={<Home />} />
      <Route path="/estoque" element={<Stock />} />
      <Route path="*" element={<Navigate to="/inicio" />} />
    </Routes>
  );
}
