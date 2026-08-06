import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class DropboxService {
  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async getAuthUrl(redirectUri: string): Promise<string> {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    if (!clientId) {
      throw new NotFoundException('Dropbox not configured');
    }

    const state = crypto.randomUUID();
    const authorizeUrl = new URL('https://www.dropbox.com/oauth2/authorize');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('state', state);

    return authorizeUrl.toString();
  }

  async handleCallback(
    code: string,
    state: string,
    redirectUri: string,
    userId: string,
  ): Promise<void> {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new NotFoundException('Dropbox not configured');
    }

    const tokenResponse = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      account_id?: string;
    };

    let accountId = tokenData.account_id ?? '';
    let accountEmail = '';

    if (tokenData.access_token) {
      try {
        const accountResponse = await fetch(
          'https://api.dropboxapi.com/2/users/get_current_account',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const accountData = (await accountResponse.json()) as {
          account_id: string;
          email?: string;
        };
        accountId = accountData.account_id;
        accountEmail = accountData.email ?? '';
      } catch {
        // Account info fetch failed — proceed with partial data
      }
    }

    const tokenExpiry = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await this.db.dropboxToken.upsert({
      where: {
        id:
          (
            await this.db.dropboxToken.findFirst({
              where: { userId },
            })
          )?.id ?? '',
      },
      create: {
        tenantId: process.env.TENANT_ID ?? 'default',
        userId,
        accountId,
        accountEmail,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiry,
        connectedAt: new Date(),
      },
      update: {
        accountId,
        accountEmail,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? undefined,
        tokenExpiry,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });
  }

  async disconnect(userId: string): Promise<void> {
    const token = await this.db.dropboxToken.findFirst({
      where: { userId, disconnectedAt: null },
    });

    if (token) {
      await this.db.dropboxToken.update({
        where: { id: token.id },
        data: { disconnectedAt: new Date() },
      });
    }
  }

  async getStatus(userId: string): Promise<{
    connected: boolean;
    accountEmail: string | null;
    connectedAt: string | null;
  }> {
    const token = await this.db.dropboxToken.findFirst({
      where: { userId, disconnectedAt: null },
    });

    if (!token) {
      return { connected: false, accountEmail: null, connectedAt: null };
    }

    return {
      connected: true,
      accountEmail: token.accountEmail,
      connectedAt: token.connectedAt.toISOString(),
    };
  }
}
