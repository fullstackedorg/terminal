import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import eruda from "eruda";
eruda.init();

const terminal = new Terminal();
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

window.addEventListener("resize", () => {
    document.body.style.height = window.visualViewport.height + "px";
    fitAddon.fit();
});

const terminalContainer = document.createElement("div");
terminalContainer.id = "terminal-container";
document.body.append(terminalContainer);
terminal.open(terminalContainer);

terminal.focus();

const te = new TextEncoder();

terminal.onKey(({ key }) => {
    console.log(te.encode(key));
    terminal.write(key);
});

const keyboardExtension = document.createElement("div");
keyboardExtension.id = "keyboard-extension";

const left = new Uint8Array([27, 91, 68]);
const leftButton = document.createElement("button");
leftButton.innerText = "<";
leftButton.onclick = () => {
    terminal.write(left);
    terminal.focus();
};

const right = new Uint8Array([27, 91, 67]);
const rightButton = document.createElement("button");
rightButton.innerText = ">";
rightButton.onclick = () => {
    terminal.write(right);
    terminal.focus();
};
keyboardExtension.append(leftButton, rightButton);

document.body.append(keyboardExtension);

let lastHeight = window.visualViewport.height;
const checkHeight = () => {
    const currentHeight = window.visualViewport.height;

    if(currentHeight !== lastHeight) {
        window.dispatchEvent(new Event("resize"))
    }
    
    lastHeight = currentHeight;
    
    window.requestAnimationFrame(checkHeight);
}
