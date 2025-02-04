import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import LocalEchoController from "./local-echo";
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

const keyboardExtension = document.createElement("div");
keyboardExtension.id = "keyboard-extension";

const leftButton = document.createElement("button");
leftButton.innerText = "<";
leftButton.onclick = () => {
    terminal.focus();
    terminal.textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowLeft",
            keyCode: 37,
            code: "ArrowLeft", 
            which: 37
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
            which: 39
        }),
    );
};
keyboardExtension.append(leftButton, rightButton);

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
checkHeight();

const localEcho = new LocalEchoController(terminal);

function loop() {
    localEcho
        .read("~$ ")
        .then((cmd) => {
            console.log(cmd);
            loop();
        })
        .catch(console.log);
}

loop();
