import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import LocalEchoController from "./local-echo";

export function createTerminal(domElement: HTMLElement) {
    const terminal = createXtermTerminal(domElement);

    setupKeyboardExtension(terminal, (button) => {
        terminal.textarea.dispatchEvent(new KeyboardEvent("keydown", button));
        terminal.focus();
    });

    return setupLocalEcho(terminal, console.log);
}

function createXtermTerminal(domElement: HTMLElement) {
    const terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(domElement);

    terminal.element.addEventListener("resize", () => fitAddon.fit());
    fitAddon.fit();

    return terminal;
}

function setupLocalEcho(
    terminal: Terminal,
    onCommand: (cmd: string) => void | Promise<void>,
) {
    const localEcho = new LocalEchoController(terminal);

    const loop = async () => {
        try {
            const cmd = await localEcho.read("~$ ");
            const maybePromise = onCommand(cmd);
            if (maybePromise instanceof Promise) await maybePromise;
        } catch (e) {
            console.log(e);
        }

        loop();
    };

    return {
        start: loop,
    };
}

type ButtonClickParam = {
    key: string;
    keyCode: number;
    code: string;
    which: number;
};

function setupKeyboardExtension(
    terminal: Terminal,
    onButtonClick: (p: ButtonClickParam) => void,
) {
    const keyboardExtension = document.createElement("div");
    keyboardExtension.classList.add("keyboard-extension");

    keyboardExtensionOverlayHeightListener(terminal, keyboardExtension);
    keyboardExtensionShowHideOnTerminalFocus(terminal, keyboardExtension);

    const inner = document.createElement("div");

    const tabButton = createButton("tab", "Tab", 9, onButtonClick);
    const leftButton = createButton("<", "ArrowLeft", 37, onButtonClick);
    const rightButton = createButton(">", "ArrowRight", 39, onButtonClick);

    inner.append(tabButton, leftButton, rightButton);
    keyboardExtension.append(inner);

    document.body.append(keyboardExtension);
}

function createButton(
    text: string,
    key: ButtonClickParam["key"],
    keyCode: ButtonClickParam["keyCode"],
    onClick: (p: ButtonClickParam) => void,
) {
    const button = document.createElement("button");
    button.innerText = text;
    button.onclick = () =>
        onClick({
            key,
            keyCode,
            code: key,
            which: keyCode,
        });
    return button;
}

function keyboardExtensionOverlayHeightListener(
    terminal: Terminal,
    keyboardExtElement: HTMLElement,
) {
    let lastHeight = 0;
    const checkHeight = () => {
        const currentHeight = window.visualViewport.height;

        if (currentHeight !== lastHeight) {
            terminal.element.dispatchEvent(new Event("resize"));
            keyboardExtElement.style.height = currentHeight + "px";
        }

        lastHeight = currentHeight;

        window.requestAnimationFrame(checkHeight);
    };
    checkHeight();
}

function keyboardExtensionShowHideOnTerminalFocus(
    terminal: Terminal,
    keyboardExtElement: HTMLElement,
) {
    let hideThrottler: ReturnType<typeof setTimeout>;
    const hideKeyboardExt = () => {
        if (hideThrottler) {
            clearTimeout(hideThrottler);
        }
        hideThrottler = setTimeout(() => {
            keyboardExtElement.classList.remove("show");
            hideThrottler = null;
        }, 100);
    };

    let lastFocusedElement = null;
    const checkFocus = () => {
        const currentFocusedElement = document.activeElement;

        if (currentFocusedElement !== lastFocusedElement) {
            if (currentFocusedElement === terminal.textarea) {
                if (hideThrottler) {
                    clearTimeout(hideThrottler);
                }
                keyboardExtElement.classList.add("show");
            } else {
                hideKeyboardExt();
            }
        }

        lastFocusedElement = currentFocusedElement;

        window.requestAnimationFrame(checkFocus);
    };
    checkFocus();
}
