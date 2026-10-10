import { useEffect } from 'react';
import { useBlocker } from 'react-router';

import { useConfirm } from '@/components/confirm-context';

/**
 * Asks "Discard changes?" before leaving the page with unsaved edits —
 * in-app navigation (router blocker) and tab close / reload (`beforeunload`).
 * Navigating within the same page (tabs of an editor) is allowed.
 */
export const useUnsavedChangesGuard = (
  dirty: boolean,
  samePage?: (path: string) => boolean,
): void => {
  const confirm = useConfirm();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      currentLocation.pathname !== nextLocation.pathname &&
      !(samePage?.(nextLocation.pathname) ?? false),
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    void confirm({
      title: 'Discard changes?',
      message: 'You have unsaved changes. They will be lost if you leave.',
      confirmText: 'Discard',
      cancelText: 'Stay',
      destructive: true,
    }).then((ok) => {
      if (!active) return;
      if (ok) blocker.proceed();
      else blocker.reset();
    });
    return () => {
      active = false;
    };
  }, [blocker, confirm]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
};
