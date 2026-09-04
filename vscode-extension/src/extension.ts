import * as vscode from 'vscode';

interface ChatResponse {
  answer: string;
  conversationId: string;
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new AssistantViewProvider(context.extensionUri);
  const chatParticipant = vscode.chat.createChatParticipant('programmingAssistant.chat', async (request, _context, response, token) => {
    if (token.isCancellationRequested) return;

    try {
      const data = await requestAssistant(request.prompt);
      if (!token.isCancellationRequested) response.markdown(data.answer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown request error';
      response.markdown(`Could not reach the assistant: ${reason}`);
    }
  });
  chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'assistant.svg');

  context.subscriptions.push(
    chatParticipant,
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

async function requestAssistant(message: string, conversationId?: string): Promise<ChatResponse> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new Error('Please enter a question.');

  const backendUrl = vscode.workspace.getConfiguration('programmingAssistant').get<string>(
    'backendUrl',
    'http://localhost:8080'
  );
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: trimmedMessage, conversationId })
  });
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
  return (await response.json()) as ChatResponse;
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
        if (message.type === 'reset') {
          this.conversationId = undefined;
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

    try {
      const data = await requestAssistant(message, this.conversationId);
      this.conversationId = data.conversationId;
      this.view?.webview.postMessage({ type: 'answer', answer: data.answer || 'The assistant returned no text.' });
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
          * { box-sizing: border-box; }
          body { min-height: 100vh; margin: 0; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); font-family: var(--vscode-font-family); font-size: 12px; }
          .shell { display: flex; min-height: 100vh; flex-direction: column; }
          header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--vscode-panel-border); }
          .heading { min-width: 0; }
          h1 { margin: 0; font-size: 13px; font-weight: 600; }
          .subtle { color: var(--vscode-descriptionForeground); font-size: 11px; }
          .model { display: inline-flex; align-items: center; gap: 5px; margin-top: 3px; color: var(--vscode-descriptionForeground); font-size: 10px; }
          .model::before { width: 6px; height: 6px; border-radius: 50%; background: var(--vscode-testing-iconPassed, #73c991); content: ''; }
          .toolbar { display: flex; gap: 2px; }
          .icon-button { width: 26px; height: 26px; margin: 0; padding: 0; color: var(--vscode-icon-foreground); background: transparent; border: 0; cursor: pointer; font-size: 15px; }
          .icon-button:hover { background: var(--vscode-toolbar-hoverBackground); }
          main { display: flex; flex: 1; flex-direction: column; padding: 14px 12px 0; }
          #messages { display: flex; flex: 1; flex-direction: column; gap: 16px; padding-bottom: 16px; }
          .welcome { display: flex; flex-direction: column; gap: 12px; margin: auto 0; padding: 22px 4px; }
          .welcome-mark { display: grid; width: 30px; height: 30px; place-items: center; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border-radius: 8px; font-weight: 700; }
          .welcome h2 { margin: 0; font-size: 17px; font-weight: 600; }
          .welcome p { margin: -5px 0 4px; color: var(--vscode-descriptionForeground); line-height: 1.45; }
          .suggestions { display: flex; flex-direction: column; gap: 6px; }
          .suggestion { width: 100%; margin: 0; padding: 8px 10px; color: var(--vscode-foreground); background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-panel-border); text-align: left; cursor: pointer; }
          .suggestion:hover { border-color: var(--vscode-focusBorder); background: var(--vscode-list-hoverBackground); }
          .message { display: flex; flex-direction: column; gap: 5px; animation: appear .18s ease-out; }
          .role { color: var(--vscode-descriptionForeground); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
          .message-body { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
          .user .message-body { padding: 8px 10px; color: var(--vscode-editor-foreground); background: var(--vscode-textCodeBlock-background); border-radius: 4px; }
          .assistant .message-body { padding-left: 10px; border-left: 2px solid var(--vscode-charts-green); }
          .error { color: var(--vscode-errorForeground); }
          form { position: sticky; bottom: 0; padding: 8px 0 12px; background: var(--vscode-sideBar-background); }
          .context-row { display: flex; align-items: center; gap: 5px; margin: 0 0 6px; color: var(--vscode-descriptionForeground); font-size: 10px; }
          .context { padding: 2px 6px; border: 1px solid var(--vscode-panel-border); border-radius: 3px; }
          .composer { display: flex; align-items: end; gap: 5px; padding: 7px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 5px; }
          textarea { width: 100%; min-height: 42px; max-height: 140px; padding: 3px; resize: none; color: var(--vscode-input-foreground); background: transparent; border: 0; outline: 0; font: inherit; line-height: 1.45; }
          textarea::placeholder { color: var(--vscode-input-placeholderForeground); }
          .send { width: 27px; height: 27px; margin: 0; padding: 0; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 3px; cursor: pointer; font-weight: 700; }
          .send:hover { background: var(--vscode-button-hoverBackground); }
          button:disabled { opacity: .55; cursor: wait; }
          .hint { margin: 6px 2px 0; color: var(--vscode-descriptionForeground); font-size: 10px; }
          @keyframes appear { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        </style>
      </head>
      <body>
        <div class="shell">
          <header>
            <div class="heading"><h1>Programming Assistant</h1><div class="model">Local model</div></div>
            <div class="toolbar"><button class="icon-button" id="clear" type="button" title="Start new chat" aria-label="Start new chat">+</button></div>
          </header>
          <main>
            <section id="messages" aria-live="polite">
              <div class="welcome" id="welcome">
                <div class="welcome-mark">PA</div>
                <h2>What can I help with?</h2>
                <p>Ask questions about your workspace, explain code, or troubleshoot an error.</p>
                <div class="suggestions">
                  <button class="suggestion" type="button">Explain the code I am looking at</button>
                  <button class="suggestion" type="button">Help me fix an error</button>
                  <button class="suggestion" type="button">Suggest improvements for this file</button>
                </div>
              </div>
            </section>
            <form id="form">
              <div class="context-row"><span>Context</span><span class="context">Workspace</span></div>
              <div class="composer"><textarea id="input" aria-label="Question" placeholder="Ask Programming Assistant..." rows="2"></textarea><button class="send" id="send" type="submit" title="Send message" aria-label="Send message">^</button></div>
              <p class="hint">Enter to send. Shift+Enter for a new line.</p>
            </form>
          </main>
        </div>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const form = document.getElementById('form');
          const input = document.getElementById('input');
          const send = document.getElementById('send');
          const messages = document.getElementById('messages');
          const welcome = document.getElementById('welcome');
          const addMessage = (text, className) => { welcome?.remove(); const item = document.createElement('article'); item.className = 'message ' + className; const role = document.createElement('div'); role.className = 'role'; role.textContent = className === 'user' ? 'You' : 'Assistant'; const body = document.createElement('div'); body.className = 'message-body'; body.textContent = text; item.append(role, body); messages.appendChild(item); item.scrollIntoView({ behavior: 'smooth', block: 'end' }); };
          const submit = (text) => { if (!text || send.disabled) return; addMessage(text, 'user'); vscode.postMessage({ type: 'ask', text }); input.value = ''; input.style.height = 'auto'; };
          form.addEventListener('submit', (event) => { event.preventDefault(); submit(input.value.trim()); });
          input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; });
          input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
          document.querySelectorAll('.suggestion').forEach((button) => button.addEventListener('click', () => { input.value = button.textContent || ''; input.focus(); form.requestSubmit(); }));
          document.getElementById('clear').addEventListener('click', () => { messages.replaceChildren(); messages.appendChild(welcome); vscode.postMessage({ type: 'reset' }); input.focus(); });
          window.addEventListener('message', ({ data }) => { if (data.type === 'loading') { send.disabled = true; send.textContent = '...'; } if (data.type === 'answer') { addMessage(data.answer || 'The assistant returned no text.', 'assistant'); send.disabled = false; send.textContent = '^'; } if (data.type === 'error') { addMessage(data.message, 'error'); send.disabled = false; send.textContent = '^'; } if (data.type === 'setQuestion') { input.value = data.text; input.focus(); } if (data.type === 'focus') input.focus(); });
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