import { lookpath } from "lookpath";
import * as path from "@std/path";
import { exists } from "@std/fs";

// Only run in a development environment
if (Deno.env.get("DENO_PROD") === "1") {
  Deno.exit(0);
}

async function runCommand(cmd: string, args: string[], silent = false) {
  const dcmd = new Deno.Command(cmd, {
    args,
    stdout: silent ? "null" : "inherit",
    stderr: silent ? "null" : "inherit",
    stdin: silent ? "null" : "inherit",
  });
  const process = dcmd.spawn();
  const status = await process.status;
  if (status.code != 0) {
    Deno.exit(status.code);
  }
}

// Ensure pre-commit cli is installed
if (!await lookpath("pre-commit")) {
  console.log(
    "%cpre-commit executable not found!",
    "color: red; font-weight: bold",
  );

  let pipCmd;
  if (await lookpath("pip3")) {
    pipCmd = "pip3";
  } else if (await lookpath("pip")) {
    pipCmd = "pip";
  } else {
    console.log(
      "%cCould not install pre-commit: pip not found!",
      "color: red; font-weight: bold",
    );
    console.log(
      "%cEither install pre-commit, or install pip.",
      "color: red; font-weight: bold",
    );
    Deno.exit(127);
  }

  // Install pre-commit
  console.log("%cInstalling pre-commit with pip.", "color: purple");
  await runCommand(pipCmd, ["install", "pre-commit"]);
}

// Ensure pre-commit hooks are installed
const preCommitPath = path.fromFileUrl(
  import.meta.resolve("./.git/hooks/pre-commit"),
);
if (!await exists(preCommitPath)) {
  console.log(
    "%cPre-commit hooks not installed!",
    "color:red; font-weight: bold",
  );
  console.log("%cInstalling pre-commit hooks.", "color: purple");
  await runCommand("pre-commit", ["install"]);
  console.log();
} else {
  await runCommand("pre-commit", ["install"], true);
}
