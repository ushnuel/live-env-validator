import * as path from "path";
import * as vscode from "vscode";
import * as dotenv from "dotenv";

export const diagnosticCollection =
  vscode.languages.createDiagnosticCollection("live-env-validator");

let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  updateDiagnostics(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((editor) => {
      if (editor) {
        updateDiagnostics(context);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(() => {
      updateDiagnostics(context);
    })
  );

  const codeActionProvider = new EnvVarCodeActionProvider();
  const providerRegistration = vscode.languages.registerCodeActionsProvider(
    [
      { language: "typescript", scheme: "file" },
      { language: "javascript", scheme: "file" },
      { language: "go", scheme: "file" },
    ],
    codeActionProvider
  );
  disposables.push(providerRegistration);

  const command = vscode.commands.registerCommand(
    "live-env-validator.addEnvVar",
    async (variableName: string, documentUri: vscode.Uri) => {
      const envFiles = await vscode.workspace.findFiles("**/.env*");

      if (envFiles.length === 0) {
        vscode.window.showErrorMessage("No .env file found in the workspace.");
        return;
      }

      let selectedEnvFile;
      if (envFiles.length === 1) {
        selectedEnvFile = envFiles[0];
      } else {
        const items = envFiles.map((file) => ({
          label: path.basename(file.fsPath),
          description: file.fsPath,
          uri: file,
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select the .env file to add the variable to",
        });
        if (selected) {
          selectedEnvFile = selected.uri;
        }
      }

      if (selectedEnvFile) {
        const content = await vscode.workspace.fs.readFile(selectedEnvFile);
        const contentString = content.toString();
        if (!contentString.includes(`${variableName}=`)) {
          const newContent = contentString + `\n${variableName}=`;
          await vscode.workspace.fs.writeFile(
            selectedEnvFile,
            Buffer.from(newContent)
          );
          vscode.window.showInformationMessage(
            `Added ${variableName} to ${path.basename(selectedEnvFile.fsPath)}`
          );
        }
      }
    }
  );
  disposables.push(command);
}

export async function updateDiagnostics(
  context: vscode.ExtensionContext,
  docUri?: vscode.Uri
): Promise<void> {
  diagnosticCollection.clear();

  const envVars = await getDefinedEnvVars();

  const documentsToScan = docUri
    ? [await vscode.workspace.openTextDocument(docUri)]
    : vscode.workspace.textDocuments;

  for (const document of documentsToScan) {
    const diagnostics: vscode.Diagnostic[] = [];

    if (document.languageId === "go") {
      diagnostics.push(...updateGoDiagnostics(document, envVars));
      diagnosticCollection.set(document.uri, diagnostics);
    }

    if (
      document.languageId === "typescript" ||
      document.languageId === "javascript"
    ) {
      diagnostics.push(...updateTsNodeDiagnostics(document, envVars));
      diagnosticCollection.set(document.uri, diagnostics);
    }
  }
}

export function updateTsNodeDiagnostics(
  document: vscode.TextDocument,
  envVars: Set<string>
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  let match;

  const tsNodeRegex = /process\.env\.([A-Z0-9_]+)/gi;
  while ((match = tsNodeRegex.exec(text)) !== null) {
    const varName = match[1];
    if (!envVars.has(varName)) {
      const range = new vscode.Range(
        document.positionAt(match.index + "process.env.".length),
        document.positionAt(match.index + match[0].length)
      );
      const diagnostic = new vscode.Diagnostic(
        range,
        `${varName} is not defined in any .env file`,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.code = { value: varName, target: document.uri };
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

export function updateGoDiagnostics(
  document: vscode.TextDocument,
  envVars: Set<string>
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  let match;

  const goRegex = /os\.Getenv\("([A-Z0-9_]+)"\)/gi;
  while ((match = goRegex.exec(text)) !== null) {
    const varName = match[1];
    if (!envVars.has(varName)) {
      const range = new vscode.Range(
        document.positionAt(match.index + 'os.Getenv("'.length),
        document.positionAt(match.index + match[0].length - 2)
      );
      const diagnostic = new vscode.Diagnostic(
        range,
        `${varName} is not defined in any .env file`,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.code = { value: varName, target: document.uri };
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

export async function getDefinedEnvVars(): Promise<Set<string>> {
  const envVars = new Set<string>();
  const envFiles = await vscode.workspace.findFiles("**/.env*");

  for (const file of envFiles) {
    const content = await vscode.workspace.fs.readFile(file);
    const parsed = dotenv.parse(content.toString());
    for (const key in parsed) {
      envVars.add(key);
    }
  }

  return envVars;
}

export class EnvVarCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (
        diagnostic.severity === vscode.DiagnosticSeverity.Warning &&
        diagnostic.code
      ) {
        const varName = (
          diagnostic.code as { value: string; target: vscode.Uri }
        ).value;
        const action = new vscode.CodeAction(
          `Add ${varName} to .env file`,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: "live-env-validator.addEnvVar",
          title: "Add to .env file",
          arguments: [varName, document.uri],
        };
        actions.push(action);
      }
    }

    return actions;
  }
}

export function deactivate() {
  diagnosticCollection.clear();
  for (const disposable of disposables) {
    disposable.dispose();
  }
  disposables = [];
}
