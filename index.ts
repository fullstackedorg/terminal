import StackNav from "@fullstacked/stack-navigation";
import { createTerminal } from "./terminal";
import eruda from "eruda";
eruda.init();

const sn = new StackNav();

const view = document.createElement("main");
sn.navigate(view, {
    bgColor: "coral"
});

const terminalContainer = document.createElement("div");
terminalContainer.classList.add("terminal-container");
view.append(terminalContainer);
createTerminal(terminalContainer).start();