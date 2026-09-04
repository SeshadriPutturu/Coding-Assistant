# Development

Run backend checks from the repository root:

```text
gradle test
```

The controller tests mock the chat service, so they do not require a running Ollama
instance. A live API request requires Ollama and the configured model to be available.

Compile the VS Code extension from its directory:

```text
cd vscode-extension
npm install
npm run compile
```

For local extension development, open the repository in VS Code and press `F5`. The launch
configuration runs the extension in an Extension Development Host after compiling it.