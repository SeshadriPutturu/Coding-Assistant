import * as vscode from 'vscode';

interface ChatResponse {
  answer: string;
  conversationId: string;
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new AssistantViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('programmingAssistant.chatView', provider),
    vscode.commands.registerCommand('programmingAssistant.ask', () => provider.focusInput()),
    vscode.commands.registerCommand('programmingAssistant.explainSelection', () => {
      const editor = vscode.window.activeTextEditor;
      const selectedCode = editor?.document.getText(editor.selection).trim();
      if (!selectedCode) {
        vscode.window.showInformationMessage('Select code before asking for an explanation.');
        return;
      }
      provider.openWithQuestion(`Explain this ${editor?.document.languageId ?? ''} code:\n\n${selectedCode}`);
    })
  );
}

class AssistantViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private conversationId?: string;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.renderHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message: { type: string; text?: string }) => {
      if (message.type === 'ask' && message.text?.trim()) {
        await this.ask(message.text.trim());
      }
    });
  }

  focusInput(): void {
    this.view?.show(true);
    this.view?.webview.postMessage({ type: 'focus' });
  }

  openWithQuestion(question: string): void {
    this.view?.show(true);
    this.view?.webview.postMessage({ type: 'setQuestion', text: question });
  }

  private async ask(message: string): Promise<void> {
    this.view?.webview.postMessage({ type: 'loading' });
    const backendUrl = vscode.workspace.getConfiguration('programmingAssistant').get<string>(
      'backendUrl',
      'http://localhost:8080'
    );

    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId: this.conversationId })
      });
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }
      const data = (await response.json()) as ChatResponse;
      this.conversationId = data.conversationId;
      this.view?.webview.postMessage({ type: 'answer', answer: data.answer, conversationId: data.conversationId });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown request error';
      this.view?.webview.postMessage({ type: 'error', message: `Could not reach the assistant: ${reason}` });
    }
  }

  private renderHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <style>
          :root { color-scheme: light dark; }
          body { padding: 0 14px 14px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
          header { padding: 14px 0 12px; border-bottom: 1px solid var(--vscode-panel-border); }
          h1 { font-size: 16px; margin: 0 0 4px; }
          .subtle { color: var(--vscode-descriptionForeground); font-size: 11px; }
          #messages { display: flex; flex-direction: column; gap: 10px; padding: 14px 0; }
          .message { white-space: pre-wrap; line-height: 1.45; font-size: 12px; }
          .user { border-left: 2px solid var(--vscode-textLink-foreground); padding-left: 8px; }
          .assistant { background: var(--vscode-textBlockQuote-background); border-left: 2px solid var(--vscode-charts-green); padding: 9px; }
          .error { color: var(--vscode-errorForeground); }
          form { position: sticky; bottom: 0; background: var(--vscode-sideBar-background); padding-top: 8px; }
          textarea { box-sizing: border-box; width: 100%; resize: vertical; min-height: 74px; padding: 8px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); }
          button { width: 100%; margin-top: 7px; padding: 7px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; cursor: pointer; }
          button:hover { background: var(--vscode-button-hoverBackground); }
          button:disabled { opacity: .55; cursor: wait; }
        </style>
      </head>
      <body>
        <header><h1>Programming Assistant</h1><span class="subtle">Local Spring AI workspace companion</span></header>
        <section id="messages" aria-live="polite"><div class="subtle">Ask a question or explain selected code.</div></section>
        <form id="form"><textarea id="input" aria-label="Question" placeholder="Ask about your code..."></textarea><button id="send" type="submit">Ask Assistant</button></form>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const form = document.getElementById('form');
          const input = document.getElementById('input');
          const send = document.getElementById('send');
          const messages = document.getElementById('messages');
          const addMessage = (text, className) => { const item = document.createElement('div'); item.className = 'message ' + className; item.textContent = text; messages.appendChild(item); item.scrollIntoView({ behavior: 'smooth' }); };
          form.addEventListener('submit', (event) => { event.preventDefault(); const text = input.value.trim(); if (!text) return; addMessage(text, 'user'); vscode.postMessage({ type: 'ask', text }); input.value = ''; });
          window.addEventListener('message', ({ data }) => { if (data.type === 'loading') { send.disabled = true; send.textContent = 'Thinking...'; } if (data.type === 'answer') { addMessage(data.answer || 'The assistant returned no text.', 'assistant'); send.disabled = false; send.textContent = 'Ask Assistant'; } if (data.type === 'error') { addMessage(data.message, 'error'); send.disabled = false; send.textContent = 'Ask Assistant'; } if (data.type === 'setQuestion') { input.value = data.text; input.focus(); } if (data.type === 'focus') input.focus(); });
        </script>
      </body>
      </html>`;
  }
}

function getNonce(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let index = 0; index < 32; index++) value += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return value;
}