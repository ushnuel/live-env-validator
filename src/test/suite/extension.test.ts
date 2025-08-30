import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as myExtension from "../../extension";
import * as rimraf from "rimraf";

describe("Extension Test Suite", () => {
  let tempDir: string;

  before(() => {
    console.log(">>> before hook");
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "live-env-validator-test-")
    );
    fs.writeFileSync(path.join(tempDir, ".env"), "MY_VAR=123\n");
    fs.writeFileSync(path.join(tempDir, ".env.local"), "MY_OTHER_VAR=456\n");
    vscode.workspace.updateWorkspaceFolders(0, 0, {
      uri: vscode.Uri.file(tempDir),
    });
  });

  after(async () => {
    vscode.workspace.updateWorkspaceFolders(0, 1);
    process.on("exit", () => {
      rimraf.sync(tempDir);
    });
  });

  it("getDefinedEnvVars", async () => {
    const envVars = await myExtension.getDefinedEnvVars();
    assert.ok(envVars.has("MY_VAR"));
    assert.ok(envVars.has("MY_OTHER_VAR"));
    assert.strictEqual(envVars.size, 2);
  });

  it("updateDiagnostics", async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: "typescript",
      content: "process.env.MY_VAR process.env.MY_THIRD_VAR",
    });
    await vscode.window.showTextDocument(doc);

    await myExtension.updateDiagnostics(
      { subscriptions: [] } as any,
      vscode.window.activeTextEditor!.document.uri
    );

    const diagnostics = vscode.languages.getDiagnostics(doc.uri);
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(
      diagnostics[0].message,
      "MY_THIRD_VAR is not defined in any .env file"
    );
  });
});
