import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import LocalEchoController from "./local-echo";

export function createTerminal(domElement: HTMLElement) {
    const terminal = createXtermTerminal(domElement);

    setupKeyboardExtension(domElement, terminal, (button) => {
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
    container: HTMLElement,
    terminal: Terminal,
    onButtonClick: (p: ButtonClickParam) => void,
) {
    const keyboardExtension = document.createElement("div");
    keyboardExtension.classList.add("keyboard-extension");

    const toolbar = document.createElement("div");

    keyboardExtensionOverlayHeightListener(terminal, keyboardExtension);
    keyboardExtensionShowHideOnTerminalFocus(
        container, 
        terminal, 
        keyboardExtension,
        toolbar
    );


    const tabButton = createButton("tab", "Tab", 9, onButtonClick);
    const leftButton = createButton("<", "ArrowLeft", 37, onButtonClick);
    const rightButton = createButton(">", "ArrowRight", 39, onButtonClick);

    toolbar.append(tabButton, leftButton, rightButton);
    keyboardExtension.append(toolbar);

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
    container: HTMLElement,
    terminal: Terminal,
    keyboardExtElement: HTMLElement,
    toolbar: HTMLElement
) {
    let hideThrottler: ReturnType<typeof setTimeout>;
    const hideKeyboardExt = () => {
        if (hideThrottler) {
            clearTimeout(hideThrottler);
        }
        hideThrottler = setTimeout(() => {
            container.style.transition = null;
            container.style.marginBottom = null;
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
                container.style.transition = `0.3s margin-bottom`;
                container.style.marginBottom = toolbar.getBoundingClientRect().height + "px";
            } else {
                hideKeyboardExt();
            }
        }

        lastFocusedElement = currentFocusedElement;

        window.requestAnimationFrame(checkFocus);
    };
    checkFocus();
}
