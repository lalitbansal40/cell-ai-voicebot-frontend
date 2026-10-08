import { expect, test } from '@playwright/test';

import { PASSWORD } from './env';
import { signUpOwner, uniqueEmail } from './helpers';
import { extractLink, waitForEmail } from './mailpit';

test('owner invites an agent; role decides what the member can open', async ({ page, browser }) => {
  await signUpOwner(page, 'team');
  const memberEmail = uniqueEmail('member');

  await page.getByRole('link', { name: 'Team' }).click();
  await page.getByRole('button', { name: 'Invite member' }).click();
  const dialog = page.getByRole('dialog', { name: 'Invite a team member' });
  await dialog.getByLabel('Email').fill(memberEmail);
  await dialog.getByLabel('Name').fill('Ravi Kumar');
  await dialog.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.getByText(`Invitation sent to ${memberEmail}`)).toBeVisible();
  const row = page.getByRole('row', { name: /Ravi Kumar/ });
  await expect(row.getByText('Invited')).toBeVisible();

  // The member accepts in their own browser.
  const memberContext = await browser.newContext();
  const member = await memberContext.newPage();
  const link = extractLink(await waitForEmail(memberEmail, /invited/i), '/accept-invite');
  await member.goto(link);
  await expect(member.getByLabel('Your name')).toHaveValue('Ravi Kumar');
  await member.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await member.getByLabel('Repeat password').fill(PASSWORD);
  await member.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(member.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

  // Agents have no team.read: no menu entry, and the URL is forbidden.
  await expect(member.getByRole('link', { name: 'Team' })).toHaveCount(0);
  await member.goto('/team');
  await expect(member.getByRole('heading', { level: 1, name: '403' })).toBeVisible();

  // Owner promotes the member to Manager.
  await expect(row.getByText('Active')).toBeVisible({ timeout: 15_000 });
  await row.getByRole('button', { name: 'Actions for Ravi Kumar' }).click();
  await page.getByRole('menuitem', { name: 'Make Manager' }).click();
  await expect(page.getByText('Ravi Kumar is now Manager')).toBeVisible();

  // The member's old token is invalidated; the next load picks up the new role.
  await member.goto('/team');
  await expect(member.getByRole('heading', { level: 1, name: 'Team' })).toBeVisible();
  await expect(member.getByRole('button', { name: 'Invite member' })).toHaveCount(0);

  // Disabling signs the member out.
  await row.getByRole('button', { name: 'Actions for Ravi Kumar' }).click();
  await page.getByRole('menuitem', { name: 'Disable' }).click();
  await expect(page.getByText('Ravi Kumar was disabled')).toBeVisible();
  await member.reload();
  await expect(member.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await memberContext.close();
});
