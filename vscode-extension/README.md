# Programming Assistant VS Code Extension

The extension integrates with VS Code in three ways:

- Native Chat: type `@assistant` in the VS Code Chat panel.
- Sidebar view: open **Programming Assistant** from the Activity Bar.
- Editor commands: ask the assistant or explain the selected code from the Command Palette.

## Run locally

1. Start the backend with `gradle bootRun` from the repository root.
2. In this directory run `npm install` and `npm run compile`.
3. Open the repository in VS Code, press `F5`, and choose **Run Programming Assistant Extension**.
4. In the Extension Development Host, open Chat and use `@assistant`, or open the sidebar view.

The backend URL defaults to `http://localhost:8080` and can be changed with the
`programmingAssistant.backendUrl` setting. Commands are available from the Command Palette:

- `Programming Assistant: Ask Assistant`
- `Programming Assistant: Explain Selected Code`

The extension sends selected code as prompt context and never writes files automatically. The
native Chat Participant sends requests to the same local Spring Boot API as the sidebar.