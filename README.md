# Live Env Validator

**Live Env Validator** is a Visual Studio Code extension that helps prevent runtime errors caused by misconfigured environment variables. It actively checks your code for `process.env.SOMETHING` and underlines any variables that are not defined in your specified `.env` files. This simple validation saves you from frustrating debugging sessions and ensures your application has the configuration it needs to run correctly.

## Features

- **Real-time Environment Variable Validation:** Underlines environment variables in your code that are not found in your `.env` files.
- **Configurable Env Files:** Specify which `.env` files to use for validation (e.g., `.env`, `.env.local`, `.env.production`).
- **Easy to Use:** Works automatically in the background with no commands to run.

## Requirements

There are no external requirements or dependencies to use this extension.

## Extension Settings

This extension contributes the following settings:

- `liveEnvValidator.envFiles`: An array of file names to be used for environment variable validation. The default is `[".env", ".env.local"]`.

You can configure this setting in your `settings.json` file:

```json
{
  "liveEnvValidator.envFiles": [".env", ".env.development", ".env.production"]
}
```

## Commands

This extension provides the following commands:

- `live-env-validator.helloWorld`: A sample "Hello World" command. (This is a placeholder and will be updated in future releases).

## Installation

1.  Install Visual Studio Code.
2.  Open the **Extensions** view (Ctrl+Shift+X).
3.  Search for "Live Env Validator".
4.  Click **Install**.

Alternatively, you can install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/).

## Usage

Once installed, the Live Env Validator will automatically start analyzing your code. If you use an environment variable that is not defined in the configured `.env` files, it will be underlined with a warning.

## Known Issues

There are currently no known issues. If you encounter a bug, please file an issue on our [GitHub repository](https://github.com/ushnuel/live-env-validator).

## Release Notes

### 0.0.1

- Initial release of Live Env Validator.

---

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue on our [GitHub repository](https://github.com/ushnuel/live-env-validator).

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

**Enjoy!**
