import { CommandHandler, createTerminal } from "./terminal";
import { AutocompleteHandler } from "./local-echo";

export type CommandExec = (
    args: string[],
    it: Parameters<CommandHandler>[1],
) => Promise<void> | void;

export type Command = {
    name: string;
    exec: CommandExec;
    alias?: string[];
    subcommands?: Command[];
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

    if (!subcommand) {
        return {
            cmd,
            depth: depth - 1,
        };
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

function createHandlers(commands: Command[]) {
    const autocomplete: AutocompleteHandler = (index, tokens) => {
        tokens = new Array(index + 1).fill(null).map((_, i) => tokens[i] || "");
        const cmds = recurseInSubCommands(commands, tokens.slice(0, -1));
        return cmds.map(({ name }) => name);
    };

    const command: CommandHandler = async (cmdStr, it) => {
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

    return {
        autocomplete,
        command
    };
}

export default function (container: HTMLElement, commands: Command[]) {
    return createTerminal(container, createHandlers(commands));
}
