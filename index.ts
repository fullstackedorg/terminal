import StackNav from "@fullstacked/stack-navigation";
import { CommandHandler, createTerminal } from "./terminal";
import eruda from "eruda";
import { AutocompleteHandler } from "./local-echo";
eruda.init();

const sn = new StackNav();

const view = document.createElement("main");
sn.navigate(view, {
    bgColor: "coral",
});

const commands: {
    [cmd: string]: (it: Parameters<CommandHandler>[1]) => Promise<void> | void;
} = {
    hello: (it) => {
        it.println("world");
    },
    progress: async (it) => {
        const max = 100;
        const blockCount = 10;
        for (let i = 0; i < max; i++) {
            const blocks = Math.ceil((i / max) * blockCount);
            let progressBar = "";
            for (let j = 0; j <= blockCount; j++) {
                progressBar += j < blocks ? "=" : " ";
            }

            it.clear();
            it.print(`[${progressBar}] ` + i + "%");
            await new Promise((res) => setTimeout(res, 50));
        }
        it.clear();
        it.println(`[===========] 100%`);
    },
};

const commandHandler: CommandHandler = async (cmd, it) => {
    return commands[cmd.trim()]?.(it);
};
const autompleteHandler: AutocompleteHandler = () => Object.keys(commands);

const terminalContainer = document.createElement("div");
terminalContainer.classList.add("terminal-container");
view.append(terminalContainer);
createTerminal(terminalContainer, commandHandler, autompleteHandler).start();
