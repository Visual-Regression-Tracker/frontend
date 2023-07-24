import fs from "node:fs";
import process from "node:process";

const JS_FILE = "env-config.js";
const ENV_FILE = ".env";

// Remove existing config file
if (fs.existsSync(JS_FILE)) {
  fs.unlinkSync(JS_FILE);
}
// Create new file
fs.writeFileSync(JS_FILE, "", "utf-8");

// Add assignment
fs.appendFileSync(JS_FILE, "window._env_ = {\n");

// Read each line in .env file
// Each line represents key=value pairs
const envFile = fs.readFileSync(ENV_FILE, "utf-8");
const lines = envFile.split("\n");

lines.forEach((line) => {
  // Ignore comments, lines starting with hash
  if (line.startsWith("#")) {
    return;
  }
  // Split env variables by character `=`
  if (line.includes("=")) {
    const [varname, varvalue] = line.split("=");

    // Read value of current variable if exists as Environment variable
    let value = process.env[varname] || varvalue;
    // Otherwise use value from .env file
    if (typeof value === "undefined") {
      value = varvalue;
    }

    // Append configuration property to JS file
    fs.appendFileSync(JS_FILE, `  ${varname}: "${value}",\n`);
  }
});

fs.appendFileSync(JS_FILE, "};");
