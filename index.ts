import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import LocalEchoController from "./local-echo";
import eruda from "eruda";
eruda.init();

const terminal = new Terminal();
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

const fit = () => {
    const keyboardExtHeight = keyboardExtension.getBoundingClientRect().height;
    terminalContainer.style.height =
        window.visualViewport.height - keyboardExtHeight + "px";
    fitAddon.fit();
}
window.addEventListener("resize", fit);

const terminalContainer = document.createElement("div");
terminalContainer.id = "terminal-container";
document.body.append(terminalContainer);
terminal.open(terminalContainer);

terminal.focus();

const keyboardExtension = document.createElement("div");
keyboardExtension.id = "keyboard-extension";

const tabButton = document.createElement("button");
tabButton.innerText = "tab";
tabButton.onclick = () => {
    terminal.focus();
    terminal.textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Tab",
            keyCode: 9,
            code: "Tab",
            which: 9,
        }),
    );
};
const leftButton = document.createElement("button");
leftButton.innerText = "<";
leftButton.onclick = () => {
    terminal.focus();
    terminal.textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowLeft",
            keyCode: 37,
            code: "ArrowLeft",
            which: 37,
        }),
    );
};
const rightButton = document.createElement("button");
rightButton.innerText = ">";
rightButton.onclick = () => {
    terminal.focus();
    terminal.textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowRight",
            keyCode: 39,
            code: "ArrowRight",
            which: 39,
        }),
    );
};
keyboardExtension.append(tabButton, leftButton, rightButton);

document.body.append(keyboardExtension);

let lastHeight = window.visualViewport.height;
const checkHeight = () => {
    const currentHeight = window.visualViewport.height;

    if (currentHeight !== lastHeight) {
        window.dispatchEvent(new Event("resize"));
    }

    lastHeight = currentHeight;

    window.requestAnimationFrame(checkHeight);
};

const localEcho = new LocalEchoController(terminal);

localEcho.addAutocompleteHandler(() => ["autocomplete", "all"]);

function loop() {
    localEcho
        .read("~$ ")
        .then(async (cmd) => {
            localEcho.print(`Hello`);
            await new Promise(res => setTimeout(res, 2000));
            localEcho.clearInput()
            localEcho.println(`Unknown command [${cmd.trim()}]`)
            loop();
        })
        .catch(console.log);
}

loop();
fit();
