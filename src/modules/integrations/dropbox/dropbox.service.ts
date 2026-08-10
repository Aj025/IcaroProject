import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

interface TokenCacheEntry {
  accessToken: string;
  expiresAt: number;
}

interface RefreshedToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const DROPBOX_TOKEN_URL = 'https://api.dropbox.com/oauth2/token';

@Injectable()
export class DropboxService {
  private readonly logger = new Logger(DropboxService.name);
  private envTokenCache: TokenCacheEntry | null = null;

  constructor(private prismaService: PrismaService) {}

  private get db() {
    return this.prismaService.prisma;
  }

  async getValidAccessToken(userId?: string): Promise<string | null> {
    const envToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (envToken) {
      return this.cachedEnvAccessToken(envToken);
    }

    if (!userId) return null;

    const token = await this.db.dropboxToken.findFirst({
      where: { userId, disconnectedAt: null },
      orderBy: { connectedAt: 'desc' },
    });
    if (!token) return null;

    const isExpired =
      token.tokenExpiry === null || token.tokenExpiry.getTime() <= Date.now();

    if (isExpired && token.refreshToken) {
      const refreshed = await this.refreshDbAccessToken(
        token.id,
        token.refreshToken,
      );
      if (refreshed) return refreshed;
    }

    return token.accessToken;
  }

  private async cachedEnvAccessToken(envToken: string): Promise<string> {
    if (this.envTokenCache && this.envTokenCache.expiresAt > Date.now()) {
      return this.envTokenCache.accessToken;
    }

    const envRefreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    if (!envRefreshToken || !clientId || !clientSecret) {
      return envToken;
    }

    const refreshed = await this.exchangeRefreshToken(
      envRefreshToken,
      clientId,
      clientSecret,
    );
    if (refreshed) {
      this.envTokenCache = {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      };
      return refreshed.accessToken;
    }

    return envToken;
  }

  private async refreshDbAccessToken(
    tokenId: string,
    refreshToken: string,
  ): Promise<string | null> {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      this.logger.warn(
        'Dropbox token refresh skipped - client id/secret not configured',
      );
      return null;
    }

    const refreshed = await this.exchangeRefreshToken(
      refreshToken,
      clientId,
      clientSecret,
    );
    if (!refreshed) return null;

    await this.db.dropboxToken.update({
      where: { id: tokenId },
      data: {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? undefined,
        tokenExpiry: new Date(refreshed.expiresAt),
      },
    });

    return refreshed.accessToken;
  }

  private async exchangeRefreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<RefreshedToken | null> {
    try {
      const response = await fetch(DROPBOX_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Dropbox token refresh refused: HTTP ${response.status}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in?: number;
        refresh_token?: string;
      };

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in ?? 14400) * 1000,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Dropbox token refresh failed: ${message}`);
      return null;
    }
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
