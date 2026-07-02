/**
 * Google Workspace API helper integrations
 */

// Helper to encode a mail message in Base64Url format required by Gmail
function base64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Robust same-origin proxy fetch helper to bypass browser CORS blockages for Google Workspace APIs
 */
async function proxyFetch(url: string, options: { method?: string; headers?: Record<string, string>; body?: any }) {
  const res = await fetch("/api/workspace/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
    }),
  });
  return res;
}

/**
 * 1. Google Calendar Integration
 */
export interface CalendarEventPayload {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export async function createCalendarEvent(accessToken: string, event: CalendarEventPayload) {
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const res = await proxyFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar API error: ${errText}`);
  }
  return await res.json();
}

/**
 * 2. Gmail Integration
 */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
) {
  const url = "https://www.googleapis.com/gmail/v1/users/me/messages/send";
  
  // Format standard MIME email
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyText
  ];
  const emailStr = emailLines.join("\r\n");
  const base64EncodedEmail = base64url(emailStr);

  const res = await proxyFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64EncodedEmail }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API error: ${errText}`);
  }
  return await res.json();
}

/**
 * 4. Google Chat Integration
 */
export interface ChatSpace {
  name: string; // "spaces/XXXX"
  displayName: string;
  type: string;
}

export async function listChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  const url = "https://chat.googleapis.com/v1/spaces";
  const res = await proxyFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Chat API error: ${errText}`);
  }
  const data = await res.json();
  return data.spaces || [];
}

export async function sendChatMessage(
  accessToken: string,
  spaceName: string, // "spaces/XXXX"
  text: string
) {
  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const res = await proxyFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Chat Send Message error: ${errText}`);
  }
  return await res.json();
}

/**
 * 5. Google Tasks Integration
 */
export interface TaskList {
  id: string;
  title: string;
}

export interface TaskPayload {
  title: string;
  notes?: string;
  due?: string; // ISO 8601 date format, e.g. "2026-06-27T12:00:00.000Z"
}

export async function listTaskLists(accessToken: string): Promise<TaskList[]> {
  const url = "https://tasks.googleapis.com/tasks/v1/users/@default/lists";
  const res = await proxyFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Tasks List error: ${errText}`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function createGoogleTask(
  accessToken: string,
  taskListId: string,
  task: TaskPayload
) {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
  const res = await proxyFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Tasks Create error: ${errText}`);
  }
  return await res.json();
}
