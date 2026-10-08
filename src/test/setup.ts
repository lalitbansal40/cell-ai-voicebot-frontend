import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { installAuthHooks } from '@/services/api/client';

import { signOutStore } from './auth';

afterEach(() => {
  cleanup();
  // Signed out by default (no bootstrap refresh); tests sign in with signInAs().
  signOutStore();
  installAuthHooks(null);
});

signOutStore();
