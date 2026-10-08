import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { useState } from 'react';
import { Outlet } from 'react-router';

import { Banners } from './Banners';
import { Header } from './Header';
import { DRAWER_WIDTH, Sidebar } from './Sidebar';

/** Signed-in shell: sidebar, header, banners, page content. */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onMenu={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, p: { xs: 2, sm: 3 } }}
      >
        <Toolbar />
        <Banners />
        <Outlet />
      </Box>
    </Box>
  );
}
