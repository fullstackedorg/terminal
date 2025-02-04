import StackNav from "@fullstacked/stack-navigation";
import { CommandHandler, createTerminal } from "./terminal";
import eruda from "eruda";
eruda.init();

const sn = new StackNav();

const view = document.createElement("main");
sn.navigate(view, {
    bgColor: "coral"
});

const commandHandler: CommandHandler = async (cmd, it) => {
    if(cmd === "hello") {
        it.println("world")
    }

    if(cmd === "progress") {
        const max = 100;
        const blockCount = 10;
        for(let i = 0; i < max; i++) {
            const blocks = Math.ceil((i / max ) * blockCount)
            let progressBar = "";
            for(let j = 0; j <= blockCount; j++) {
                progressBar += j < blocks ? "=" : " ";
            }
            
            it.clear();
            it.print(`[${progressBar}] ` + i + "%");
            await new Promise(res => setTimeout(res, 50));
        }
        it.clear();
        it.println(`[===========] 100%`);
    }
}

const terminalContainer = document.createElement("div");
terminalContainer.classList.add("terminal-container");
view.append(terminalContainer);
createTerminal(terminalContainer, commandHandler).start();
