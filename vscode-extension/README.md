# Programming Assistant VS Code Extension

## Run locally

1. Start the backend with `gradle bootRun` from the repository root.
2. In this directory run `npm install` and `npm run compile`.
3. Open the repository in VS Code, press `F5`, and choose **Run Extension**.
4. Open the Programming Assistant view from the Activity Bar.

The backend URL defaults to `http://localhost:8080` and can be changed with the
`programmingAssistant.backendUrl` setting. Commands are available from the Command Palette:

- `Programming Assistant: Ask Assistant`
- `Programming Assistant: Explain Selected Code`

The extension sends selected code as prompt context and never writes files automatically.