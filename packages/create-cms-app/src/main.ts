if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("create-cms-app needs an interactive terminal.");
  process.exitCode = 1;
} else {
  console.log("create-cms-app");
}
