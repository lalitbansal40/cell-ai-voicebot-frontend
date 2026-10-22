import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { NavLink, useLocation } from 'react-router';

import { useCan, useIsPlatformAdmin } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { useInboxSummary } from '@/features/inbox/summary';

import { visibleNavItems, type NavItem } from './nav-config';

export const DRAWER_WIDTH = 240;

const isActive = (item: NavItem, pathname: string) =>
  item.path === '/'
    ? pathname === '/'
    : pathname.startsWith(item.path.replace(/\/[^/]+$/, '') || item.path);

interface NavEntryProps {
  item: NavItem;
  selected: boolean;
  onNavigate?: (() => void) | undefined;
  /** Count badge on the icon (hidden at 0, "99+" above 99). */
  count?: number;
}

function NavEntry({ item, selected, onNavigate, count }: NavEntryProps) {
  return (
    <ListItemButton
      component={NavLink}
      to={item.path}
      selected={selected}
      onClick={onNavigate}
      aria-label={count ? `${item.label}, ${String(count)} unread` : undefined}
    >
      <ListItemIcon>
        {count === undefined ? (
          <item.icon />
        ) : (
          <Badge
            color="success"
            badgeContent={count}
            max={99}
            invisible={count === 0}
            slotProps={{ badge: { 'aria-hidden': true } }}
          >
            <item.icon />
          </Badge>
        )}
      </ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );
}

/** The Inbox item with its unread-conversations badge (live). */
function InboxNavEntry(props: Omit<NavEntryProps, 'count'>) {
  const count = useInboxSummary().data?.unreadConversations ?? 0;
  return <NavEntry {...props} count={count} />;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const can = useCan();
  const platformAdmin = useIsPlatformAdmin();
  const { pathname } = useLocation();
  const platformAccount = useAuthStore((st) => Boolean(st.session?.account.isPlatform));
  // the platform account has no wallet (billing lives under /admin/billing)
  const items = visibleNavItems(
    (perm) => can(perm) && !(platformAccount && perm.startsWith('wallet.')),
    platformAdmin,
  );
  const main = items.filter((i) => !i.platformOnly);
  const admin = items.filter((i) => i.platformOnly);
  const render = (item: NavItem) => {
    const Entry = item.badge === 'inbox-unread' ? InboxNavEntry : NavEntry;
    return (
      <Entry
        key={item.key}
        item={item}
        selected={isActive(item, pathname)}
        onNavigate={onNavigate}
      />
    );
  };
  return (
    <nav aria-label="Main">
      <List>{main.map(render)}</List>
      {admin.length > 0 && (
        <>
          <Divider />
          <List subheader={<ListSubheader>Superadmin</ListSubheader>}>{admin.map(render)}</List>
        </>
      )}
    </nav>
  );
}

/** Permanent drawer on ≥ md, temporary (toggle) drawer on small screens. */
export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const brand = (
    <Toolbar>
      <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
        Cell AI Voicebot
      </Typography>
    </Toolbar>
  );
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {brand}
        <NavList onNavigate={onClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          // The paper is position: fixed — the docked root reserves its width in the flex row.
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {brand}
        <NavList />
      </Drawer>
    </>
  );
}
