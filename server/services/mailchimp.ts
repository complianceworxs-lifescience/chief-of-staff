import fetch from 'node-fetch';

interface MailChimpConfig {
  apiKey: string;
  serverPrefix: string;
  audienceId: string;
}

interface MailChimpMember {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, any>;
}

interface CampaignConfig {
  subject: string;
  previewText?: string;
  fromName: string;
  replyTo: string;
  htmlContent: string;
  segmentCriteria?: any;
}

export class MailChimpService {
  private config: MailChimpConfig;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    let serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !serverPrefix || !audienceId) {
      throw new Error('MailChimp credentials not configured. Set MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID');
    }

    // Fix server prefix format - remove dashes (us-19 -> us19)
    serverPrefix = serverPrefix.replace(/-/g, '');

    this.config = { apiKey, serverPrefix, audienceId };
    this.baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0`;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MailChimp API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async addOrUpdateMember(member: MailChimpMember) {
    const subscriberHash = this.getSubscriberHash(member.email);
    const mergeFields: Record<string, any> = {};
    
    if (member.firstName) mergeFields.FNAME = member.firstName;
    if (member.lastName) mergeFields.LNAME = member.lastName;
    if (member.mergeFields) Object.assign(mergeFields, member.mergeFields);

    const data = {
      email_address: member.email,
      status_if_new: 'subscribed',
      status: 'subscribed',
      merge_fields: mergeFields,
      tags: member.tags || []
    };

    return this.request(
      'PUT',
      `/lists/${this.config.audienceId}/members/${subscriberHash}`,
      data
    );
  }

  async createCampaign(config: CampaignConfig) {
    const campaignData = {
      type: 'regular',
      recipients: {
        list_id: this.config.audienceId,
        segment_opts: config.segmentCriteria
      },
      settings: {
        subject_line: config.subject,
        preview_text: config.previewText,
        from_name: config.fromName,
        reply_to: config.replyTo,
        title: `${config.subject} - ${new Date().toISOString()}`
      }
    };

    const campaign = await this.request('POST', '/campaigns', campaignData);
    
    await this.request(
      'PUT',
      `/campaigns/${campaign.id}/content`,
      { html: config.htmlContent }
    );

    return campaign;
  }

  async sendCampaign(campaignId: string) {
    return this.request('POST', `/campaigns/${campaignId}/actions/send`);
  }

  async addTagsToMember(email: string, tags: string[]) {
    const subscriberHash = this.getSubscriberHash(email);
    return this.request(
      'POST',
      `/lists/${this.config.audienceId}/members/${subscriberHash}/tags`,
      { tags: tags.map(name => ({ name, status: 'active' })) }
    );
  }

  async getAudienceStats() {
    return this.request('GET', `/lists/${this.config.audienceId}`);
  }

  async searchMembers(query: string) {
    return this.request('GET', `/search-members?query=${encodeURIComponent(query)}`);
  }

  private getSubscriberHash(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }
}

export const mailchimp = new MailChimpService();
