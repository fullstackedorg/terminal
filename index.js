import StackNav from "@fullstacked/stack-navigation";
import terminal from ".";
import {commands} from "./commands";
import eruda from "eruda";
eruda.init();

const sn = new StackNav();

const view = document.createElement("main");
sn.navigate(view, {
    bgColor: "coral",
});

const terminalContainer = document.createElement("div");
terminalContainer.classList.add("terminal-container");
view.append(terminalContainer);

terminal(terminalContainer, commands, "Hello from FullStacked Terminal", {some: "ctx"});
