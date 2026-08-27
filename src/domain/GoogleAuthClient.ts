/**
 * Daily Finance 3.0 - GoogleAuthClient (S5-012)
 * Client-side OAuth 2.0 Token Manager for Google Identity Services.
 * Restricts scope strictly to https://www.googleapis.com/auth/drive.appdata
 */

export class GoogleAuthClient {
  private static instance: GoogleAuthClient | null = null;
  private accessToken: string | null = null;
  private tokenExpiryTimestamp: number | null = null;
  private refreshHandler?: () => Promise<string | null>;
  private readonly scope = 'https://www.googleapis.com/auth/drive.appdata';

  public static getInstance(): GoogleAuthClient {
    if (!GoogleAuthClient.instance) {
      GoogleAuthClient.instance = new GoogleAuthClient();
    }
    return GoogleAuthClient.instance;
  }

  public setRefreshHandler(handler: (() => Promise<string | null>) | undefined): void {
    this.refreshHandler = handler;
  }

  public setToken(token: string | null, expiresInSeconds: number = 3600): void {
    if (!token) {
      this.clearToken();
      return;
    }
    this.accessToken = token;
    this.tokenExpiryTimestamp = Date.now() + expiresInSeconds * 1000;
  }

  public getAccessToken(): string | null {
    if (!this.accessToken) return null;
    if (this.isExpired()) {
      return null;
    }
    return this.accessToken;
  }

  public getTokenExpiration(): number | null {
    return this.tokenExpiryTimestamp;
  }

  public isExpired(): boolean {
    if (!this.tokenExpiryTimestamp) return true;
    // 60 second safety buffer before expiry
    return Date.now() >= this.tokenExpiryTimestamp - 60000;
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public clearToken(): void {
    this.accessToken = null;
    this.tokenExpiryTimestamp = null;
  }

  public async login(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return this.getAccessToken();
    }

    if ((window as any).google?.accounts?.oauth2) {
      return new Promise<string | null>((resolve) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'df3_appdata_client_id',
            scope: this.scope,
            callback: (response: any) => {
              if (response && response.access_token) {
                const expiresIn = parseInt(response.expires_in, 10) || 3600;
                this.setToken(response.access_token, expiresIn);
                resolve(response.access_token);
              } else {
                resolve(null);
              }
            },
            error_callback: () => resolve(null)
          });
          client.requestAccessToken();
        } catch {
          resolve(null);
        }
      });
    }

    return this.getAccessToken();
  }

  public async refreshIfNeeded(): Promise<string | null> {
    if (!this.accessToken || this.isExpired()) {
      if (this.refreshHandler) {
        const refreshed = await this.refreshHandler();
        if (refreshed) {
          this.setToken(refreshed);
          return refreshed;
        }
      }
      return this.login();
    }
    return this.accessToken;
  }
}
