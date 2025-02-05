import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import LocalEchoController, { AutocompleteHandler } from "./local-echo";

export type CommandHandler = (
    command: string,
    interact: {
        print: (str: string) => void;
        println: (str: string) => void;
        clear: () => void;
    },
) => void | Promise<void>;

export function createTerminal(
    domElement: HTMLElement,
    handlers: {
        command: CommandHandler;
        autocomplete: AutocompleteHandler;
    },
) {
    const { terminal, dispose } = createXtermTerminal(domElement);

    const keyboardExt = setupKeyboardExtension(
        domElement,
        terminal,
        (button) => {
            terminal.textarea.dispatchEvent(
                new KeyboardEvent("keydown", button),
            );
            terminal.focus();
        },
    );

    const localEcho = setupLocalEcho(terminal, handlers);

    return {
        dispose: () => {
            dispose();
            keyboardExt.dispose();
            localEcho.dispose();
        },
    };
}

function createXtermTerminal(domElement: HTMLElement) {
    const terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(domElement);

    // allow ios device to grab and paste
    terminal.onRender(() => {
        terminal.textarea.style.width = "40px";
        terminal.textarea.style.height = "40px";
    });

    const fit = () => fitAddon.fit();

    window.addEventListener("resize", fit);
    const containerSizeListenner = checkForContainerSize(domElement, fit);
    fit();

    return {
        terminal,
        dispose: () => {
            containerSizeListenner.stop();
            window.removeEventListener("resize", fit);
            terminal.dispose();
        },
    };
}

function checkForContainerSize(
    domElement: HTMLElement,
    onSizeChange: () => void,
    intervalMs: number = 200,
) {
    let stop = false;

    let lastCheck = 0,
        lastHeight = 0,
        lastWidth = 0;
    const checkSize = () => {
        if (stop) return;

        const now = Date.now();

        if (now - lastCheck > intervalMs) {
            const { height, width } = domElement.getBoundingClientRect();

            if (lastHeight !== height || lastWidth !== width) {
                console.log("RESIZE", height, width);
                onSizeChange();
            }

            lastHeight = height;
            lastWidth = width;
            lastCheck = now;
        }

        window.requestAnimationFrame(checkSize);
    };
    checkSize();

    return {
        stop: () => (stop = true),
    };
}

function setupLocalEcho(
    terminal: Terminal,
    handlers: {
        command: CommandHandler;
        autocomplete: AutocompleteHandler;
    },
) {
    const localEcho = new LocalEchoController(terminal);

    localEcho.addAutocompleteHandler(handlers.autocomplete);

    const interact: Parameters<CommandHandler>[1] = {
        print: (str) => localEcho.print(str),
        println: (str) => localEcho.println(str),
        clear: () => localEcho.clearInput(),
    };

    const loop = async () => {
        try {
            const cmd = await localEcho.read("~$ ");
            const maybePromise = handlers.command(cmd, interact);
            if (maybePromise instanceof Promise) await maybePromise;
        } catch (e) {
            console.log(e);
        }

        loop();
    };

    loop();

    return {
        dispose: () => {
            localEcho.abortRead();
            localEcho.dispose();
        },
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

    const heightListener =
        keyboardExtensionOverlayHeightListener(keyboardExtension);
    const showHideListener = keyboardExtensionShowHideFocus(
        container,
        terminal,
        keyboardExtension,
        toolbar,
    );

    const tabButton = createButton("tab", "Tab", 9, onButtonClick);
    const leftButton = createButton("<", "ArrowLeft", 37, onButtonClick);
    const rightButton = createButton(">", "ArrowRight", 39, onButtonClick);

    toolbar.append(tabButton, leftButton, rightButton);
    keyboardExtension.append(toolbar);

    document.body.append(keyboardExtension);

    return {
        dispose: () => {
            heightListener.stop();
            showHideListener.stop();
            keyboardExtension.remove();
        },
    };
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
    keyboardExtElement: HTMLElement,
) {
    let stop = false;

    let lastHeight = 0;
    const checkHeight = () => {
        if (stop) return;

        const currentHeight = window.visualViewport.height;

        if (currentHeight !== lastHeight) {
            keyboardExtElement.style.height = currentHeight + "px";
        }

        lastHeight = currentHeight;

        window.requestAnimationFrame(checkHeight);
    };
    checkHeight();

    return {
        stop: () => (stop = true),
    };
}

function keyboardExtensionShowHideFocus(
    container: HTMLElement,
    terminal: Terminal,
    keyboardExtElement: HTMLElement,
    toolbar: HTMLElement,
) {
    let stop = false;

    
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

    let show = false;
    const checkFocus = () => {
        if (stop) return;

        if (
            document.activeElement === terminal.textarea && // terminal focus
            window.visualViewport.height !== document.body.clientHeight && // probably soft keyboard
            !show // keyboard ext not showed yet
        ) {
            show = true;
            
            if (hideThrottler) {
                clearTimeout(hideThrottler);
            }

            keyboardExtElement.classList.add("show");
            container.style.transition = `0.3s margin-bottom`;
            container.style.marginBottom =
                toolbar.getBoundingClientRect().height + "px";
        } else if(
            document.activeElement !== terminal.textarea && // terminal blurred
            show // keyboard ext still shown
        ) {
            show = false;
            hideKeyboardExt()
        }

        window.requestAnimationFrame(checkFocus);
    };
    checkFocus();

    return {
        stop: () => (stop = true),
    };
}
