import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import eruda from "eruda";
eruda.init();

const terminal = new Terminal();
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

window.addEventListener("resize", () => fitAddon.fit());

const root = document.createElement("div");
document.body.append(root);
terminal.open(root);

terminal.focus();

terminal.onKey(({ key }) => {
    terminal.write(key);
});
