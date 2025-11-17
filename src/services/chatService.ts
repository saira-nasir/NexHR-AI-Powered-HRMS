// src/services/chatService.ts
/**
 * Chat service with SSE (Server-Sent Events) streaming support
 * Supports token-by-token streaming from /api/chat/stream/ endpoint
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface StreamEvent {
  type: 'connected' | 'token' | 'done' | 'error';
  text?: string;
  error?: string;
}

export interface StreamCallbacks {
  onConnected?: () => void;
  onToken?: (text: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

/**
 * Custom EventSource wrapper that supports Authorization header
 * Uses EventSource for GET requests with query params
 */
class AuthEventSource {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private url: string,
    private token: string | null,
    private callbacks: StreamCallbacks
  ) {}

  connect(query: string): void {
    try {
      // EventSource doesn't support custom headers, so we'll add token to URL if needed
      const urlWithQuery = new URL(this.url, API_BASE_URL);
      urlWithQuery.searchParams.set('q', query);
      
      // If token exists, add it as a query parameter (backend must support this)
      // Alternatively, backend should handle token from cookies or session
      if (this.token) {
        urlWithQuery.searchParams.set('token', this.token);
      }

      this.eventSource = new EventSource(urlWithQuery.toString());

      this.eventSource.onopen = () => {
        this.callbacks.onConnected?.();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload: StreamEvent = JSON.parse(event.data);
          
          switch (payload.type) {
            case 'connected':
              this.callbacks.onConnected?.();
              break;
            case 'token':
              if (payload.text) {
                this.callbacks.onToken?.(payload.text);
              }
              break;
            case 'done':
              this.callbacks.onDone?.();
              this.close();
              break;
            case 'error':
              this.callbacks.onError?.(payload.error || 'Unknown error');
              this.close();
              break;
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        this.callbacks.onError?.('Connection error occurred');
        this.close();
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      this.callbacks.onError?.('Failed to establish connection');
    }
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

/**
 * Alternative: Fetch-based streaming with ReadableStream (supports POST + auth headers)
 * This approach allows us to send Authorization header and JSON body
 */
export class FetchStreamClient {
  private abortController: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  constructor(
    private url: string,
    private token: string | null,
    private callbacks: StreamCallbacks
  ) {}

  async connect(query: string): Promise<void> {
    try {
      this.abortController = new AbortController();
      const fullUrl = `${API_BASE_URL}${this.url}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: query }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      // Signal connection established
      this.callbacks.onConnected?.();

      // Read the stream
      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          this.callbacks.onDone?.();
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process SSE frames (lines starting with "data: ")
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const payload: StreamEvent = JSON.parse(jsonStr);

              switch (payload.type) {
                case 'token':
                  if (payload.text) {
                    this.callbacks.onToken?.(payload.text);
                  }
                  break;
                case 'done':
                  this.callbacks.onDone?.();
                  this.close();
                  return;
                case 'error':
                  this.callbacks.onError?.(payload.error || 'Unknown error');
                  this.close();
                  return;
              }
            } catch (err) {
              console.error('Failed to parse SSE data:', jsonStr, err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Stream error:', err);
        this.callbacks.onError?.(err.message || 'Stream failed');
      }
    } finally {
      this.close();
    }
  }

  close(): void {
    if (this.reader) {
      this.reader.cancel().catch(console.error);
      this.reader = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

/**
 * Main chat service interface
 */
export class ChatService {
  private currentStream: FetchStreamClient | AuthEventSource | null = null;

  /**
   * Get JWT token from localStorage or context
   */
  private getToken(): string | null {
    try {
      const token = localStorage.getItem('token');
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Start streaming chat response
   * @param query User's question/message
   * @param callbacks Event handlers for stream events
   * @param useFetch If true, use fetch-based streaming (supports POST + auth). If false, use EventSource (GET only)
   */
  streamChat(query: string, callbacks: StreamCallbacks, useFetch = true): void {
    // Clean up any existing stream
    this.stopStream();

    const token = this.getToken();

    if (useFetch) {
      // Use fetch-based streaming (supports POST + Authorization header)
      this.currentStream = new FetchStreamClient('/api/chat/stream/', token, callbacks);
      (this.currentStream as FetchStreamClient).connect(query);
    } else {
      // Use EventSource (GET only, no custom headers)
      this.currentStream = new AuthEventSource('/api/chat/stream/', token, callbacks);
      (this.currentStream as AuthEventSource).connect(query);
    }
  }

  /**
   * Stop current stream
   */
  stopStream(): void {
    if (this.currentStream) {
      this.currentStream.close();
      this.currentStream = null;
    }
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;
