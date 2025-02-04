import StackNav from "@fullstacked/stack-navigation";
import { CommandHandler, createTerminal } from "./terminal";
import { color } from 'console-log-colors';
import eruda from "eruda";
import { AutocompleteHandler } from "./local-echo";
eruda.init();

const sn = new StackNav();

const view = document.createElement("main");
sn.navigate(view, {
    bgColor: "coral",
});

type CommandExec = (
    args: string[],
    it: Parameters<CommandHandler>[1],
) => Promise<void> | void;

type Command = {
    name: string;
    exec: CommandExec;
    alias?: string[];
    subcommands?: Command[];
};

const commands: Command[] = [
    {
        name: "error",
        alias: ["e"],
        exec: (args, it) => {
            it.println(color.red(args.join(" ")))
        }
    },
    {
        name: "hello",
        alias: ["h"],
        exec: (_, it) => {
            it.println("world");
        },
        subcommands: [
            {
                name: "world",
                alias: ["w"],
                exec: (args, it) => {
                    if (args.length === 0) {
                        it.println("please tell me your name");
                    } else {
                        it.println("hello to you " + args.join(" "));
                    }
                },
            },
        ],
    },
    {
        name: "progress",
        alias: ["p"],
        exec: async (args, it) => {
            const bar = args.includes("-b") || args.includes("--bar");

            const max = 100;
            const blockCount = 10;
            for (let i = 0; i <= max; i++) {
                let line = "";

                if (bar) {
                    const blocks = Math.floor((i / max) * blockCount);
                    let progressBar = "";
                    for (let j = 0; j < blockCount; j++) {
                        progressBar += j < blocks ? "=" : " ";
                    }

                    line += `[${progressBar}] `;
                }

                line += `${i}%`;

                it.clear();
                it.print(line);
                await new Promise((res) => setTimeout(res, 50));
            }
            it.println(color.green(" Done"));
        },
    },
    {
        name: "npm",
        exec: (_, it) => {it.println("npm")},
        subcommands: [{
            name: "install",
            alias: ["i"],
            exec: (args, it) => { 
                if(args.length === 0) {
                    it.println("no package to install")
                    return;
                }
                it.println(`installing ${args.join(", ")}`)
            }
        }]
    }
];

const commandHandler: CommandHandler = async (cmdStr, it) => {
    const args = cmdStr
        .trim()
        .split(" ")
        .filter((a) => a !== "");
    if (args.length === 0) {
        return;
    }

    const commandName = args.at(0);
    const command = commands.find(
        ({ name, alias }) =>
            name === commandName || alias?.find((a) => a === commandName),
    );

    if (!command) {
        it.println(`command not found: ${commandName}`);
        return;
    }

    const { cmd, depth } = recurseInCommand(command, args.slice(1), 1);

    return cmd.exec(args.slice(depth + 1), it);
};

function recurseInCommand(cmd: Command, args: string[], depth = 0) {
    if (args.length === 0) {
        return {
            cmd,
            depth,
        };
    }

    const arg = args.shift();
    const subcommand = cmd.subcommands?.find(
        ({ name, alias }) => name === arg || alias?.find((a) => a === arg),
    );

    if(!subcommand) {
        return {
            cmd,
            depth: depth - 1
        }
    }

    return recurseInCommand(subcommand, args, depth + 1);
}

function recurseInSubCommands(cmds: Command[], args: string[]) {
    if (args.length === 0) {
        return cmds;
    }

    const token = args.shift();

    const cmd = cmds.find(
        ({ name, alias }) => name === token || alias?.find((a) => a === token),
    );
    if (!cmd?.subcommands) {
        return [];
    }

    return recurseInSubCommands(cmd.subcommands, args);
}

const autompleteHandler: AutocompleteHandler = (index, tokens) => {
    tokens = new Array(index + 1).fill(null).map((_, i) => tokens[i] || "");
    const cmds = recurseInSubCommands(commands, tokens.slice(0, -1));
    return cmds.map(({ name }) => name);
};

const terminalContainer = document.createElement("div");
terminalContainer.classList.add("terminal-container");
view.append(terminalContainer);
createTerminal(terminalContainer, commandHandler, autompleteHandler).start();
