/**
 * Instagram Graph API Client
 * Handles authentication, data fetching, and DM sending
 */

interface InstagramUserProfile {
  id: string;
  username: string;
  account_type?: string;
}

interface InstagramComment {
  id: string;
  text: string;
  username: string;
  from: {
    id: string;
    username: string;
  };
  timestamp: string;
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
}

export class InstagramClient {
  private accessToken: string;
  private baseUrl = 'https://graph.instagram.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<InstagramUserProfile> {
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,username,account_type&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's recent media posts
   */
  async getUserMedia(limit: number = 25): Promise<InstagramPost[]> {
    const response = await fetch(
      `${this.baseUrl}/me/media?fields=id,caption,media_url,permalink,timestamp&limit=${limit}&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get comments on a specific media post
   */
  async getMediaComments(mediaId: string): Promise<InstagramComment[]> {
    const response = await fetch(
      `${this.baseUrl}/${mediaId}/comments?fields=id,text,username,from,timestamp&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Check if a user is following the account
   */
  async isFollower(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=followers{id}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const followers = data.followers?.data || [];
      return followers.some((follower: any) => follower.id === userId);
    } catch (error) {
      console.error('Error checking follower status:', error);
      return false;
    }
  }

  /**
   * Send a direct message to a user
   * Note: Instagram Graph API has limited DM capabilities
   * This is a placeholder - actual implementation requires Instagram Messaging API
   */
  async sendDirectMessage(recipientId: string, message: string): Promise<boolean> {
    try {
      // Instagram Messaging API endpoint
      const response = await fetch(
        `${this.baseUrl}/me/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message },
            access_token: this.accessToken,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send DM:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending DM:', error);
      return false;
    }
  }

  /**
   * Get user information by user ID
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}?fields=id,username&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Refresh the access token
   * Instagram access tokens expire after 60 days
   */
  static async refreshAccessToken(token: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

/**
 * Helper function to personalize message content
 */
export function personalizeMessage(
  template: string,
  variables: {
    firstName?: string;
    username?: string;
    commentText?: string;
    postTitle?: string;
  }
): string {
  let message = template;

  if (variables.firstName) {
    message = message.replace(/{first_name}/g, variables.firstName);
  }

  if (variables.username) {
    message = message.replace(/{username}/g, variables.username);
  }

  if (variables.commentText) {
    message = message.replace(/{comment_text}/g, variables.commentText);
  }

  if (variables.postTitle) {
    message = message.replace(/{post_title}/g, variables.postTitle);
  }

  return message;
}
